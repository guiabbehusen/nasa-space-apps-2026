"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck, Download, RefreshCw } from "lucide-react";

type Props = { busy: boolean };
type Phase =
  | "idle"
  | "preparing"
  | "saved"
  | "ready"
  | "older"
  | "unsupported"
  | "development";
type WorkerStatus = {
  type: "CREW_OFFLINE_STATUS";
  version: string;
  ready: boolean;
};
const isOurWorker = (worker: ServiceWorker | null) =>
  !!worker && new URL(worker.scriptURL).pathname === "/crew-support-sw.js";

function askStatus(worker: ServiceWorker): Promise<WorkerStatus> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      channel.port1.close();
      reject(
        new Error("Offline status is unavailable. Try again when connected."),
      );
    }, 8000);
    channel.port1.onmessage = (event: MessageEvent<WorkerStatus>) => {
      clearTimeout(timeout);
      channel.port1.close();
      if (
        event.data?.type !== "CREW_OFFLINE_STATUS" ||
        typeof event.data.ready !== "boolean"
      ) {
        reject(new Error("This offline copy could not be verified."));
        return;
      }
      resolve(event.data);
    };
    try {
      worker.postMessage({ type: "CREW_OFFLINE_STATUS" }, [channel.port2]);
    } catch (cause) {
      clearTimeout(timeout);
      channel.port1.close();
      reject(cause);
    }
  });
}

function waitForInstall(
  registration: ServiceWorkerRegistration,
): Promise<ServiceWorker> {
  return new Promise((resolve, reject) => {
    let watched: ServiceWorker | null = null;
    const cleanup = () => {
      clearTimeout(timeout);
      registration.removeEventListener("updatefound", inspect);
      watched?.removeEventListener("statechange", inspect);
    };
    const inspect = () => {
      const installing = registration.installing;
      if (installing && watched !== installing) {
        watched?.removeEventListener("statechange", inspect);
        watched = installing;
        watched.addEventListener("statechange", inspect);
      }
      if (watched?.state === "redundant") {
        cleanup();
        reject(
          new Error(
            "The offline copy could not be saved. Keep the previous copy and try again online.",
          ),
        );
        return;
      }
      const available =
        registration.waiting ??
        (watched?.state === "activated" ? watched : null) ??
        (!installing ? registration.active : null);
      if (available) {
        cleanup();
        resolve(available);
      }
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "Offline preparation is taking longer than expected. Reconnect and try again.",
        ),
      );
    }, 45000);
    registration.addEventListener("updatefound", inspect);
    inspect();
  });
}

export default function CrewOffline({ busy }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [online, setOnline] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const mounted = useRef(false);

  const refresh = async (registration: ServiceWorkerRegistration | null) => {
    if (!mounted.current) return;
    if (registration) {
      registrationRef.current = registration;
      setRegistration(registration);
    }
    setWaiting(!!registration?.waiting);
    const controller = navigator.serviceWorker.controller;
    if (isOurWorker(controller)) {
      const status = await askStatus(controller!);
      const currentBuild = document
        .querySelector('meta[name="still-here-offline-build"]')
        ?.getAttribute("content");
      if (mounted.current)
        setPhase(
          status.ready
            ? status.version === currentBuild
              ? "ready"
              : "older"
            : "idle",
        );
    } else if (registration?.active && isOurWorker(registration.active)) {
      const status = await askStatus(registration.active);
      if (mounted.current) setPhase(status.ready ? "saved" : "idle");
    } else if (mounted.current) setPhase("idle");
  };

  useEffect(() => {
    mounted.current = true;
    if (process.env.NODE_ENV !== "production") {
      setPhase("development");
      return () => {
        mounted.current = false;
      };
    }
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      setPhase("unsupported");
      return () => {
        mounted.current = false;
      };
    }
    const connection = () => setOnline(navigator.onLine);
    const controllerChanged = () => {
      void refresh(registrationRef.current).catch(() => {
        if (mounted.current) setPhase("idle");
      });
    };
    connection();
    void navigator.serviceWorker
      .getRegistration("/")
      .then((registration) => {
        if (
          registration &&
          [
            registration.active,
            registration.waiting,
            registration.installing,
          ].some(isOurWorker)
        )
          return refresh(registration);
      })
      .catch(() => {
        if (mounted.current) setPhase("idle");
      });
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChanged,
    );
    return () => {
      mounted.current = false;
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerChanged,
      );
    };
  }, []);

  useEffect(() => {
    if (!registration) return;
    let watched: ServiceWorker | null = null;
    const changed = () => {
      if (watched?.state === "installed" || watched?.state === "activated")
        void refresh(registration).catch(() => {
          if (mounted.current) setWaiting(!!registration.waiting);
        });
    };
    const found = () => {
      watched?.removeEventListener("statechange", changed);
      watched = registration.installing;
      watched?.addEventListener("statechange", changed);
    };
    registration.addEventListener("updatefound", found);
    found();
    return () => {
      registration.removeEventListener("updatefound", found);
      watched?.removeEventListener("statechange", changed);
    };
  }, [registration]);

  const prepare = async () => {
    setError("");
    setPhase("preparing");
    try {
      const registration = await navigator.serviceWorker.register(
        "/crew-support-sw.js",
        { scope: "/", updateViaCache: "none" },
      );
      registrationRef.current = registration;
      setRegistration(registration);
      await registration.update();
      const worker = await waitForInstall(registration);
      const status = await askStatus(worker);
      if (!status.ready)
        throw new Error(
          "The offline copy is incomplete. Reconnect and prepare it again.",
        );
      await refresh(registration);
    } catch (cause) {
      if (!mounted.current) return;
      setError(
        cause instanceof Error ? cause.message : "Offline preparation failed.",
      );
      await refresh(registrationRef.current).catch(() => {
        if (mounted.current) setPhase("idle");
      });
    }
  };

  const activate = async () => {
    if (busy) return;
    setError("");
    const worker = registrationRef.current?.waiting;
    if (!worker) {
      window.location.reload();
      return;
    }
    try {
      const status = await askStatus(worker);
      if (!status.ready) throw new Error("The new offline copy is incomplete.");
      setPhase("preparing");
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          worker.removeEventListener("statechange", changed);
          reject(
            new Error("The offline update did not activate. Try again online."),
          );
        }, 10000);
        const changed = () => {
          if (worker.state === "activated") {
            clearTimeout(timeout);
            worker.removeEventListener("statechange", changed);
            resolve();
          } else if (worker.state === "redundant") {
            clearTimeout(timeout);
            worker.removeEventListener("statechange", changed);
            reject(new Error("The offline update could not be activated."));
          }
        };
        worker.addEventListener("statechange", changed);
        worker.postMessage({ type: "CREW_OFFLINE_ACTIVATE" });
        changed();
      });
      window.location.reload();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The offline update failed.",
      );
      await refresh(registrationRef.current).catch(() => setPhase("idle"));
    }
  };

  if (phase === "development")
    return (
      <p className="crew-offline-note">
        Offline preparation is available in the production build.
      </p>
    );
  if (phase === "unsupported")
    return (
      <p className="crew-offline-note">
        This browser cannot prepare an offline copy. Use a supported browser
        over HTTPS before a mission.
      </p>
    );

  return (
    <section className="crew-offline" aria-label="Offline support">
      <p role="status" aria-live="polite">
        {phase === "ready" ? (
          <>
            <CheckCheck size={16} aria-hidden="true" /> Offline support ready on
            this browser.
          </>
        ) : phase === "older" ? (
          "An older offline copy is saved. Prepare this version before relying on it."
        ) : phase === "saved" ? (
          "Offline copy saved. Reload once to activate it."
        ) : phase === "preparing" ? (
          "Preparing the complete offline copy…"
        ) : (
          "Prepare an offline copy before a mission."
        )}
      </p>
      {waiting && <p>An updated offline copy is available.</p>}
      {phase === "saved" || waiting ? (
        <button
          type="button"
          className="secondary-button"
          onClick={() => void activate()}
          disabled={busy || phase === "preparing"}
        >
          <RefreshCw size={16} />
          {waiting ? "Update offline copy" : "Reload to activate offline copy"}
        </button>
      ) : (
        <button
          type="button"
          className="secondary-button"
          onClick={() => void prepare()}
          disabled={!online || phase === "preparing"}
        >
          <Download size={16} />
          {phase === "ready" ? "Check offline copy" : "Prepare offline support"}
        </button>
      )}
      {busy && (phase === "saved" || waiting) && (
        <small>
          Finish support before reloading or updating the offline copy.
        </small>
      )}
      {!online && phase !== "ready" && (
        <small>Reconnect to prepare and verify the offline copy.</small>
      )}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <small>
        App files only. Clearing browser data removes the offline copy. First
        preparation requires a connection.
      </small>
    </section>
  );
}

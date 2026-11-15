"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Box, RefreshCw } from "lucide-react";
import { LABELS, type Keepsake } from "@/lib/keepsake";
import { recognizePhoto } from "@/lib/recognize";

const Viewer = dynamic(() => import("./KeepsakeViewer"), { ssr: false });
type Props = {
  photo: string;
  alt?: string;
  model?: Keepsake;
  visibleInBook?: boolean;
  onChange?: (next?: Keepsake) => void;
};

export function PhotoObject({
  photo,
  alt = "Album photo",
  model,
  visibleInBook = true,
  onChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [transition, setTransition] = useState<"idle" | "waiting" | "lifting">(
    "idle",
  );
  const ask = useRef<HTMLDialogElement>(null);
  const review = useRef<HTMLDialogElement>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const serial = useRef(0);
  useEffect(
    () => () => {
      serial.current++;
    },
    [],
  );
  useEffect(() => {
    if (transition !== "lifting") return;
    const timer = window.setTimeout(() => setTransition("idle"), 1150);
    return () => clearTimeout(timer);
  }, [transition]);

  function apply(next: Keepsake | undefined, closeReview = false) {
    onChange?.(next);
    if (closeReview) review.current?.close();
  }
  async function transform() {
    ask.current?.close();
    setError("");
    setBusy(true);
    const id = ++serial.current;
    try {
      const result = await recognizePhoto(photo);
      if (id !== serial.current) return;
      setTransition(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "idle"
          : "waiting",
      );
      onChange?.({
        version: 1,
        ...result,
        style: "faceted",
        variant: 0,
      });
    } catch (e) {
      if (id === serial.current) {
        setTransition("idle");
        setError(
          e instanceof Error
            ? e.message
            : "Could not recognize this photo. Try again.",
        );
      }
    } finally {
      if (id === serial.current) setBusy(false);
    }
  }
  const onDraw = () => {
    setTransition((now) => (now === "waiting" ? "lifting" : now));
  };
  return (
    <div
      inert={!onChange}
      className={"page-object " + (model ? "object-present" : "photo-present")}
      data-opf-no-flip={model ? undefined : ""}
      onKeyDown={(e) => {
        if (e.key.startsWith("Arrow")) e.stopPropagation();
      }}
    >
      {model ? (
        <>
          <div
            className={"page-object-surface motion-" + transition}
            aria-busy={busy}
          >
            {visibleInBook && (
              <Viewer
                model={model}
                onDraw={onDraw}
                resetVersion={resetVersion}
                onReview={() => review.current?.showModal()}
              />
            )}
            {transition !== "idle" && (
              <div className="photo-facets" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <img
                    key={i}
                    src={photo}
                    alt=""
                    draggable={false}
                    className={"photo-shard shard-" + i}
                  />
                ))}
              </div>
            )}
          </div>
          <dialog
            ref={review}
            className="object-dialog object-review"
            data-opf-no-flip=""
            aria-label="Review miniature"
          >
            <h2>{LABELS[model.kind]} in 3D</h2>
            <label>
              Rate this miniature
              <select
                disabled={busy}
                value={model.rating ?? ""}
                onChange={(e) =>
                  apply({
                    ...model,
                    style: "faceted",
                    rating: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              >
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option value={n} key={n}>
                    {n} out of 5
                  </option>
                ))}
              </select>
            </label>
            <div className="object-entry">
              <button
                type="button"
                disabled={busy}
                className="object-link"
                onClick={() =>
                  apply(
                    {
                      ...model,
                      style: "faceted",
                      variant: (model.variant + 1) % 256,
                      rating: undefined,
                    },
                    true,
                  )
                }
              >
                <RefreshCw size={14} /> Generate another version
              </button>
              <button
                type="button"
                disabled={busy}
                className="plain-object"
                onClick={() => apply(undefined, true)}
              >
                Restore photo
              </button>
            </div>
            <div className="object-entry">
              <button
                type="button"
                className="plain-object"
                onClick={() => {
                  setResetVersion((version) => version + 1);
                  review.current?.close();
                }}
              >
                Reset orientation
              </button>
              <button
                type="button"
                className="object-link"
                onClick={() => review.current?.close()}
              >
                Close
              </button>
            </div>
          </dialog>
        </>
      ) : (
        <>
          <button
            type="button"
            className="transform-photo"
            disabled={busy}
            aria-label={"Turn into 3D: " + alt}
            onClick={() => ask.current?.showModal()}
          >
            <img src={photo} alt={alt} draggable={false} />
            <span>
              <Box size={14} aria-hidden="true" /> 3D
            </span>
          </button>
          {busy && (
            <p role="status" className="object-caption">
              Recognizing the subject on your device…
            </p>
          )}
          <dialog
            ref={ask}
            className="object-dialog"
            aria-label="Turn this photo into 3D?"
          >
            <h2>Turn this photo into 3D?</h2>
            <p>
              The miniature sits where the photo was. Drag it to rotate, or click it to review.
            </p>
            <div className="object-entry">
              <button
                autoFocus
                type="button"
                className="object-link"
                onClick={() => ask.current?.close()}
              >
                Keep photo
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => void transform()}
              >
                Create miniature
              </button>
            </div>
          </dialog>
        </>
      )}
      {error && (
        <p className="object-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

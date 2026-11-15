/* The postbuild script replaces these literals with this build's offline manifest. */
const BUILD_VERSION = /* CREW_BUILD_VERSION */ "development-disabled";
const PRECACHE = /* CREW_PRECACHE */ [];
const CACHE_NAME = `still-here-crew-support-${BUILD_VERSION}`;
const COMPLETE_KEY = new URL("/__crew_offline_complete__", self.location.origin)
  .href;
const entries = new Map(PRECACHE.map((entry) => [entry.url, entry]));

function isExpectedResponse(response, path) {
  if (!response.ok || response.redirected) return false;
  const finalUrl = new URL(response.url);
  if (finalUrl.origin !== self.location.origin || finalUrl.pathname !== path)
    return false;
  const type = response.headers.get("content-type") || "";
  if (path === "/") return type.includes("text/html");
  if (path.endsWith(".js")) return /javascript|ecmascript/.test(type);
  if (path.endsWith(".css")) return type.includes("text/css");
  return !type.includes("text/html");
}

async function fetchEntry(entry) {
  const request = new Request(new URL(entry.url, self.location.origin), {
    credentials: "same-origin",
    cache: "reload",
    ...(entry.integrity ? { integrity: entry.integrity } : {}),
  });
  const response = await fetch(request);
  if (!isExpectedResponse(response, entry.url))
    throw new Error("Offline asset unavailable");
  if (entry.url === "/") {
    const html = await response.clone().text();
    if (
      !html.includes(
        `<meta name="still-here-offline-build" content="${BUILD_VERSION}">`,
      )
    )
      throw new Error("The offline shell does not match this build");
  }
  return response;
}

async function cacheComplete() {
  if (!PRECACHE.length) return false;
  const cache = await caches.open(CACHE_NAME);
  if (!(await cache.match(COMPLETE_KEY))) return false;
  const found = await Promise.all(
    PRECACHE.map((entry) =>
      cache.match(new URL(entry.url, self.location.origin)),
    ),
  );
  return found.every(Boolean);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (BUILD_VERSION === "development-disabled" || !PRECACHE.length)
        throw new Error("Offline preparation requires a production build");
      try {
        // Fetch and validate the complete version before writing its completion marker.
        const responses = await Promise.all(PRECACHE.map(fetchEntry));
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(
          PRECACHE.map((entry, index) =>
            cache.put(
              new URL(entry.url, self.location.origin),
              responses[index],
            ),
          ),
        );
        await cache.put(COMPLETE_KEY, new Response(BUILD_VERSION));
      } catch (error) {
        await caches.delete(CACHE_NAME);
        throw error;
      }
      // An existing worker stays active until the person explicitly accepts an update.
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (!(await cacheComplete()))
        throw new Error("Offline copy is incomplete");
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith("still-here-crew-support-") &&
              name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );
      // No clients.claim(): a running support session must keep its current build.
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CREW_OFFLINE_STATUS") {
    event.waitUntil(
      (async () => {
        const ready = await cacheComplete();
        event.ports[0]?.postMessage({
          type: "CREW_OFFLINE_STATUS",
          version: BUILD_VERSION,
          ready,
        });
      })(),
    );
  }
  if (event.data?.type === "CREW_OFFLINE_ACTIVATE") {
    event.waitUntil(
      (async () => {
        if (await cacheComplete()) await self.skipWaiting();
      })(),
    );
  }
});

async function rootNavigation(request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    // Online authentication responses always pass through and are never cached.
    return await fetch(request, { signal: controller.signal });
  } catch {
    if (await cacheComplete()) {
      const cache = await caches.open(CACHE_NAME);
      const page = await cache.match(new URL("/", self.location.origin));
      if (page) return page;
    }
    return new Response(
      "Offline support is not prepared on this browser. Reconnect and prepare an offline copy.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.search
  )
    return;
  if (request.mode === "navigate") {
    if (url.pathname === "/") event.respondWith(rootNavigation(request));
    return;
  }
  const entry = entries.get(url.pathname);
  if (!entry || entry.url === "/") return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url.href);
      if (cached) return cached;
      const response = await fetchEntry(entry);
      await cache.put(url.href, response.clone());
      return response;
    })(),
  );
});

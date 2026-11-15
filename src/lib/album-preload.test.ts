import assert from "node:assert/strict";
import test from "node:test";
import { preloadAlbumMedia, warmReaderFonts } from "./album-preload";

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

async function withBrowserGlobals(
  values: { Image?: unknown; document?: unknown },
  run: () => void | Promise<void>,
) {
  const keys = ["Image", "document"] as const;
  const originals = keys.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key),
  );
  for (const key of keys)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: values[key],
    });
  try {
    await run();
  } finally {
    keys.forEach((key, index) => {
      const original = originals[index];
      if (original) Object.defineProperty(globalThis, key, original);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
}

function fakeImages() {
  const created: FakeImage[] = [];
  class FakeImage {
    src = "";
    decoding = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readonly result = deferred();
    decodeCalls = 0;
    constructor() {
      created.push(this);
    }
    decode() {
      this.decodeCalls += 1;
      return this.result.promise;
    }
  }
  return { Image: FakeImage, created };
}

// Let decode, finally and retry handlers settle before checking another intent.
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

test(
  "album hover, focus and click share at most one decode per opening photo",
  { concurrency: false },
  async () => {
    const images = fakeImages();
    await withBrowserGlobals(images, async () => {
      const sources = [
        "/intent/cover.jpg",
        "/intent/one.jpg",
        "/intent/two.jpg",
      ];
      assert.equal(
        preloadAlbumMedia([sources[0], ...sources, "/intent/farther.jpg"]),
        undefined,
      );
      preloadAlbumMedia(sources);
      preloadAlbumMedia(sources);
      assert.deepEqual(
        images.created.map((image) => image.src),
        sources,
      );
      assert.ok(
        images.created.every(
          (image) => image.decoding === "async" && image.decodeCalls === 1,
        ),
      );
      images.created.forEach((image) => image.result.resolve());
      await settle();
      preloadAlbumMedia(sources);
      assert.equal(
        images.created.length,
        3,
        "settled preparations also deduplicate later intent",
      );
      assert.ok(
        images.created.every(
          (image) => image.onload === null && image.onerror === null,
        ),
      );
    });
  },
);

test(
  "preparation retains eight recent photos and permits retry after eviction",
  { concurrency: false },
  async () => {
    const images = fakeImages();
    await withBrowserGlobals(images, async () => {
      const sources = Array.from(
        { length: 8 },
        (_, index) => `/bounded/${index}.jpg`,
      );
      for (let index = 0; index < sources.length; index += 3)
        preloadAlbumMedia(sources.slice(index, index + 3));
      assert.equal(images.created.length, 8);
      preloadAlbumMedia([sources[0], sources[7]]);
      assert.equal(images.created.length, 8);
      preloadAlbumMedia(["/bounded/newest.jpg"]);
      preloadAlbumMedia([sources[0], "/bounded/newest.jpg"]);
      assert.deepEqual(
        images.created.slice(8).map((image) => image.src),
        ["/bounded/newest.jpg", sources[0]],
      );
      images.created.forEach((image) => image.result.resolve());
      await settle();
    });
  },
);

test(
  "failed decode or load stays nonblocking, releases handlers and allows another attempt",
  { concurrency: false },
  async () => {
    const images = fakeImages();
    await withBrowserGlobals(images, async () => {
      assert.equal(preloadAlbumMedia(["/failure/decode.jpg"]), undefined);
      images.created[0].result.reject(new Error("Unavailable decoder"));
      await settle();
      assert.equal(images.created[0].onerror, null);
      preloadAlbumMedia(["/failure/decode.jpg"]);
      assert.equal(images.created.length, 2);
      images.created[1].result.resolve();
      await settle();
    });

    const created: LoadingImage[] = [];
    class LoadingImage {
      src = "";
      decoding = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        created.push(this);
      }
    }
    await withBrowserGlobals({ Image: LoadingImage }, async () => {
      preloadAlbumMedia(["/failure/load.jpg"]);
      assert.equal(typeof created[0].onload, "function");
      created[0].onerror?.();
      await settle();
      preloadAlbumMedia(["/failure/load.jpg"]);
      assert.equal(created.length, 2);
      created[1].onload?.();
      await settle();
      assert.ok(
        created.every(
          (image) => image.onload === null && image.onerror === null,
        ),
      );
    });
  },
);

test(
  "font warming is safe without browser resources and coalesces loads while permitting failure retries",
  { concurrency: false },
  async () => {
    await withBrowserGlobals({}, async () => {
      await warmReaderFonts();
      assert.doesNotThrow(() => preloadAlbumMedia(["/server/no-image.jpg"]));
    });
    await withBrowserGlobals({ document: {} }, async () => {
      await warmReaderFonts();
    });
    await withBrowserGlobals({ document: { fonts: {} } }, async () => {
      await warmReaderFonts();
    });

    const attempts = [deferred(), deferred()];
    let calls = 0;
    await withBrowserGlobals(
      {
        document: {
          fonts: {
            load: (font: string) => {
              assert.match(font, /400.*Caveat/);
              calls += 1;
              if (calls === 1) throw new Error("Font loading unavailable");
              return attempts[calls - 2].promise;
            },
          },
        },
      },
      async () => {
        await warmReaderFonts();
        const first = warmReaderFonts();
        assert.equal(warmReaderFonts(), first);
        assert.equal(calls, 2);
        attempts[0].reject(new Error("Offline font"));
        await first;
        const retry = warmReaderFonts();
        assert.equal(calls, 3);
        assert.equal(warmReaderFonts(), retry);
        attempts[1].resolve();
        await retry;
        assert.equal(warmReaderFonts(), retry);
        assert.equal(calls, 3);
      },
    );
  },
);

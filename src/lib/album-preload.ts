// Intent-based preparation only: no page rendering or changes to saved content.
const imagePreparations = new Map<string, Promise<void>>();
const MAX_PREPARED_IMAGES = 8;
let fontPreparation: Promise<void> | undefined;

export function warmReaderFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load)
    return Promise.resolve();
  if (!fontPreparation) {
    try {
      fontPreparation = document.fonts.load('400 24px "Caveat"').then(
        () => undefined,
        () => {
          fontPreparation = undefined;
        },
      );
    } catch {
      return Promise.resolve();
    }
  }
  return fontPreparation;
}

/** Decode the selected cover/opening spread ahead of the 3D transition. */
export function preloadAlbumMedia(sources: readonly string[]): void {
  void warmReaderFonts();
  if (typeof Image === "undefined") return;
  for (const source of [...new Set(sources)].slice(0, 3)) {
    if (!source || imagePreparations.has(source)) continue;
    const image = new Image();
    image.decoding = "async";
    const preparation = new Promise<void>((resolve, reject) => {
      image.onerror = () => reject(new Error("Photo preparation unavailable"));
      if (typeof image.decode === "function") {
        image.src = source;
        void image.decode().then(resolve, reject);
      } else {
        image.onload = () => resolve();
        image.src = source;
      }
    }).finally(() => {
      image.onload = null;
      image.onerror = null;
    });
    imagePreparations.set(source, preparation);
    void preparation.catch(() => {
      // A failed warmup never blocks opening; the normal reader can retry.
      if (imagePreparations.get(source) === preparation)
        imagePreparations.delete(source);
    });
    while (imagePreparations.size > MAX_PREPARED_IMAGES)
      imagePreparations.delete(imagePreparations.keys().next().value!);
  }
}

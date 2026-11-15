import type { ObjectDetection } from "@tensorflow-models/coco-ssd";
import type * as TensorFlow from "@tensorflow/tfjs";
import { KINDS, type Kind } from "./keepsake";

type Globals = Window & {
  tf?: typeof TensorFlow;
  cocoSsd?: typeof import("@tensorflow-models/coco-ssd");
};
let loading: Promise<ObjectDetection> | undefined;
let petClassifier: Promise<TensorFlow.LayersModel> | undefined;

// MobileNet V1 uses the 1,000 ImageNet ILSVRC labels. These contiguous
// ranges cover domestic dog breeds and the five domestic cat classes.
async function classifyPet(canvas: HTMLCanvasElement, bbox: number[]) {
  const tf = (window as Globals).tf!;
  petClassifier ??= tf
    .loadLayersModel("/ai/mobilenet/model.json")
    .catch((error) => {
      petClassifier = undefined;
      throw error;
    });
  const classifier = await petClassifier;
  const [x, y, w, h] = bbox;
  const side = Math.max(w, h) * 1.1;
  const crop = document.createElement("canvas");
  crop.width = crop.height = 224;
  const ctx = crop.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 224, 224);
  ctx.drawImage(
    canvas,
    x + (w - side) / 2,
    y + (h - side) / 2,
    side,
    side,
    0,
    0,
    224,
    224,
  );
  const prediction = tf.tidy(() => {
    const input = tf.browser
      .fromPixels(crop)
      .toFloat()
      .div(127.5)
      .sub(1)
      .expandDims();
    return classifier.predict(input) as TensorFlow.Tensor;
  });
  try {
    const probabilities = await prediction.data();
    const sum = (first: number, last: number) => {
      let result = 0;
      for (let i = first; i <= last; i++) result += probabilities[i];
      return result;
    };
    const dog = sum(151, 268),
      cat = sum(281, 285);
    if (Math.max(dog, cat) < 0.45 || Math.abs(dog - cat) < 0.22)
      throw new Error(
        "Could not distinguish a cat from a dog. Try a clearer photo.",
      );
    return dog > cat ? "dog" : "cat";
  } finally {
    prediction.dispose();
  }
}
async function script(src: string) {
  await new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "/ai/runtime/" + src;
    tag.onload = () => resolve();
    tag.onerror = () => {
      tag.remove();
      reject(
        new Error("Could not load the recognition model. Try again."),
      );
    };
    document.head.append(tag);
  });
}
async function loadDetector() {
  const win = window as Globals;
  if (!win.tf) await script("tf.min.js");
  if (!win.cocoSsd) await script("coco-ssd.min.js");
  const tf = win.tf!;
  await tf.ready();
  const config = {
    base: "lite_mobilenet_v2" as const,
    modelUrl: "/ai/coco-ssd/model.json",
  };
  try {
    return await win.cocoSsd!.load(config);
  } catch (error) {
    if (tf.getBackend() === "cpu") throw error;
    await tf.setBackend("cpu");
    return await win.cocoSsd!.load(config);
  }
}
export async function recognizePhoto(photo: string) {
  const img = new Image();
  img.src = photo;
  await img.decode();
  const canvas = document.createElement("canvas");
  const scale = Math.min(
    1,
    512 / Math.max(img.naturalWidth, img.naturalHeight),
  );
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser could not read this photo.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  loading ??= loadDetector().catch((error) => {
    loading = undefined;
    throw error;
  });
  const model = await loading;
  const found = (await model.detect(canvas, 12, 0.45)).sort(
    (a, b) => b.score - a.score,
  );
  const primary = found[0];
  if (
    !primary ||
    primary.score < 0.56 ||
    !KINDS.includes(primary.class as Kind)
  )
    throw new Error(
      "No supported subject found. Try a photo with one clearly visible animal or object.",
    );
  if (
    found[1] &&
    found[1].class !== primary.class &&
    found[1].score >= primary.score - 0.1
  )
    throw new Error(
      "Several subjects stand out. Crop the photo around one and try again.",
    );
  const [left, top, w, h] = primary.bbox;
  const x = Math.max(
    0,
    Math.min(canvas.width - 1, Math.round(left + w * 0.32)),
  );
  const y = Math.max(
    0,
    Math.min(canvas.height - 1, Math.round(top + h * 0.32)),
  );
  const data = ctx.getImageData(
    x,
    y,
    Math.max(1, Math.min(canvas.width - x, Math.round(w * 0.36))),
    Math.max(1, Math.min(canvas.height - y, Math.round(h * 0.36))),
  ).data;
  const channels: number[][] = [[], [], []];
  for (let i = 0; i < data.length; i += 16)
    for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
  const color =
    "#" +
    channels
      .map((values) =>
        values
          .sort((a, b) => a - b)
          [Math.floor(values.length / 2)].toString(16)
          .padStart(2, "0"),
      )
      .join("");
  const kind =
    primary.class === "cat" || primary.class === "dog"
      ? await classifyPet(canvas, primary.bbox)
      : primary.class as Kind;
  return {
    kind,
    color,
    aspect: Math.min(2, Math.max(0.5, w / Math.max(1, h))),
  };
}

import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const assets = "public/ai";
const source = "https://storage.googleapis.com/tfjs-models/";
const models = [
  {
    name: "coco-ssd",
    path: "savedmodel/ssdlite_mobilenet_v2",
    manifest: "3770b2528339b1e3340cb74360e1e40401816b009779aeb8d0cce3a4353ea3a9",
    weights: "1b212bebce840387e0aab9c708b0b262e787faf9c24b448b407311dc903364a5",
  },
  {
    name: "mobilenet",
    path: "tfjs/mobilenet_v1_0.50_224",
    manifest: "05585075b20a58659c7950d6978c68fdcfde670194ab1109a34ca6aad4bbb9ef",
    weights: "286de58469ed6a98ef6bb451a0b5a75b5a83ad480945100e7c4c33f11ac753d7",
  },
];

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function cached(file) {
  try {
    return await readFile(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return null;
  }
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} downloading ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function save(file, bytes) {
  const temp = file + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temp, bytes);
    await rename(temp, file);
  } finally {
    await rm(temp, { force: true });
  }
}

async function verifiedFile(file, url, expected) {
  const existing = await cached(file);
  if (existing && digest(existing) === expected) return existing;
  const bytes = await download(url);
  if (digest(bytes) !== expected) throw new Error(`Checksum mismatch: ${url}`);
  await save(file, bytes);
  return bytes;
}

async function prepareModel(model) {
  const dir = join(assets, model.name);
  const url = source + model.path + "/";
  await mkdir(dir, { recursive: true });
  const manifest = await verifiedFile(join(dir, "model.json"), url + "model.json", model.manifest);
  const paths = JSON.parse(manifest).weightsManifest.flatMap(group => group.paths);
  const existing = await Promise.all(paths.map(path => cached(join(dir, path))));
  if (existing.every(Boolean) && digest(Buffer.concat(existing)) === model.weights) return;

  // Hash the shards in manifest order before exposing them to the browser.
  const shards = [];
  for (let i = 0; i < paths.length; i += 6) {
    shards.push(...await Promise.all(paths.slice(i, i + 6).map(path => download(url + path))));
  }
  if (digest(Buffer.concat(shards)) !== model.weights) throw new Error(`Invalid weights: ${model.name}`);
  await Promise.all(paths.map((path, i) => save(join(dir, path), shards[i])));
}

await mkdir(join(assets, "runtime"), { recursive: true });
await Promise.all(models.map(prepareModel));
await verifiedFile(join(assets, "LICENSE"), "https://www.apache.org/licenses/LICENSE-2.0.txt",
  "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30");
await writeFile(join(assets, "NOTICE.txt"),
  "TensorFlow.js, COCO-SSD and MobileNet are distributed under the Apache License 2.0.\n" +
  models.map(model => source + model.path + "/model.json").join("\n") + "\n");
await copyFile("node_modules/@tensorflow/tfjs/dist/tf.min.js", join(assets, "runtime/tf.min.js"));
await copyFile("node_modules/@tensorflow-models/coco-ssd/dist/coco-ssd.min.js", join(assets, "runtime/coco-ssd.min.js"));

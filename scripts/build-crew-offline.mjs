import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "out");
const indexPath = path.join(output, "index.html");
const template = readFileSync(
  path.join(root, "public", "crew-support-sw.js"),
  "utf8",
);
if (!existsSync(indexPath))
  throw new Error(
    "Build the Next.js static export before preparing offline support.",
  );

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
const staticRoot = path.join(output, "_next", "static");
const files = walk(staticRoot).filter((file) =>
  /\.(?:js|css|woff2?|ttf|otf)$/.test(file),
);
for (const relative of [
  "favicon.svg",
  "textures/aged-paper.jpg",
  "textures/rustic-wood.jpg",
  "textures/cloth-weave.svg",
]) {
  const file = path.join(output, relative);
  if (!existsSync(file))
    throw new Error(`Offline material is missing: ${relative}`);
  files.push(file);
}
files.sort();
if (
  !files.some((file) => file.endsWith(".js")) ||
  !files.some((file) => file.endsWith(".css"))
)
  throw new Error(
    "The offline copy requires the generated app scripts and styles.",
  );

const markerPattern =
  /<meta name="still-here-offline-build" content="[a-f0-9]+">\s*/g;
const originalHtml = readFileSync(indexPath, "utf8").replace(markerPattern, "");
const versionHash = createHash("sha256").update(originalHtml).update(template);
const assetEntries = files.map((file) => {
  const bytes = readFileSync(file);
  const url = `/${path.relative(output, file).split(path.sep).join("/")}`;
  versionHash.update(url).update(bytes);
  return {
    url,
    integrity: `sha256-${createHash("sha256").update(bytes).digest("base64")}`,
  };
});
const version = versionHash.digest("hex").slice(0, 20);
const marker = `<meta name="still-here-offline-build" content="${version}">`;
if (!originalHtml.includes("</head>"))
  throw new Error("The exported app shell has no document head.");
writeFileSync(indexPath, originalHtml.replace("</head>", `${marker}</head>`));

// The exact marker checks the root shell while allowing hosting middleware to add HTML.
// All immutable app assets additionally use fetch integrity to reject auth/error bodies.
const manifest = [{ url: "/" }, ...assetEntries];
const worker = template
  .replace(
    '/* CREW_BUILD_VERSION */ "development-disabled"',
    JSON.stringify(version),
  )
  .replace("/* CREW_PRECACHE */ []", JSON.stringify(manifest, null, 2));
if (worker === template || worker.includes("/* CREW_PRECACHE */"))
  throw new Error("Offline manifest substitution failed.");
writeFileSync(path.join(output, "crew-support-sw.js"), worker);
console.log(
  `Offline support ${version}: ${manifest.length} version-matched app files prepared.`,
);

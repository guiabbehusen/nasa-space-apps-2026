export const KINDS = [
  "cat",
  "dog",
  "bird",
  "bottle",
  "cup",
  "car",
  "airplane",
  "teddy bear",
] as const;
export type Kind = (typeof KINDS)[number];
export const STYLES = ["natural", "rounded", "faceted"] as const;
export type Style = (typeof STYLES)[number];
export type Keepsake = {
  version: 1;
  kind: Kind;
  color: string;
  aspect: number;
  variant: number;
  style: Style;
  rating?: number;
};
export const LABELS: Record<Kind, string> = {
  cat: "Cat",
  dog: "Dog",
  bird: "Bird",
  bottle: "Bottle",
  cup: "Cup",
  car: "Car",
  airplane: "Airplane",
  "teddy bear": "Teddy bear",
};
export function isKeepsake(value: unknown): value is Keepsake {
  if (!value || typeof value !== "object") return false;
  if (
    Object.keys(value).some(
      (key) =>
        ![
          "version",
          "kind",
          "color",
          "aspect",
          "variant",
          "style",
          "rating",
        ].includes(key),
    )
  )
    return false;
  const m = value as Partial<Keepsake>;
  return (
    m.version === 1 &&
    KINDS.includes(m.kind as Kind) &&
    STYLES.includes(m.style as Style) &&
    typeof m.color === "string" &&
    /^#[0-9a-f]{6}$/i.test(m.color) &&
    typeof m.aspect === "number" &&
    Number.isFinite(m.aspect) &&
    m.aspect >= 0.5 &&
    m.aspect <= 2 &&
    Number.isInteger(m.variant) &&
    Number(m.variant) >= 0 &&
    Number(m.variant) <= 255 &&
    (m.rating === undefined ||
      (Number.isInteger(m.rating) && m.rating >= 1 && m.rating <= 5))
  );
}

import { memo, type CSSProperties } from "react";
import "./book-volume.css";

type Props = {
  portrait: boolean;
  firstPage: number;
  pageCount: number;
};

// The same six physical planes remain mounted as the visible spread changes.
const sheets = [
  { step: 1, lean: -0.12, nudge: 0.2 },
  { step: 0.8, lean: 0.08, nudge: -0.1 },
  { step: 0.6, lean: -0.06, nudge: 0.25 },
  { step: 0.4, lean: 0.04, nudge: -0.15 },
  { step: 0.2, lean: -0.02, nudge: 0.1 },
  { step: 0, lean: 0, nudge: 0 },
] as const;

/** Physical paper beneath the live, untransformed page-turn surface. */
function BookVolume({ portrait, firstPage, pageCount }: Props) {
  const count = Number.isFinite(pageCount) ? Math.max(1, pageCount) : 1;
  const page = Number.isFinite(firstPage)
    ? Math.max(0, Math.min(count - 1, firstPage))
    : 0;
  const progress = count > 1 ? page / (count - 1) : 0;
  const style = {
    "--volume-left-depth": `${11 + progress * 6}px`,
    "--volume-right-depth": `${17 - progress * 6}px`,
  } as CSSProperties;

  return (
    <div
      className={`book-volume${portrait ? " book-volume-portrait" : ""}`}
      style={style}
      aria-hidden="true"
    >
      {(["left", "right"] as const).map((side) => (
        <div className={`book-volume-half book-volume-${side}`} key={side}>
          <span className="book-volume-outer-face" />
          <span className="book-volume-bottom-face" />
          {sheets.map(({ step, lean, nudge }, index) => (
            <span
              className="book-volume-sheet"
              key={index}
              style={
                {
                  "--sheet-step": step,
                  "--sheet-lean": `${lean}deg`,
                  "--sheet-nudge": `${nudge}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
      <span className="book-volume-hinge" />
    </div>
  );
}

export default memo(BookVolume);

import type { CSSProperties, ReactNode } from "react";
import type { PageDesign, PageSticker } from "@/lib/model";
import type { Keepsake } from "@/lib/keepsake";
import { PhotoObject } from "./PhotoObject";
import { StickerArt } from "./StickerArt";
import "./scrapbook.css";

export function stickerStyle(sticker: PageSticker): CSSProperties {
  return {
    left: `${sticker.x}%`,
    top: `${sticker.y}%`,
    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
  };
}

type Props = {
  title: string;
  text: string;
  photo?: string;
  object3d?: Keepsake;
  visibleInBook?: boolean;
  onObjectChange?: (next?: Keepsake) => void;
  design?: PageDesign;
  children?: ReactNode;
  voice?: "earth" | "space";
};

/** The editor and physical album use exactly the same page composition. */
export default function ScrapbookPage({
  title,
  text,
  photo,
  object3d,
  visibleInBook,
  onObjectChange,
  design,
  children,
  voice = "space",
}: Props) {
  const layout = design?.layout ?? "classic";
  return (
    <div
      className={`scrapbook-page scrapbook-layout-${layout} scrapbook-voice-${voice}${text.length > 110 ? " scrapbook-dense" : ""}`}
    >
      <div className="scrapbook-content">
        <h2 className="scrapbook-title">{title}</h2>
        <div className="scrapbook-arrangement">
          {photo && (
            <figure
              className={`scrapbook-photo scrapbook-tape-${design?.tape ?? "linen"}`}
              style={
                {
                  "--photo-tilt": `${design?.photoTilt ?? -2}deg`,
                } as CSSProperties
              }
            >
              <span
                className="scrapbook-tape scrapbook-tape-top"
                aria-hidden="true"
              />
              {onObjectChange || object3d ? (
                <PhotoObject
                  key={photo}
                  photo={photo}
                  alt={`Photo accompanying “${title}”`}
                  model={object3d}
                  visibleInBook={visibleInBook}
                  onChange={onObjectChange}
                />
              ) : (
                <img src={photo} alt={`Photo accompanying “${title}”`} draggable={false} />
              )}
              {voice === "earth" &&
                ["tl", "tr", "bl", "br"].map((corner) => (
                  <span
                    key={corner}
                    className={`scrapbook-photo-corner scrapbook-photo-corner-${corner}`}
                    aria-hidden="true"
                  />
                ))}
              <span
                className="scrapbook-tape scrapbook-tape-bottom"
                aria-hidden="true"
              />
            </figure>
          )}
          {text && (
            <div
              className={`scrapbook-note scrapbook-tape-${design?.tape ?? "linen"}`}
            >
              <span
                className="scrapbook-tape scrapbook-note-tape"
                aria-hidden="true"
              />
              <p>{text}</p>
            </div>
          )}
        </div>
      </div>
      <div className="scrapbook-sticker-layer">
        {children !== undefined
          ? children
          : design?.stickers.map((sticker) => (
              <span
                key={sticker.id}
                className="scrapbook-sticker"
                style={stickerStyle(sticker)}
              >
                <StickerArt kind={sticker.kind} />
              </span>
            ))}
      </div>
    </div>
  );
}

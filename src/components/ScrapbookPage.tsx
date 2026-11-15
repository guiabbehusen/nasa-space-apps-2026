import { memo, type CSSProperties, type ReactNode } from "react";
import type { PageDesign, PageSticker } from "@/lib/model";
import { StickerArt } from "./StickerArt";
import "./scrapbook.css";

const storyPhotoDescriptions: Record<string, string> = {
  "/images/stories/sam-supper.jpg":
    "A rooftop supper table set for two beneath warm string lights.",
  "/images/stories/sam-menu.jpg":
    "A homemade menu drawn in pictures beside an orange-and-cinnamon dessert.",
  "/images/stories/maya-lighthouse.jpg":
    "A friend with a backpack follows a coastal path toward a lighthouse.",
  "/images/stories/maya-capsule.jpg":
    "An open keepsake tin holds old photographs, a blue button, a map, and a seashell.",
  "/images/stories/june-cinema.jpg":
    "Neighbors prepare a vintage picture house for a community screening.",
  "/images/stories/june-film.jpg":
    "Hands hold a small film reel beside a projector and family slides.",
  "/images/stories/lily-expedition.jpg":
    "A child explores a backyard blanket-fort field station at dusk as fireflies glow nearby.",
  "/images/stories/lily-lanterns.jpg":
    "Glowing paper lanterns and a hand-drawn star map make a backyard constellation.",
};

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
  design?: PageDesign;
  children?: ReactNode;
  voice?: "earth" | "space";
};

/** The editor and physical album use exactly the same page composition. */
function ScrapbookPage({
  title,
  text,
  photo,
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
              <img
                src={photo}
                alt={
                  storyPhotoDescriptions[photo] ??
                  `Photo accompanying “${title}”`
                }
                draggable={false}
                decoding="async"
              />
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

export default memo(ScrapbookPage);

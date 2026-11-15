"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { Plus } from "lucide-react";
import type { Album } from "@/lib/model";
import "./bookshelf-scene.css";

export type BookshelfAlbum = {
  album: Album;
  companionName: string;
  astronautName: string;
  pageCount: number;
  hasReply: boolean;
  hasDraft: boolean;
};

type CoverProps = Pick<
  BookshelfAlbum,
  "album" | "companionName" | "astronautName"
>;

/** The same sewn label and mounted photograph travel from the shelf into opening. */
export function ShelfCoverContents({
  album,
  companionName,
  astronautName,
}: CoverProps) {
  return (
    <div className="shelf-cover-content" aria-hidden="true">
      <div className="shelf-cover-label">
        <span className="shelf-cover-names">
          {companionName} &amp; {astronautName}
        </span>
        <span className="shelf-cover-title">{album.title}</span>
      </div>
      <div className="shelf-cover-photo">
        <img
          src={album.cover.replace(".svg", ".jpg")}
          alt=""
          draggable={false}
        />
        {(["tl", "tr", "bl", "br"] as const).map((corner) => (
          <span
            className={`shelf-photo-corner shelf-corner-${corner}`}
            key={corner}
          />
        ))}
      </div>
      <svg
        className="shelf-cover-sprout"
        viewBox="0 0 60 60"
        fill="none"
        focusable="false"
      >
        <path d="M29 48c1-13 0-23 3-34M29 37C15 37 8 27 9 19c13-1 23 6 20 18ZM31 28c-2-13 5-21 18-22 2 12-5 21-18 22Z" />
        <path d="m15 24 14 13M43 12 31 28M18 51c8-4 16-4 26 0" />
      </svg>
    </div>
  );
}

type Props = {
  albums: BookshelfAlbum[];
  onOpen: (id: string, trigger: HTMLElement) => void;
  onAddAlbum: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  openingAlbumId?: string;
};

type ShelfGeometry = {
  capacity: number;
  rowWidth: number;
  baseSpineWidth: number;
  coverWidth: number;
  gap: number;
};

/** Upright spines reveal their own covers without changing the order of the shelf. */
export default function Bookshelf({
  albums,
  onOpen,
  onAddAlbum,
  headingRef,
  openingAlbumId,
}: Props) {
  const rowsRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef("");
  const [geometry, setGeometry] = useState<ShelfGeometry | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"pointer" | "keyboard">(
    "pointer",
  );
  const activeId =
    previewId ?? (previewMode === "keyboard" ? focusId : hoverId);

  useLayoutEffect(() => {
    const surface = rowsRef.current;
    if (!surface || !albums.length) return;
    const measure = () => {
      const row = surface.querySelector<HTMLElement>(".shelf-book-row");
      const probe = surface.querySelector<HTMLElement>(".shelf-sizing-probe");
      const cover = surface.querySelector<HTMLElement>(".shelf-front-cover");
      if (!row || !probe || !cover) return;
      const rowStyle = getComputedStyle(row);
      const baseSpineWidth = parseFloat(getComputedStyle(probe).width);
      const rowWidth = row.clientWidth;
      const coverWidth = cover.offsetWidth;
      const gap = parseFloat(rowStyle.columnGap) || 0;
      // Capacity depends on an immutable sizing probe. The actual spines grow
      // to pack a row and narrow for previews without regrouping its books.
      const reserve = Math.max(
        0,
        Math.ceil(coverWidth - baseSpineWidth * 0.55),
      );
      const max =
        parseInt(rowStyle.getPropertyValue("--shelf-max-row"), 10) ||
        albums.length;
      const count = Math.max(
        1,
        Math.min(
          max,
          Math.floor((rowWidth - reserve + gap) / (baseSpineWidth + gap)),
        ),
      );
      setGeometry((current) =>
        current?.capacity === count &&
        current.rowWidth === rowWidth &&
        current.baseSpineWidth === baseSpineWidth &&
        current.coverWidth === coverWidth &&
        current.gap === gap
          ? current
          : { capacity: count, rowWidth, baseSpineWidth, coverWidth, gap },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [albums.length]);

  const rows: BookshelfAlbum[][] = [];
  const count = geometry?.capacity ?? 4;
  for (let index = 0; index < albums.length; index += count)
    rows.push(albums.slice(index, index + count));

  return (
    <section
      className={`rustic-bookshelf${geometry === null ? " shelf-measuring" : ""}`}
      aria-labelledby="bookshelf-title"
      onKeyDownCapture={() => setPreviewMode("keyboard")}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") setPreviewMode("pointer");
      }}
      onPointerDown={(event) => {
        if (
          !(event.target instanceof Element) ||
          !event.target.closest(".shelf-book-trigger")
        )
          setPreviewId(null);
      }}
    >
      <div className="shelf-cabinet">
        <header className="shelf-heading">
          <h1 id="bookshelf-title" ref={headingRef} tabIndex={-1}>
            My bookshelf
          </h1>
          <button
            className="shelf-add-album"
            type="button"
            onClick={onAddAlbum}
          >
            <Plus size={18} />
            Add album
          </button>
          <span className="shelf-heading-brand">Still Here</span>
        </header>
        <div className="shelf-rows" ref={rowsRef}>
          <span className="shelf-sizing-probe" aria-hidden="true" />
          {rows.map((row, rowIndex) => {
            const expanded = row.some((entry) => entry.album.id === activeId);
            const spineWidth = geometry
              ? row.length === 1
                ? geometry.baseSpineWidth * 0.85
                : Math.max(
                    1,
                    Math.min(
                      132,
                      ((geometry.rowWidth -
                        geometry.gap * (row.length - 1) -
                        (expanded ? geometry.coverWidth : 0)) /
                        (row.length - (expanded ? 0.55 : 0))) *
                        0.85,
                    ),
                  )
              : null;
            return (
              <div className="shelf-compartment" key={rowIndex}>
                <div
                  className="shelf-book-row"
                  role="list"
                  aria-label={`Bookshelf row ${rowIndex + 1}`}
                  style={
                    spineWidth === null
                      ? undefined
                      : ({
                          "--shelf-spine-width": `${spineWidth}px`,
                        } as CSSProperties)
                  }
                >
                  {row.map((entry) => {
                    const {
                      album,
                      companionName,
                      astronautName,
                      pageCount,
                      hasReply,
                      hasDraft,
                    } = entry;
                    const preview = previewId === album.id;
                    return (
                      <div
                        className="shelf-book-slot"
                        role="listitem"
                        key={album.id}
                        style={
                          spineWidth === null
                            ? undefined
                            : {
                                flexBasis:
                                  activeId === album.id
                                    ? geometry!.coverWidth + spineWidth * 0.45
                                    : spineWidth,
                              }
                        }
                      >
                        <button
                          type="button"
                          className={`shelf-book-trigger shelf-accent-${album.accent}${activeId === album.id ? " shelf-active" : ""}${preview ? " shelf-previewing" : ""}${openingAlbumId === album.id ? " opening-source" : ""}`}
                          aria-label={`Open ${companionName}'s album, ${album.title}`}
                          aria-describedby={`shelf-description-${album.id}`}
                          onPointerDown={(event) => {
                            pointerType.current = event.pointerType;
                          }}
                          onPointerEnter={(event) => {
                            if (event.pointerType === "mouse") {
                              setPreviewId(null);
                              setHoverId(album.id);
                              setPreviewMode("pointer");
                            }
                          }}
                          onPointerLeave={(event) => {
                            if (event.pointerType === "mouse")
                              setHoverId((current) =>
                                current === album.id ? null : current,
                              );
                          }}
                          onFocus={(event) => {
                            setFocusId(album.id);
                            if (event.currentTarget.matches(":focus-visible"))
                              setPreviewMode("keyboard");
                          }}
                          onClick={(event) => {
                            if (
                              event.detail !== 0 &&
                              pointerType.current !== "mouse" &&
                              pointerType.current !== "" &&
                              !preview
                            ) {
                              setPreviewId(album.id);
                              return;
                            }
                            onOpen(album.id, event.currentTarget);
                          }}
                          onBlur={() => {
                            setPreviewId((current) =>
                              current === album.id ? null : current,
                            );
                            setFocusId((current) =>
                              current === album.id ? null : current,
                            );
                          }}
                        >
                          <span className="shelf-volume" aria-hidden="true">
                            <span className="shelf-back-board" />
                            <span className="shelf-page-block" />
                            <span className="shelf-page-edge" />
                            <span className="shelf-spine">
                              <span className="shelf-spine-band shelf-band-top" />
                              <span className="shelf-spine-pair">
                                {companionName} &amp; {astronautName}
                              </span>
                              <span className="shelf-spine-title">
                                {album.title}
                              </span>
                              <span className="shelf-spine-band shelf-band-bottom" />
                              {hasReply && (
                                <span className="shelf-reply-marker" />
                              )}
                            </span>
                            <span className="album-book shelf-front-cover">
                              <ShelfCoverContents {...entry} />
                            </span>
                          </span>
                        </button>
                        <span
                          className="sr-only"
                          id={`shelf-description-${album.id}`}
                        >
                          {pageCount} {pageCount === 1 ? "page" : "pages"}.
                          {hasReply
                            ? " A new reply."
                            : hasDraft
                              ? " A page in the making."
                              : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!albums.length && (
            <div className="shelf-empty">
              <button type="button" onClick={onAddAlbum}>
                Add your first album
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      {previewId && (
        <p className="shelf-touch-instruction" role="status">
          Tap again to open the album.
        </p>
      )}
    </section>
  );
}

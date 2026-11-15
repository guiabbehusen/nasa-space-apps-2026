"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  PEOPLE,
  type Album,
  type Contribution,
  type Person,
} from "@/lib/model";
import {
  estimateOpeningTarget,
  type OpeningTarget,
} from "@/lib/opening-geometry";
import AlbumLeaf from "./AlbumLeaf";
import AlbumNameplate from "./AlbumNameplate";
import BookVolume from "./BookVolume";
import { ShelfCoverContents } from "./Bookshelf";
import "./album-opening.css";

export type AlbumOpeningOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Props = {
  album: Album;
  personName: string;
  origin: AlbumOpeningOrigin;
  pages: Contribution[];
  totalPages: number;
  profileId: string;
  people?: Person[];
  target: OpeningTarget | null;
  onPrepare: () => void;
  readerReady: boolean;
  onComplete: () => void;
};

function stageGeometry(
  origin: AlbumOpeningOrigin,
  target: OpeningTarget,
): CSSProperties {
  return {
    "--opening-width": `${target.width}px`,
    "--opening-height": `${target.height}px`,
    "--opening-from-x": `${origin.left}px`,
    "--opening-from-y": `${origin.top}px`,
    "--opening-scale-x": Math.max(1, origin.width) / target.width,
    "--opening-scale-y": Math.max(1, origin.height) / target.height,
    "--opening-to-x": `${target.x}px`,
    "--opening-to-y": `${target.y}px`,
    "--opening-case-left": `${target.case.left - target.x}px`,
    "--opening-case-top": `${target.case.top - target.y}px`,
    "--opening-case-width": `${target.case.width}px`,
    "--opening-case-height": `${target.case.height}px`,
    "--opening-case-cut": `${target.portrait ? 0 : target.x - target.case.left}px`,
    "--opening-spread-left": `${target.portrait ? 0 : -target.width}px`,
    "--opening-spread-width": `${target.width * (target.portrait ? 1 : 2)}px`,
    "--opening-right-left": `${target.portrait ? 0 : target.width}px`,
  } as CSSProperties;
}

/** A presentation-only bridge from a shelf cover to the chronological reader. */
export default function AlbumOpening({
  album,
  personName,
  origin,
  pages,
  totalPages,
  profileId,
  people = PEOPLE,
  target,
  onPrepare,
  readerReady,
  onComplete,
}: Props) {
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const prepareCallback = useRef(onPrepare);
  prepareCallback.current = onPrepare;
  const prepared = useRef(false);
  const completed = useRef(false);
  const skipButton = useRef<HTMLButtonElement>(null);
  const [estimatedTarget] = useState(() =>
    estimateOpeningTarget(
      document.body.clientWidth || document.documentElement.clientWidth,
      window.innerHeight,
    ),
  );
  const destination = target ?? estimatedTarget;
  const geometry = stageGeometry(origin, destination);
  const rightIndex = destination.portrait ? 0 : 1;
  const rightPage = pages[rightIndex];
  const [animationDone, setAnimationDone] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const prepare = useCallback(() => {
    if (prepared.current) return;
    prepared.current = true;
    prepareCallback.current();
  }, []);
  const finishAnimation = useCallback(() => {
    prepare();
    setAnimationDone(true);
  }, [prepare]);
  const skip = useCallback(() => {
    setBypassed(true);
    finishAnimation();
  }, [finishAnimation]);

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    callback.current();
  }, []);

  useEffect(() => {
    if (!animationDone || !readerReady) return;
    setRevealing(true);
    // The mounted book is already painted; only the lightweight overlay fades.
    const fade = window.setTimeout(complete, 170);
    return () => window.clearTimeout(fade);
  }, [animationDone, readerReady, complete]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) {
      skip();
    }
    const previousOverflow = document.body.style.overflow;
    const previousGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
    skipButton.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        skip();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        skipButton.current?.focus({ preventScroll: true });
      }
    };
    const reducedMotion = () => {
      if (preference.matches) skip();
    };
    // A changed viewport invalidates the captured shelf position: finish safely.
    window.addEventListener("resize", skip);
    window.addEventListener("keydown", key, true);
    preference.addEventListener("change", reducedMotion);
    // Covers CSS animation cancellation, background-tab throttling and slow frames.
    // The backdrop is opaque before the normal reader replaces the shelf.
    // The presentation already shows the opening spread. Initialize the engine
    // after the busy fold/reveal (86%), while the cover gently settles in place.
    const warmup = window.setTimeout(prepare, 1660);
    const fallback = window.setTimeout(finishAnimation, 2250);
    const safety = window.setTimeout(() => {
      prepare();
      complete();
    }, 7000);
    return () => {
      window.clearTimeout(warmup);
      window.clearTimeout(fallback);
      window.clearTimeout(safety);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarGutter = previousGutter;
      window.removeEventListener("resize", skip);
      window.removeEventListener("keydown", key, true);
      preference.removeEventListener("change", reducedMotion);
    };
  }, [complete, prepare, finishAnimation, skip]);

  return (
    <div
      className={`album-opening opening-${album.accent}${bypassed ? " opening-bypassed" : ""}${revealing ? " opening-revealing" : ""}`}
      style={geometry}
      role="dialog"
      aria-modal="true"
      aria-label={`Opening ${personName}'s album`}
    >
      <div className="opening-backdrop" aria-hidden="true" />
      <span className="sr-only" role="status" aria-live="polite">
        Opening {personName}’s album.
      </span>
      <div
        className={`opening-flight album-reader ${destination.portrait ? "opening-portrait" : "opening-spread-mode"}`}
        aria-hidden="true"
        onAnimationEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.animationName === "album-lift-and-open"
          )
            finishAnimation();
        }}
      >
        <div className="opening-base-bounds">
          <div className="opening-base-window">
            <div className="opening-base-carrier">
              <div
                className={`book-case book-case-${album.accent} opening-reader-case`}
              >
                <div className="book-ground-shadow" />
                <BookVolume
                  portrait={destination.portrait}
                  firstPage={0}
                  pageCount={totalPages}
                />
                <div className="opening-spread">
                  {rightPage && (
                    <div className="album-leaf opf-page--right opening-stationary-leaf">
                      <AlbumLeaf
                        page={rightPage}
                        pageIndex={rightIndex}
                        profileId={profileId}
                        people={people}
                        presentation
                        navigation={{ showNext: rightIndex < totalPages - 1 }}
                      />
                    </div>
                  )}
                </div>
                {!destination.portrait && <div className="book-binding" />}
              </div>
            </div>
          </div>
        </div>
        <div className="opening-nameplate-anchor">
          <AlbumNameplate album={album} people={people} presentation />
        </div>
        <div className="opening-hardcover">
          <div className="opening-cover-face opening-cover-front shelf-front-cover">
            <span className="opening-cover-spine" />
            <ShelfCoverContents
              album={album}
              companionName={personName}
              astronautName={
                people.find((item) => item.role === "Astronaut")?.name ?? "Alex"
              }
            />
          </div>
          <div className="opening-cover-face opening-cover-back">
            <div className="album-leaf opf-page--left opening-turning-leaf">
              {!destination.portrait && pages[0] && (
                <AlbumLeaf
                  page={pages[0]}
                  pageIndex={0}
                  profileId={profileId}
                  people={people}
                  presentation
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <button
        ref={skipButton}
        className="opening-skip"
        type="button"
        onClick={skip}
      >
        Skip animation
      </button>
    </div>
  );
}

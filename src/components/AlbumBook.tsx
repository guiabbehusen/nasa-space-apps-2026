"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { type Book, FlipBook, Page } from "@openpageflip/react";
import {
  CheckCheck,
  ChevronDown,
  Cloud,
  Feather,
  Heart,
  Plus,
  Send,
} from "lucide-react";
import {
  PEOPLE,
  formatDate,
  type Album,
  type Contribution,
  type Person,
} from "@/lib/model";
import "@openpageflip/core/styles.css";
import "./album-book.css";
import AlbumLeaf from "./AlbumLeaf";
import AlbumNameplate from "./AlbumNameplate";
import BookVolume from "./BookVolume";
import { getReaderLayout } from "@/lib/opening-geometry";
import { afterReaderImagesPaint } from "@/lib/reader-ready";

type Props = {
  pages: Contribution[];
  album: Album;
  profileId: string;
  people?: Person[];
  initialPageId?: string;
  onCompose: (replyTo?: string) => void;
  onReady?: () => void;
};

/** Every contribution is a physical leaf; the fold engine controls only its presentation. */
function AlbumBook({
  pages,
  album,
  profileId,
  people = PEOPLE,
  initialPageId,
  onCompose,
  onReady,
}: Props) {
  const authorName = (id: string) =>
    people.find((person) => person.id === id)?.name ?? "Someone close";
  const book = useRef<Book>(null);
  const reader = useRef<HTMLElement>(null);
  const focusAfterTurn = useRef(false);
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;
  const [readerReady, setReaderReady] = useState(false);
  const [initialLayout, setInitialLayout] = useState<{
    page: number;
    portrait: boolean;
  } | null>(null);
  const lastJump = useRef("");
  const target = Math.max(
    0,
    pages.findIndex((page) => page.id === initialPageId),
  );
  const [index, setIndex] = useState(target);
  const [portrait, setPortrait] = useState(false);
  const [turning, setTurning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [layout, setLayout] = useState(() =>
    getReaderLayout(
      typeof document === "undefined"
        ? 1280
        : document.body.clientWidth || document.documentElement.clientWidth,
      typeof window === "undefined" ? 900 : window.innerHeight,
    ),
  );
  const hasPages = pages.length > 0;

  useEffect(() => {
    let frame = 0;
    const resize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const next = getReaderLayout(
          document.body.clientWidth || document.documentElement.clientWidth,
          window.innerHeight,
        );
        setLayout((previous) =>
          previous.caseWidth === next.caseWidth &&
          previous.maxPageWidth === next.maxPageWidth &&
          previous.minPageWidth === next.minPageWidth
            ? previous
            : next,
        );
      });
    };
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (readerReady || (hasPages && !initialLayout) || !reader.current) return;
    const spread = initialLayout
      ? [
          initialLayout.page,
          ...(initialLayout.portrait ? [] : [initialLayout.page + 1]),
        ]
      : [];
    const images = spread.flatMap((page) =>
      Array.from(
        reader.current!.querySelectorAll<HTMLImageElement>(
          `[data-reader-page-index="${page}"] img`,
        ),
      ),
    );
    return afterReaderImagesPaint(
      images,
      () => {
        setReaderReady(true);
        readyCallback.current?.();
      },
      document.fonts?.ready,
    );
  }, [initialLayout, hasPages, readerReady]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!initialPageId || !pages.length) return;
    const request = `${album.id}:${profileId}:${initialPageId}`;
    if (lastJump.current === request) return;
    const requested = pages.findIndex((page) => page.id === initialPageId);
    if (requested >= 0 && book.current) {
      book.current.turnTo(requested);
      setIndex(book.current.page);
      lastJump.current = request;
    }
  }, [initialPageId, album.id, profileId, target, pages.length]);

  const first = Math.min(index, Math.max(0, pages.length - 1));
  const last = Math.min(first + (portrait ? 0 : 1), pages.length - 1);
  const visible = pages.slice(first, last + 1);

  useEffect(() => {
    if (!focusAfterTurn.current || turning) return;
    const surface = reader.current?.querySelector<HTMLElement>(
      `[data-reader-page-index="${first}"] .leaf-content`,
    );
    if (surface) {
      focusAfterTurn.current = false;
      surface.focus({ preventScroll: true });
    }
  }, [first, last, turning]);

  const turn = (direction: "next" | "previous") => {
    const api = book.current;
    if (
      !api ||
      turning ||
      api.state === "flipping" ||
      api.state === "user_fold"
    )
      return;
    if (direction === "next") {
      if (last >= pages.length - 1) return;
      focusAfterTurn.current = !!reader.current?.contains(
        document.activeElement,
      );
      if (reducedMotion) api.turnNext();
      else void api.flipNext("bottom");
    } else {
      if (first <= 0) return;
      focusAfterTurn.current = !!reader.current?.contains(
        document.activeElement,
      );
      if (reducedMotion) api.turnPrev();
      else void api.flipPrev("bottom");
    }
  };

  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (event.target instanceof HTMLElement &&
        /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))
    )
      return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      turn(event.key === "ArrowRight" ? "next" : "previous");
    }
  };

  if (!pages.length)
    return (
      <section
        ref={reader}
        className="album-reader book-empty"
        data-reader-ready={readerReady ? "true" : "false"}
      >
        <Feather size={28} />
        <h2>A new chapter.</h2>
        <button className="primary-button" onClick={() => onCompose()}>
          <Plus size={15} />
          Add a page
        </button>
      </section>
    );

  return (
    <section
      ref={reader}
      style={
        { "--reader-case-width": `${layout.caseWidth}px` } as CSSProperties
      }
      data-reader-ready={readerReady ? "true" : "false"}
      data-book-turning={turning ? "true" : "false"}
      className={`album-reader ${portrait ? "book-portrait" : "book-spread"}`}
      aria-label={`${album.title}, chronological book`}
      onKeyDown={onKey}
    >
      <div className={`book-case book-case-${album.accent}`}>
        <div className="book-ground-shadow" aria-hidden="true" />
        <AlbumNameplate album={album} people={people} />
        <BookVolume
          portrait={portrait}
          firstPage={first}
          pageCount={pages.length}
        />
        <FlipBook
          key={`${album.id}:${profileId}`}
          ref={book}
          className="album-flipbook"
          width={560}
          height={660}
          size="stretch"
          minWidth={layout.minPageWidth}
          maxWidth={layout.maxPageWidth}
          layout="auto"
          startPage={first}
          cover={false}
          flipDuration={1000}
          shadows
          shadowOpacity={0.3}
          click={reducedMotion ? "off" : "edges"}
          drag={!reducedMotion}
          swipe={!reducedMotion}
          hover={false}
          swipeDistance={35}
          ignoreDragOn="a, button, input, textarea, select, [data-opf-no-flip]"
          onInit={({ page, orientation }) => {
            setTurning(false);
            setIndex(page);
            setPortrait(orientation === "portrait");
            setInitialLayout(
              (layout) =>
                layout ?? { page, portrait: orientation === "portrait" },
            );
          }}
          onFlip={({ page }) => setIndex(page)}
          onUpdate={({ page, orientation }) => {
            const state = book.current?.state;
            setTurning(state === "flipping" || state === "user_fold");
            setIndex(page);
            setPortrait(orientation === "portrait");
          }}
          onChangeOrientation={({ orientation }) => {
            setTurning(false);
            setPortrait(orientation === "portrait");
            if (book.current) setIndex(book.current.page);
          }}
          onChangeState={({ state }) =>
            setTurning(state === "flipping" || state === "user_fold")
          }
        >
          {pages.map((page, pageIndex) => {
            return (
              <Page
                density="soft"
                data-reader-page-index={pageIndex}
                className={`album-leaf ${page.photo ? "leaf-with-photo" : "leaf-words"}`}
                key={page.id}
              >
                <AlbumLeaf
                  page={page}
                  pageIndex={pageIndex}
                  profileId={profileId}
                  people={people}
                  onReply={() => onCompose(page.id)}
                  navigation={{
                    showPrevious: pageIndex === first && first > 0,
                    showNext: pageIndex === last && last < pages.length - 1,
                    previousDisabled: turning,
                    nextDisabled: turning,
                    onPrevious: () => turn("previous"),
                    onNext: () => turn("next"),
                  }}
                />
              </Page>
            );
          })}
        </FlipBook>
        {!portrait && <div className="book-binding" aria-hidden="true" />}
      </div>
      <p
        className="book-pagination sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {first === last
          ? `Page ${first + 1}`
          : `Pages ${first + 1}–${last + 1}`}{" "}
        of {pages.length}
      </p>
      <div className="book-footer-actions">
        <button
          className="primary-button book-add-page"
          onClick={() => onCompose()}
        >
          <Plus size={17} />
          Add a page
        </button>
        <details className="book-journey">
          <summary>
            Page details
            <ChevronDown size={12} />
          </summary>
          <div className="book-journey-pages">
            {visible.map((page, offset) => (
              <div key={page.id}>
                <strong>
                  Page {first + offset + 1} · {authorName(page.authorId)}
                </strong>
                <ol>
                  <li>
                    <Cloud size={12} />
                    <span>Recorded</span>
                    <time>{formatDate(page.createdAt)}</time>
                  </li>
                  {page.sentAt && (
                    <li>
                      <Send size={12} />
                      <span>Sent</span>
                      <time>{formatDate(page.sentAt)}</time>
                    </li>
                  )}
                  {page.deliveredAt && (
                    <li>
                      <CheckCheck size={12} />
                      <span>Delivered</span>
                      <time>{formatDate(page.deliveredAt)}</time>
                    </li>
                  )}
                  {page.answeredAt && (
                    <li>
                      <Heart size={12} />
                      <span>Answered</span>
                      <time>{formatDate(page.answeredAt)}</time>
                    </li>
                  )}
                </ol>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}

export default memo(AlbumBook);

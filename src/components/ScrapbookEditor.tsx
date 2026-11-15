"use client";

import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  ImagePlus,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import type { Draft, PageDesign, PageSticker, StickerKind } from "@/lib/model";
import ScrapbookPage, { stickerStyle } from "./ScrapbookPage";
import { StickerArt, STICKERS } from "./StickerArt";
import "./scrapbook-editor.css";

const freshDesign = (): PageDesign => ({
  layout: "classic",
  tape: "linen",
  photoTilt: -2,
  stickers: [],
});
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  kind?: StickerKind;
  id?: string;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};
type Props = {
  draft: Draft;
  authorId?: string;
  onChange: (changes: Partial<Draft>) => void;
  onChoosePhoto: () => void;
  photoBusy: boolean;
  support?: ReactNode;
};

export default function ScrapbookEditor({
  draft,
  authorId = "alex",
  onChange,
  onChoosePhoto,
  photoBusy,
  support,
}: Props) {
  const design = draft.design ?? freshDesign();
  const designRef = useRef(design);
  designRef.current = design;
  const paperRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [ghost, setGhost] = useState<{
    kind: StickerKind;
    x: number;
    y: number;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const active = design.stickers.find((item) => item.id === selected);
  const updateDesign = (change: Partial<PageDesign>) => {
    const next = { ...designRef.current, ...change };
    designRef.current = next;
    onChange({ design: next });
  };
  const updateSticker = (id: string, change: Partial<PageSticker>) =>
    updateDesign({
      stickers: designRef.current.stickers.map((item) =>
        item.id === id ? { ...item, ...change } : item,
      ),
    });
  const labelFor = (kind: StickerKind) =>
    STICKERS.find((item) => item.kind === kind)?.label ?? kind;
  const bounds = () =>
    paperRef.current?.querySelector(".scrapbook-page")?.getBoundingClientRect();
  const point = (clientX: number, clientY: number) => {
    const rect = bounds();
    if (!rect) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
      inside:
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom,
    };
  };
  const add = (kind: StickerKind, position?: { x: number; y: number }) => {
    const items = designRef.current.stickers;
    if (items.length >= 24) {
      setAnnouncement(
        "This page has room for 24 stickers. Remove one to add another.",
      );
      return;
    }
    const id = crypto.randomUUID();
    const corner = [
      { x: 83, y: 15 },
      { x: 17, y: 79 },
      { x: 82, y: 78 },
      { x: 18, y: 17 },
    ][items.length % 4];
    updateDesign({
      stickers: [
        ...items,
        {
          id,
          kind,
          x: clamp((position ?? corner).x, 9, 91),
          y: clamp((position ?? corner).y, 8, 92),
          rotation: items.length % 2 ? -9 : 8,
          scale: 1,
        },
      ],
    });
    setSelected(id);
    setAnnouncement(
      `${labelFor(kind)} added. Drag it or use the position controls.`,
    );
  };
  const remove = (id: string) => {
    updateDesign({
      stickers: designRef.current.stickers.filter((item) => item.id !== id),
    });
    setSelected(null);
    setAnnouncement("Sticker removed.");
    trayRef.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
  };
  const start = (
    event: PointerEvent<HTMLButtonElement>,
    kind?: StickerKind,
    item?: PageSticker,
  ) => {
    if (event.button !== 0 || drag.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event.clientX, event.clientY);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      kind,
      id: item?.id,
      offsetX: item && p ? p.x - item.x : 0,
      offsetY: item && p ? p.y - item.y : 0,
      moved: false,
    };
    if (item) setSelected(item.id);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (
      Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      ) > 4
    )
      current.moved = true;
    if (!current.moved) return;
    if (current.kind)
      setGhost({ kind: current.kind, x: event.clientX, y: event.clientY });
    else if (current.id) {
      const p = point(event.clientX, event.clientY);
      if (p)
        updateSticker(current.id, {
          x: clamp(p.x - current.offsetX, 9, 91),
          y: clamp(p.y - current.offsetY, 8, 92),
        });
    }
  };
  const end = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    setGhost(null);
    if (!cancelled && current.kind) {
      const p = point(event.clientX, event.clientY);
      if (!current.moved) add(current.kind);
      else if (p?.inside) add(current.kind, { x: p.x, y: p.y });
      else
        setAnnouncement("Drop the sticker onto the paper, or tap it to add.");
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onStickerKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    item: PageSticker,
  ) => {
    const step = event.shiftKey ? 5 : 2;
    const shifts: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (shifts[event.key]) {
      event.preventDefault();
      const [x, y] = shifts[event.key];
      updateSticker(item.id, {
        x: clamp(item.x + x, 9, 91),
        y: clamp(item.y + y, 8, 92),
      });
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      remove(item.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSelected(null);
    }
  };
  return (
    <div className="scrapbook-editor">
      <div className="scrapbook-tools">
        <div className="scrapbook-fields">
          <label className="field-label" htmlFor="page-title">
            Title <span>(optional)</span>
          </label>
          <input
            id="page-title"
            className="title-input"
            placeholder="A little moment…"
            maxLength={120}
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <label
            className="field-label scrapbook-story-label"
            htmlFor="page-text"
          >
            Your story
          </label>
          <textarea
            id="page-text"
            className="story-input"
            placeholder="I thought of you today when…"
            maxLength={10000}
            value={draft.text}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          {support}
          <div className="scrapbook-photo-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onChoosePhoto}
              disabled={photoBusy}
            >
              <ImagePlus size={15} />
              {photoBusy
                ? "Preparing photo…"
                : draft.photo
                  ? "Change photo"
                  : "Add a photo"}
            </button>
            {draft.photo && (
              <button
                type="button"
                className="icon-button"
                aria-label="Remove photo"
                onClick={() => onChange({ photo: undefined, object3d: undefined })}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        <fieldset className="scrapbook-control-group scrapbook-layout-group">
          <legend>Page style</legend>
          <div className="scrapbook-layouts">
            {(
              [
                { value: "classic", label: "Classic" },
                { value: "postcard", label: "Postcard" },
                { value: "letter", label: "Letter" },
              ] as const
            ).map((layout) => (
              <button
                type="button"
                key={layout.value}
                aria-pressed={design.layout === layout.value}
                onClick={() => updateDesign({ layout: layout.value })}
              >
                <span
                  className={`scrapbook-layout-icon scrapbook-layout-icon-${layout.value}`}
                  aria-hidden="true"
                >
                  <i />
                  <b />
                  <em />
                </span>
                {layout.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="scrapbook-control-group scrapbook-stickers-group">
          <legend>
            Stickers <span>Drag or tap to add</span>
          </legend>
          <div className="scrapbook-sticker-tray" ref={trayRef}>
            {STICKERS.map(({ kind, label }) => (
              <button
                type="button"
                key={kind}
                aria-label={`Add ${label.toLowerCase()} sticker`}
                title={label}
                disabled={design.stickers.length >= 24}
                onPointerDown={(e) => start(e, kind)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={(e) => end(e, true)}
                onLostPointerCapture={(e) => end(e, true)}
                onClick={(e) => {
                  if (e.detail === 0) add(kind);
                }}
              >
                <StickerArt kind={kind} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        {draft.photo && (
          <fieldset className="scrapbook-control-group scrapbook-tape-group">
            <legend>Photo tape</legend>
            <div className="scrapbook-tape-options">
              {(["midnight", "linen", "sage"] as const).map((tape) => (
                <button
                  type="button"
                  key={tape}
                  aria-label={`${tape} tape`}
                  aria-pressed={design.tape === tape}
                  onClick={() => updateDesign({ tape })}
                >
                  <i
                    className={`scrapbook-tape-swatch scrapbook-tape-swatch-${tape}`}
                    aria-hidden="true"
                  />
                  {tape[0].toUpperCase() + tape.slice(1)}
                </button>
              ))}
            </div>
            <label className="scrapbook-range">
              Photo angle
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={design.photoTilt}
                onChange={(e) =>
                  updateDesign({ photoTilt: Number(e.target.value) })
                }
              />
            </label>
          </fieldset>
        )}
        {active && (
          <fieldset className="scrapbook-control-group scrapbook-selection">
            <legend>{labelFor(active.kind)} sticker</legend>
            <div className="scrapbook-transform-tools">
              <button
                type="button"
                className="icon-button"
                aria-label="Rotate sticker left"
                onClick={() =>
                  updateSticker(active.id, {
                    rotation: clamp(active.rotation - 15, -180, 180),
                  })
                }
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Rotate sticker right"
                onClick={() =>
                  updateSticker(active.id, {
                    rotation: clamp(active.rotation + 15, -180, 180),
                  })
                }
              >
                <RotateCw size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Make sticker smaller"
                onClick={() =>
                  updateSticker(active.id, {
                    scale: clamp(
                      Number((active.scale - 0.1).toFixed(1)),
                      0.6,
                      1.6,
                    ),
                  })
                }
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Make sticker larger"
                onClick={() =>
                  updateSticker(active.id, {
                    scale: clamp(
                      Number((active.scale + 0.1).toFixed(1)),
                      0.6,
                      1.6,
                    ),
                  })
                }
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Remove selected sticker"
                onClick={() => remove(active.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <label className="scrapbook-range">
              Across
              <input
                type="range"
                min={9}
                max={91}
                step={1}
                value={active.x}
                onChange={(e) =>
                  updateSticker(active.id, { x: Number(e.target.value) })
                }
              />
            </label>
            <label className="scrapbook-range">
              Down
              <input
                type="range"
                min={8}
                max={92}
                step={1}
                value={active.y}
                onChange={(e) =>
                  updateSticker(active.id, { y: Number(e.target.value) })
                }
              />
            </label>
          </fieldset>
        )}
      </div>
      <div className="scrapbook-preview-wrap">
        <div className="scrapbook-preview-label">
          <span>Your album page</span>
          <span>{design.stickers.length}/24 stickers</span>
        </div>
        <div className="scrapbook-preview" ref={paperRef}>
          <ScrapbookPage
            voice={authorId === "alex" ? "space" : "earth"}
            title={draft.title || "A little moment"}
            text={draft.text || "Your words belong here."}
            photo={draft.photo}
            object3d={draft.object3d}
            onObjectChange={object3d => onChange({ object3d })}
            design={design}
          >
            {design.stickers.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={`scrapbook-sticker scrapbook-editable-sticker ${selected === item.id ? "is-selected" : ""}`}
                style={stickerStyle(item)}
                aria-label={`${labelFor(item.kind)} sticker ${index + 1}`}
                aria-describedby="sticker-keyboard-help"
                aria-pressed={selected === item.id}
                onClick={() => setSelected(item.id)}
                onFocus={() => setSelected(item.id)}
                onKeyDown={(e) => onStickerKey(e, item)}
                onPointerDown={(e) => start(e, undefined, item)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={(e) => end(e, true)}
                onLostPointerCapture={(e) => end(e, true)}
              >
                <StickerArt kind={item.kind} />
              </button>
            ))}
          </ScrapbookPage>
        </div>
        <p id="sticker-keyboard-help" className="scrapbook-hint">
          Drag a sticker to place it. Arrow keys move it; Delete removes it.
        </p>
      </div>
      {ghost && (
        <div
          className="scrapbook-drag-ghost"
          style={{ left: ghost.x, top: ghost.y }}
          aria-hidden="true"
        >
          <StickerArt kind={ghost.kind} />
        </div>
      )}
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}

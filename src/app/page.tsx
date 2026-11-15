"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookHeart,
  BookOpen,
  Check,
  CheckCheck,
  CircleHelp,
  Cloud,
  Feather,
  Heart,
  ImagePlus,
  Leaf,
  LockKeyhole,
  Moon,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  createAlbum,
  getAlbums,
  getPeople,
  addContribution,
  advanceDelivery,
  createInitialData,
  formatDate,
  getReplyNotifications,
  hasCrisisLanguage,
  weekKey,
  type AppData,
  type Contribution,
  type Draft,
  type Person,
} from "@/lib/model";
import { STORAGE_KEY, compressPhoto, parseStoredData } from "@/lib/storage";
import AlbumBook from "@/components/AlbumBook";
import AlbumOpening from "@/components/AlbumOpening";
import {
  measureOpeningTarget,
  type OpeningTarget,
} from "@/lib/opening-geometry";
import ScrapbookEditor from "@/components/ScrapbookEditor";
import Bookshelf from "@/components/Bookshelf";
import AddAlbumForm, { type AlbumInput } from "@/components/AddAlbumForm";
import "./bookshelf.css";
import "./physical-albums.css";
import "./bookshelf-home.css";
import "./replies-board.css";

type View = "albums" | "story" | "compose" | "checkin" | "replies";
type Dialog = "connection" | "help" | "about" | "new-album" | null;
const emptyDraft: Draft = { title: "", text: "" };
const shelfOrder = new Map(
  ["sam", "maya", "june", "lily"].map((id, index) => [id, index]),
);
function Avatar({
  person: p,
  size = "normal",
}: {
  person: Person;
  size?: "normal" | "small";
}) {
  return (
    <span className={`avatar ${p.color} ${size}`} aria-hidden="true">
      {p.initials}
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex="0"]',
        ) ?? [],
      ).filter((e) => !e.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Support({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`support-panel ${compact ? "compact" : ""}`}
      role="region"
      aria-label="Immediate support"
    >
      <div className="support-title">
        <Heart size={19} />
        <strong>You don’t have to carry this alone.</strong>
      </div>
      <p>
        If you might hurt yourself or are in immediate danger, contact local
        emergency services or your mission’s medical team now. Don’t wait for a
        reply through this album.
      </p>
      <p>
        Reach out to someone you trust who can stay with you. On a mission, use
        your designated urgent medical channel.
      </p>
      <div className="support-resource">
        <span>On Earth · Brazil</span>
        <a href="tel:+55188?oai_link_source=model_response_hotline">
          CVV · Call 188 <ArrowRight size={14} />
        </a>
        <a
          href="https://www.cvv.org.br/chat/?oai_link_source=model_response_hotline"
          target="_blank"
          rel="noreferrer"
        >
          CVV confidential web chat ↗
        </a>
        <small>
          For other locations, use your local crisis service. CVV is emotional
          support, not an emergency service.
        </small>
      </div>
      <p className="fine-print">
        You can keep writing. This message is private and does not alert anyone.
        Automated prompts can miss distress or misunderstand words.
      </p>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<AppData>(() =>
    createInitialData(new Date("2026-11-14T12:00:00Z")),
  );
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("albums");
  const [selected, setSelected] = useState("lily");
  const [profile, setProfile] = useState("alex");
  const [paused, setPaused] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(true);
  const [dark, setDark] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [highlight, setHighlight] = useState("");
  const [opening, setOpening] = useState<{
    albumId: string;
    origin: { left: number; top: number; width: number; height: number };
  } | null>(null);
  const [readerReady, setReaderReady] = useState(false);
  const [openingTarget, setOpeningTarget] = useState<OpeningTarget | null>(
    null,
  );
  const openingLock = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastStored = useRef<string | null>(null);
  const allAlbums = getAlbums(data);
  const allPeople = getPeople(data);
  const person = (id: string) => allPeople.find((item) => item.id === id)!;
  const album = allAlbums.find((a) => a.id === selected) ?? allAlbums[0];
  const openingAlbum = opening
    ? allAlbums.find((a) => a.id === opening.albumId)
    : undefined;
  const current = person(profile);
  const astronaut = person("alex");
  const online = deviceOnline && !paused;
  const albums =
    profile === "alex"
      ? allAlbums
      : allAlbums.filter((a) => a.personId === profile);
  const notifications = getReplyNotifications(data, profile);
  const draftKey = `${profile}:${selected}`;
  const draft = data.drafts[draftKey] ?? emptyDraft;
  const pagesForAlbum = (albumId: string) =>
    data.pages
      .filter(
        (page) =>
          page.albumId === albumId &&
          (page.authorId === profile ||
            page.status === "delivered" ||
            page.status === "answered"),
      )
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const visiblePages = pagesForAlbum(selected);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const weekly = data.checkIns.find(
    (c) => c.profileId === profile && c.week === weekKey(new Date()),
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      lastStored.current = raw;
      if (raw) setData(parseStoredData(raw));
      else setData(createInitialData());
      setDark(localStorage.getItem("still-here:theme") === "night");
    } catch {
      setStorageError(
        "Saved data could not be read. This session is temporary; your original browser data has not been replaced.",
      );
    }
    setDeviceOnline(navigator.onLine);
    setReady(true);
    const connected = () => setDeviceOnline(navigator.onLine);
    const externalChange = (e: StorageEvent) => {
      if (
        (e.key === STORAGE_KEY || e.key === null) &&
        e.newValue !== lastStored.current
      )
        setStorageError(
          "Another tab changed your saved albums. To protect both versions, changes in this tab are temporary. Keep any unsaved words, then reload. Please work in one tab at a time.",
        );
    };
    window.addEventListener("online", connected);
    window.addEventListener("offline", connected);
    window.addEventListener("storage", externalChange);
    return () => {
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", connected);
      window.removeEventListener("storage", externalChange);
    };
  }, []);
  useEffect(() => {
    if (
      !ready ||
      storageError.startsWith("Saved data") ||
      storageError.startsWith("Another tab")
    )
      return;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== lastStored.current) {
        setStorageError(
          "Another tab changed your saved albums. To protect both versions, changes in this tab are temporary. Keep any unsaved words, then reload. Please work in one tab at a time.",
        );
        return;
      }
      const raw = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, raw);
      lastStored.current = raw;
      setStorageError("");
    } catch {
      setStorageError(
        "Browser storage is full or unavailable. Your changes are only in this session. Remove a photo or free browser storage before closing.",
      );
    }
  }, [data, ready, storageError]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "night" : "day";
    if (ready)
      try {
        localStorage.setItem("still-here:theme", dark ? "night" : "day");
      } catch {}
  }, [dark, ready]);
  useEffect(() => {
    if (!ready) return;
    const tick = () =>
      setData((d) => {
        const pages = advanceDelivery(d.pages, online, new Date());
        return pages === d.pages ? d : { ...d, pages };
      });
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [ready, online]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (ready && !opening) {
      window.scrollTo({ top: 0, behavior: "instant" });
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [view, selected, ready, opening]);
  useEffect(() => {
    if (view === "checkin") {
      setRatings(
        weekly
          ? {
              connection: weekly.connection,
              loneliness: weekly.loneliness,
              support: weekly.support,
            }
          : {},
      );
      setNote(weekly?.note ?? "");
    }
  }, [view, profile, weekly?.id]);
  const navigate = (next: View) => {
    setHighlight("");
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const updateDraft = (changes: Partial<Draft>) =>
    setData((d) => ({
      ...d,
      drafts: {
        ...d.drafts,
        [draftKey]: { ...(d.drafts[draftKey] ?? emptyDraft), ...changes },
      },
    }));
  const openAlbum = (id: string, trigger?: HTMLElement) => {
    if (openingLock.current) return;
    const source = trigger?.querySelector<HTMLElement>(".album-book");
    const bounds = source?.getBoundingClientRect();
    if (
      !pagesForAlbum(id).length ||
      !bounds?.width ||
      !bounds.height ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setSelected(id);
      navigate("story");
      return;
    }
    openingLock.current = true;
    setReaderReady(false);
    setOpeningTarget(null);
    setOpening({
      albumId: id,
      origin: {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      },
    });
  };
  const prepareOpening = useCallback(() => {
    if (!opening || !openingLock.current) return;
    setSelected(opening.albumId);
    setHighlight("");
    setView("story");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [opening]);
  const markReaderReady = useCallback(() => {
    if (openingLock.current) {
      const reader = document.querySelector<HTMLElement>(
        ".app-shell .album-reader",
      );
      if (reader) setOpeningTarget(measureOpeningTarget(reader));
    }
    setReaderReady(true);
  }, []);
  const finishOpening = useCallback(() => {
    if (!opening || !openingLock.current) return;
    openingLock.current = false;
    setSelected(opening.albumId);
    setHighlight("");
    setView("story");
    setOpening(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [opening]);
  const compose = (id = selected, replyTo?: string) => {
    setSelected(id);
    if (replyTo)
      setData((d) => ({
        ...d,
        drafts: {
          ...d.drafts,
          [`${profile}:${id}`]: {
            ...(d.drafts[`${profile}:${id}`] ?? emptyDraft),
            replyTo,
          },
        },
      }));
    setPhotoError("");
    navigate("compose");
    setDialog(null);
  };
  const openReply = (page: Contribution) => {
    setSelected(page.albumId);
    setHighlight(page.id);
    setData((d) => ({
      ...d,
      readReplyIds: [...new Set([...d.readReplyIds, page.id])],
    }));
    setView("story");
  };
  const publish = () => {
    try {
      const next = addContribution(data, {
        albumId: selected,
        authorId: profile,
        ...draft,
      });
      const drafts = { ...next.drafts };
      delete drafts[draftKey];
      setData({ ...next, drafts });
      const createdPage = next.pages.find(
        (page) => !data.pages.some((existing) => existing.id === page.id),
      );
      setHighlight(createdPage?.id ?? "");
      setView("story");
      window.scrollTo({ top: 0, behavior: "instant" });
      setToast(
        online ? "Page recorded." : "Page recorded. Queued until reconnection.",
      );
    } catch (e) {
      setPhotoError(
        e instanceof Error ? e.message : "Your page could not be recorded.",
      );
    }
  };
  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError("");
    const key = draftKey;
    try {
      const photo = await compressPhoto(file);
      setData((d) => ({
        ...d,
        drafts: {
          ...d.drafts,
          [key]: { ...(d.drafts[key] ?? emptyDraft), photo, object3d: undefined },
        },
      }));
    } catch (e) {
      setPhotoError(
        e instanceof Error ? e.message : "Unable to prepare this photo.",
      );
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const saveCheckin = () => {
    const now = new Date();
    setData((d) => ({
      ...d,
      checkIns: [
        ...d.checkIns.filter(
          (c) => !(c.profileId === profile && c.week === weekKey(now)),
        ),
        {
          id: weekly?.id ?? crypto.randomUUID(),
          profileId: profile,
          week: weekKey(now),
          createdAt: now.toISOString(),
          connection: ratings.connection,
          loneliness: ratings.loneliness,
          support: ratings.support,
          note: note.trim(),
        },
      ],
    }));
    setToast("Your check-in is saved privately on this device.");
  };
  const closeDialog = useCallback(() => setDialog(null), []);
  const showNewAlbum = () => {
    setDialog("new-album");
  };
  const handleCreateAlbum = (input: AlbumInput) => {
    const id = `album-${crypto.randomUUID()}`;
    const next = createAlbum(data, input, id);
    setData(next);
    setSelected(id);
    setDialog(null);
    navigate("albums");
    setToast("Album added to your bookshelf.");
  };

  return (
    <div
      className={
        view === "story"
          ? "app-shell immersive-reader"
          : `app-shell scrapbook-shell${view === "albums" ? " bookshelf-home" : ""}`
      }
      inert={opening ? true : undefined}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {view !== "story" && (
        <aside className="sidebar">
          <div
            className="astronaut-name"
            aria-label={"Astronaut " + astronaut.name}
          >
            {astronaut.name}
          </div>
          <span className="nav-label">YOUR SPACE</span>
          <nav aria-label="Main navigation">
            <button
              className={
                ["albums", "story", "compose"].includes(view)
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => navigate("albums")}
            >
              <BookOpen size={19} />
              Our albums<span className="nav-number">{albums.length}</span>
            </button>
            <button
              className={view === "replies" ? "nav-item active" : "nav-item"}
              onClick={() => navigate("replies")}
            >
              <Bell size={19} />
              Replies
              {notifications.length > 0 && (
                <span className="notification-count">
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              className={view === "checkin" ? "nav-item active" : "nav-item"}
              onClick={() => navigate("checkin")}
            >
              <Leaf size={19} />
              Your check-in
              <LockKeyhole className="nav-lock" size={13} />
            </button>
          </nav>
          <div className="sidebar-bottom">
            <button
              className="connection-card"
              onClick={() => setDialog("connection")}
            >
              <span className={`connection-dot ${online ? "" : "paused"}`} />
              <span>
                <strong>
                  {online ? "Connection is open" : "Connection is paused"}
                </strong>
              </span>
              <Settings2 size={14} />
            </button>
            <button className="help-button" onClick={() => setDialog("help")}>
              <CircleHelp size={16} />
              Support
              <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      )}
      <div className="workspace">
        {view !== "story" && (
          <div
            className="mobile-astronaut"
            aria-label={"Astronaut " + astronaut.name}
          >
            {astronaut.name}
          </div>
        )}
        <main id="main-content" className={`main-content view-${view}`}>
          {storageError && (
            <div className="storage-warning" role="alert">
              <Cloud size={18} />
              {storageError}
            </div>
          )}
          {view === "albums" && (
            <Bookshelf
              albums={[...albums]
                .sort(
                  (left, right) =>
                    (shelfOrder.get(left.id) ?? 4) -
                    (shelfOrder.get(right.id) ?? 4),
                )
                .map((item) => ({
                  album: item,
                  companionName: person(item.personId).name,
                  astronautName: astronaut.name,
                  pageCount: pagesForAlbum(item.id).length,
                  hasReply: notifications.some(
                    (reply) => reply.albumId === item.id,
                  ),
                  hasDraft: !!(
                    data.drafts[`${profile}:${item.id}`]?.text ||
                    data.drafts[`${profile}:${item.id}`]?.photo
                  ),
                }))}
              onOpen={openAlbum}
              onAddAlbum={showNewAlbum}
              headingRef={titleRef}
              openingAlbumId={opening?.albumId}
            />
          )}

          {view === "story" && (
            <>
              <div className="reader-topbar">
                <button
                  className="back-button"
                  aria-label="Back to shelf"
                  onClick={() => navigate("albums")}
                >
                  <ArrowLeft size={20} />
                  Shelf
                </button>
                <span className="reader-signature">Still Here</span>
              </div>
              <h1 className="sr-only" ref={titleRef} tabIndex={-1}>
                {album.title}
              </h1>
              <AlbumBook
                key={selected + ":" + profile}
                pages={visiblePages}
                album={album}
                people={allPeople}
                profileId={profile}
                initialPageId={highlight || undefined}
                onReady={markReaderReady}
                onCompose={(replyTo) => compose(selected, replyTo)}
                onObjectChange={(id, object3d) => setData(current => ({
                  ...current,
                  pages: current.pages.map(p => p.id === id ? { ...p, object3d } : p),
                }))}
              />
            </>
          )}

          {view === "compose" && (
            <div className="editor-wrap">
              <button className="back-button" onClick={() => navigate("story")}>
                <ArrowLeft size={16} />
                Back to the album
              </button>
              <div className="editor-heading">
                <span className="eyebrow small">
                  A NEW PAGE · WITH{" "}
                  {profile === "alex"
                    ? person(album.personId).name.toUpperCase()
                    : "ALEX"}
                </span>
                <h1 ref={titleRef} tabIndex={-1}>
                  A new page.
                </h1>
              </div>
              <form
                className="editor-paper"
                onSubmit={(e) => {
                  e.preventDefault();
                  publish();
                }}
              >
                {draft.replyTo && (
                  <div className="replying-to">
                    <Heart size={15} />
                    <span>
                      Continuing “
                      {data.pages.find((p) => p.id === draft.replyTo)?.title ??
                        "your shared story"}
                      ”
                    </span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Remove reply link"
                      onClick={() => updateDraft({ replyTo: undefined })}
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
                <ScrapbookEditor
                  key={draftKey}
                  draft={draft}
                  authorId={profile}
                  onChange={updateDraft}
                  onChoosePhoto={() => fileRef.current?.click()}
                  photoBusy={photoBusy}
                  support={
                    hasCrisisLanguage(draft.text + " " + draft.title) ? (
                      <div className="immediate-support" role="alert">
                        <Support compact />
                      </div>
                    ) : undefined
                  }
                />
                <input
                  ref={fileRef}
                  type="file"
                  tabIndex={-1}
                  aria-label="Choose a photo"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    void handlePhoto(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {photoError && (
                  <p className="field-error" role="alert">
                    {photoError}
                  </p>
                )}
                <div className="editor-meta">
                  <span>
                    <Avatar person={current} size="small" />A page from{" "}
                    {current.name}
                  </span>
                  <span>
                    <Check size={13} />
                    {storageError
                      ? "Draft in this session"
                      : ready
                        ? "Draft saved on this device"
                        : "Opening your notebook…"}
                  </span>
                </div>
                <div className="editor-actions">
                  <p>
                    <LockKeyhole size={13} />
                    Only for this shared album.
                  </p>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      !ready ||
                      photoBusy ||
                      (!draft.text.trim() && !draft.photo)
                    }
                  >
                    <Send size={16} />
                    Publish page
                  </button>
                </div>
              </form>
              {!online && (
                <p className="editor-footnote">
                  <Cloud size={15} />
                  Connection paused · Your page will stay queued.
                </p>
              )}
            </div>
          )}

          {view === "replies" && (
            <section
              className="rustic-bookshelf replies-board"
              aria-labelledby="replies-title"
            >
              <div className="shelf-cabinet">
                <header className="shelf-heading">
                  <h1 id="replies-title" ref={titleRef} tabIndex={-1}>
                    Replies
                  </h1>
                  <button
                    className="shelf-add-album"
                    type="button"
                    onClick={showNewAlbum}
                  >
                    <Plus size={18} />
                    Add album
                  </button>
                  <span className="shelf-heading-brand">Still Here</span>
                </header>
                <div className="replies-paper">
                  {data.pages
                    .filter(
                      (p) =>
                        p.replyTo &&
                        p.authorId !== profile &&
                        ["delivered", "answered"].includes(p.status) &&
                        data.pages.some(
                          (parent) =>
                            parent.id === p.replyTo &&
                            parent.authorId === profile,
                        ),
                    )
                    .reverse()
                    .map((page) => (
                      <button
                        className="inbox-card"
                        key={page.id}
                        onClick={() => openReply(page)}
                      >
                        <Avatar person={person(page.authorId)} />
                        <div>
                          {!data.readReplyIds.includes(page.id) && (
                            <span className="new-label">A NEW PAGE</span>
                          )}
                          <h2>
                            {person(page.authorId).name} continued your story
                          </h2>
                          <p>
                            In response to “
                            {
                              data.pages.find((p) => p.id === page.replyTo)
                                ?.title
                            }
                            ”
                          </p>
                          <blockquote>{page.text}</blockquote>
                          <span className="inbox-date">
                            {formatDate(page.createdAt)} · Open their page
                          </span>
                        </div>
                        <ArrowRight size={19} />
                      </button>
                    ))}
                  {!data.pages.some(
                    (p) =>
                      p.replyTo &&
                      p.authorId !== profile &&
                      ["delivered", "answered"].includes(p.status) &&
                      data.pages.some(
                        (parent) =>
                          parent.id === p.replyTo &&
                          parent.authorId === profile,
                      ),
                  ) && (
                    <div className="empty-state">
                      <BookHeart size={40} />
                      <h2>A quiet space for now.</h2>

                      <button
                        className="secondary-button"
                        onClick={() => navigate("albums")}
                      >
                        Back to my bookshelf
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {view === "checkin" && (
            <div className="checkin-wrap">
              <span className="privacy-badge">
                <LockKeyhole size={12} />
                PRIVATE · JUST FOR {current.name.toUpperCase()}
              </span>
              <h1 ref={titleRef} tabIndex={-1}>
                How is your heart,
                <br />
                <em>this week?</em>
              </h1>

              <div className="checkin-week">
                <Leaf size={16} />
                Week of {formatDate(weekKey(new Date()) + "T00:00:00Z")}
                {weekly && <span>Saved · Editable</span>}
              </div>
              <form
                className="checkin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveCheckin();
                }}
              >
                {[
                  {
                    key: "connection",
                    label: "How connected have you felt to your people?",
                    low: "Not connected",
                    high: "Very connected",
                  },
                  {
                    key: "loneliness",
                    label: "How much loneliness have you felt?",
                    low: "Not at all",
                    high: "A great deal",
                  },
                  {
                    key: "support",
                    label: "How supported have you felt?",
                    low: "Not supported",
                    high: "Very supported",
                  },
                ].map((q, i) => (
                  <fieldset className="question" key={q.key}>
                    <legend>
                      <span>0{i + 1}</span>
                      {q.label}
                    </legend>
                    <div className="rating-options">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label
                          className={
                            ratings[q.key] === n
                              ? "rating-option selected"
                              : "rating-option"
                          }
                          key={n}
                        >
                          <input
                            type="radio"
                            name={q.key}
                            value={n}
                            required
                            checked={ratings[q.key] === n}
                            onChange={() =>
                              setRatings({ ...ratings, [q.key]: n })
                            }
                            aria-label={`${n} of 5${n === 1 ? " — " + q.low : n === 5 ? " — " + q.high : ""}`}
                          />
                          <span>{n}</span>
                        </label>
                      ))}
                    </div>
                    <div className="scale-labels">
                      <span>1 · {q.low}</span>
                      <span>5 · {q.high}</span>
                    </div>
                  </fieldset>
                ))}
                <label className="field-label" htmlFor="checkin-note">
                  A note for yourself <span>(optional)</span>
                </label>
                <textarea
                  className="note-input"
                  id="checkin-note"
                  placeholder="A thought, a feeling, a little thing you need…"
                  value={note}
                  maxLength={2000}
                  onChange={(e) => setNote(e.target.value)}
                />
                {hasCrisisLanguage(note) && (
                  <div className="immediate-support" role="alert">
                    <Support compact />
                  </div>
                )}
                <div className="checkin-actions">
                  <span>
                    <ShieldCheck size={17} />
                    For reflection, never a score.
                  </span>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      !ratings.connection ||
                      !ratings.loneliness ||
                      !ratings.support
                    }
                  >
                    <Check size={16} />
                    {weekly ? "Update my check-in" : "Save my check-in"}
                  </button>
                </div>
                {weekly && (
                  <p className="saved-checkin">
                    <CheckCheck size={15} />
                    Saved {formatDate(weekly.createdAt)}.
                  </p>
                )}
              </form>
              <div className="privacy-note">
                <LockKeyhole size={18} />
                <p>
                  Saved in this browser, separate from your albums. Demo
                  profiles share this device.{" "}
                  <button
                    className="inline-info"
                    type="button"
                    onClick={() => setDialog("about")}
                  >
                    About privacy
                  </button>
                </p>
              </div>
              {data.checkIns.filter(
                (c) =>
                  c.profileId === profile && c.week !== weekKey(new Date()),
              ).length > 0 && (
                <details className="past-checkins">
                  <summary>Previous private reflections</summary>
                  {data.checkIns
                    .filter(
                      (c) =>
                        c.profileId === profile &&
                        c.week !== weekKey(new Date()),
                    )
                    .reverse()
                    .map((c) => (
                      <div key={c.id}>
                        <strong>
                          Week of {formatDate(c.week + "T00:00:00Z")}
                        </strong>
                        <p>
                          Connection {c.connection}/5 · Loneliness{" "}
                          {c.loneliness}/5 · Support {c.support}/5
                        </p>
                        {c.note && <p>{c.note}</p>}
                      </div>
                    ))}
                </details>
              )}
            </div>
          )}
        </main>
        {view !== "story" && (
          <footer className="workspace-footer">
            <span>Demo · Simulated delivery · Browser storage</span>
            <div className="footer-links">
              <button onClick={() => setDialog("connection")}>Settings</button>
              <button onClick={() => setDialog("about")}>How it works</button>
              <button onClick={() => setDialog("help")}>
                Support
                <Heart size={12} />
              </button>
            </div>
          </footer>
        )}
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {dialog === "new-album" && (
        <Modal title="Add an album" onClose={closeDialog}>
          <AddAlbumForm
            people={allPeople.filter(
              (item) =>
                item.id !== "alex" &&
                (profile === "alex" || item.id === profile),
            )}
            defaultPersonId={profile === "alex" ? "lily" : profile}
            canAddPerson={profile === "alex"}
            onCreate={handleCreateAlbum}
          />
        </Modal>
      )}
      {dialog === "connection" && (
        <Modal title="The space between us." onClose={closeDialog}>
          <p className="modal-intro">
            This is an interactive preview. Pages and check-ins stay on this
            device; no real messages are sent.
          </p>
          <div className="link-setting">
            <span className="setting-icon">
              {online ? <Wifi size={23} /> : <WifiOff size={23} />}
            </span>
            <div>
              <strong>
                {online ? "The demo link is open" : "The demo link is paused"}
              </strong>
              <p>
                Delivery takes at least 12 seconds after sending. Pauses hold
                all updates until the link returns.
              </p>
            </div>
            <button
              className={`switch ${!paused ? "on" : ""}`}
              role="switch"
              aria-checked={!paused}
              aria-label="Simulated communication link"
              onClick={() => setPaused(!paused)}
            >
              <span />
            </button>
          </div>
          {!deviceOnline && (
            <p className="field-error">
              Your device is offline. Pages remain queued until it reconnects.
            </p>
          )}
          <div className="appearance-setting">
            <span>
              <Moon size={17} />
              Night mode
            </span>
            <button
              className={"switch " + (dark ? "on" : "")}
              role="switch"
              aria-checked={dark}
              aria-label="Night mode"
              onClick={() => setDark(!dark)}
            >
              <span />
            </button>
          </div>
          <label className="field-label" htmlFor="profile-select">
            Explore another side of the story
          </label>
          <select
            id="profile-select"
            className="profile-select"
            value={profile}
            onChange={(e) => {
              setProfile(e.target.value);
              if (e.target.value !== "alex")
                setSelected(
                  allAlbums.find((item) => item.personId === e.target.value)
                    ?.id ?? "lily",
                );
              navigate("albums");
              setDialog(null);
            }}
          >
            {allPeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="fine-print">
            Demo profiles let you write a reply from someone else’s perspective.
            They are not secure accounts. To test a full exchange: publish as
            Alex, wait for delivery, switch to the other person and write the
            next page, then return to Alex.
          </p>
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <p>
              A real mission needs authenticated accounts, encrypted storage,
              and a verified delivery service. This preview does not provide
              those yet.
            </p>
          </div>
        </Modal>
      )}
      {dialog === "about" && (
        <Modal title="Good stories take their time." onClose={closeDialog}>
          <p className="modal-intro">
            No rush. No missed moments. Add pages whenever you like;
            communication delays and interruptions can hold delivery. Nobody
            needs to be online together.
          </p>
          <ol className="how-it-works">
            <li>
              <Cloud size={21} />
              <div>
                <strong>Recorded</strong>
                <p>
                  Your page is kept on this device, even during an interruption.
                </p>
              </div>
            </li>
            <li>
              <Send size={21} />
              <div>
                <strong>Sent</strong>
                <p>
                  The demo link has picked up your page. It may still be
                  travelling.
                </p>
              </div>
            </li>
            <li>
              <CheckCheck size={21} />
              <div>
                <strong>Delivered</strong>
                <p>
                  The page has reached the shared demo album. This is not a read
                  receipt.
                </p>
              </div>
            </li>
            <li>
              <Heart size={21} />
              <div>
                <strong>Answered</strong>
                <p>
                  The other person has added and delivered a page in response.
                  Their words come back to you in Replies.
                </p>
              </div>
            </li>
          </ol>
          <p className="fine-print">
            This preview uses a simulated link. It never invents a human reply.
            In a real mission, delays may be much longer. Check-ins stay
            separate from albums and are not monitored or used for diagnosis.
            Page counts never measure well-being. Demo profiles share this
            browser’s unencrypted storage.
          </p>
        </Modal>
      )}
      {dialog === "help" && (
        <Modal
          title="A little support, whenever you need it."
          onClose={closeDialog}
        >
          <Support />
          <div className="quiet-support">
            <Leaf size={20} />
            <div>
              <strong>For the everyday space between</strong>
              <p>
                You can pause, leave a draft, or tell someone you’d like some
                company. If things feel hard, your designated care team can help
                you find support.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {opening &&
        createPortal(
          <AlbumOpening
            album={openingAlbum!}
            people={allPeople}
            personName={person(openingAlbum!.personId).name}
            origin={opening.origin}
            target={openingTarget}
            profileId={profile}
            pages={pagesForAlbum(opening.albumId).slice(0, 2)}
            totalPages={pagesForAlbum(opening.albumId).length}
            onPrepare={prepareOpening}
            readerReady={readerReady}
            onComplete={finishOpening}
          />,
          document.body,
        )}
    </div>
  );
}

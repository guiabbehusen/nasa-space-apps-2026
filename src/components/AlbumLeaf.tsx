import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Cloud,
  CornerUpLeft,
  Heart,
  Send,
} from "lucide-react";
import {
  PEOPLE,
  formatDate,
  getStatusLabel,
  type Contribution,
  type Person,
} from "@/lib/model";
import ScrapbookPage from "./ScrapbookPage";
import "./album-leaf.css";

export type LeafNavigation = {
  showPrevious?: boolean;
  showNext?: boolean;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
};
type Props = {
  page: Contribution;
  pageIndex: number;
  profileId: string;
  visibleInBook?: boolean;
  onObjectChange?: (model?: Contribution["object3d"]) => void;
  people?: Person[];
  presentation?: boolean;
  onReply?: () => void;
  navigation?: LeafNavigation;
};
const statusIcon = (page: Contribution) =>
  page.status === "recorded"
    ? Cloud
    : page.status === "sent"
      ? Send
      : page.status === "answered"
        ? Heart
        : CheckCheck;

/** A live physical leaf and an identical noninteractive opening counterpart. */
export default function AlbumLeaf({
  page,
  pageIndex,
  profileId,
  people = PEOPLE,
  presentation = false,
  visibleInBook,
  onObjectChange,
  onReply,
  navigation,
}: Props) {
  const authorName = (id: string) =>
    people.find((person) => person.id === id)?.name ?? "Someone close";
  const Icon = statusIcon(page);
  const own = page.authorId === profileId;
  const canReply =
    !own && (page.status === "delivered" || page.status === "answered");
  const voice = page.authorId === "alex" ? "space" : "earth";
  const Container = presentation ? "div" : "article";
  return (
    <Container
      className={`book-leaf-inner leaf-from-${voice}`}
      data-previous={navigation?.showPrevious ? "true" : undefined}
      aria-label={
        presentation ? undefined : `Page ${pageIndex + 1}: ${page.title}`
      }
      aria-hidden={presentation ? true : undefined}
    >
      <header className="leaf-header">
        <span>
          {authorName(page.authorId)} ·{" "}
          {voice === "space" ? "IN SPACE" : "EARTH"}
        </span>
      </header>
      <div
        className="leaf-content"
        data-opf-no-flip=""
        tabIndex={presentation ? undefined : 0}
        role={presentation ? undefined : "region"}
        aria-label={
          presentation
            ? undefined
            : `Read page ${pageIndex + 1} by ${authorName(page.authorId)}`
        }
      >
        <ScrapbookPage
          title={page.title}
          text={page.text}
          photo={page.photo}
          object3d={page.object3d}
          visibleInBook={visibleInBook}
          onObjectChange={onObjectChange}
          design={page.design}
          voice={voice}
        />
      </div>
      <div className="leaf-response">
        {canReply &&
          (presentation ? (
            <span className="leaf-reply">
              <CornerUpLeft size={20} />
              Reply
            </span>
          ) : (
            <button
              type="button"
              className="leaf-reply"
              data-opf-no-flip=""
              aria-label={`Reply to ${authorName(page.authorId)}, page ${pageIndex + 1}`}
              onClick={onReply}
            >
              <CornerUpLeft size={20} />
              Reply
            </button>
          ))}
      </div>
      <footer className="leaf-footer">
        <time dateTime={page.createdAt}>
          {formatDate(page.createdAt)} · UTC
        </time>
        <span className={`leaf-status leaf-status-${page.status}`}>
          <Icon size={11} />
          {getStatusLabel(page.status)}
        </span>
      </footer>
      <span className="leaf-page-number" aria-hidden="true">
        {pageIndex + 1}
      </span>
      {navigation?.showPrevious &&
        (presentation ? (
          <span className="leaf-corner-control leaf-previous">
            <ArrowLeft size={23} />
          </span>
        ) : (
          <button
            type="button"
            className="leaf-corner-control leaf-previous"
            data-opf-no-flip=""
            aria-label="Previous page"
            title="Previous page · Left arrow"
            disabled={navigation.previousDisabled}
            onClick={navigation.onPrevious}
          >
            <ArrowLeft size={23} />
          </button>
        ))}
      {navigation?.showNext && (
        <>
          <span className="leaf-dogear" aria-hidden="true" />
          {presentation ? (
            <span className="leaf-corner-control leaf-next">
              <ArrowRight size={23} />
            </span>
          ) : (
            <button
              type="button"
              className="leaf-corner-control leaf-next"
              data-opf-no-flip=""
              aria-label="Next page"
              title="Next page · Right arrow"
              disabled={navigation.nextDisabled}
              onClick={navigation.onNext}
            >
              <ArrowRight size={23} />
            </button>
          )}
        </>
      )}
    </Container>
  );
}

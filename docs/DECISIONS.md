# Still Here: product and implementation decisions

The palette uses slate-blue application text, olive actions, and cloth covers in olive, clay, and slate. The first album's former ochre token now uses olive (`#64663c`) consistently on the shelf, moving cover, and open book. The main cream canvas remains; the immersive reader has its own parchment surface and olive ink. A darker slate-blue navigation bar with cream text distinguishes navigation from the canvas; selected items have a separate indicator as well as a different background. Avatars, delivery states, physical book bindings, and the navy night mode use the coordinated color tokens. Earlier contrast calculations are recorded in VERIFICATION.md; they are not a full audit of the revised textured reader.

The light palette uses a visible warm cream background (`#f2e7d4`), with cream surfaces and paper. Albums stand upright on a continuous light-maple display ledge, arranged four across on desktop and two per row on mobile. Their names, story titles, dates, and update states remain; relationship subtitles are omitted. The night palette retains its navy background and uses darker wooden ledges.

The interface has no global header bar. Outside the immersive reader, the astronaut's name identifies the space in the upper-left corner; switching a demo family perspective does not change that identity. New-page actions appear at the bottom of the home content and after the book's page controls and details. Settings, including the demo profiles and night-mode switch, and Support are available in the footer on the other screens.

## Purpose and evidence

Still Here explores how shared albums can preserve ordinary moments across a long separation. A page is a contribution to an ongoing relationship, with room for a later reply. Immediate availability is not assumed.

NASA's Human Research Roadmap gap BMed-106 and the 2026 family-conferencing study motivate the problem. They do not validate this interface or establish that this prototype improves well-being. [SOURCES.md](SOURCES.md) records the primary sources, their findings, and application limits. In particular, the study examined delays measured in seconds in a short laboratory setting; it did not establish this design's effectiveness for a long Mars mission.

## Honest MVP boundary

The application is a local-first **DEMO**, with that status visible in its interface. All data and profile perspectives exist inside one browser. The MVP provides neither authentication nor backend persistence, and it cannot send a page to another person or device. Example people and conversations are fictional; illustrative photographs are credited in [ASSETS.md](ASSETS.md).

Connection settings expose Alex and every seeded or locally added companion as demo perspectives. This allows a reviewer to create both sides of a conversation deliberately. It is not a sign-in system. UI filtering and author validation help demonstrate the intended interaction but do not create a security boundary: anyone with access to the browser can inspect or change its local data.

## A book for each shared story

The shelf-to-reader transition lasts approximately 1.9 seconds. It starts from the clicked cover's current viewport position, lifts and tilts the book away from the shelf, moves it toward the reader position, and rotates the hardcover around its spine. The shelf remains visible during the first phase; a textured parchment backdrop then replaces it while the cover opens, before the reader appears. This connects the shelf and book views without adding another destination or confirmation step.

`AlbumOpening.tsx` and its stylesheet implement this presentation-only bridge. The original cover keeps its shelf footprint while a decorative copy moves above an inert application surface. Focus moves to **Skip animation**, and completion hands focus to the reader heading. Skip, Escape, a viewport resize, or a change to reduced-motion preference finish safely; reduced motion at selection opens the reader immediately. Timers, listeners, and the temporary scroll lock are cleaned up on unmount, with a guarded fallback to prevent a stranded transition. Opening a reply directly is not a shelf pickup and retains its exact target-page behavior. The transition never creates contributions, changes delivery timestamps, or marks a page answered.

Opening an album shows an immersive physical-book reader rather than a timeline. The sidebar, mobile navigation, astronaut identity label, and global footer are not rendered in this view. **Shelf** appears at the upper left and **Still Here** at the upper right. The book fills the available workspace, with reply and navigation controls inside the pages, delivery details, and one bottom **Add a page** action. **Shelf** restores the regular navigation; **Add a page** opens the composer with that navigation restored. Each contribution is a page, ordered by its creation time from oldest to newest. The paper, binding, page stack, folding leaf, and moving shadows support the album metaphor. Forward and backward turns, including corner dragging, preserve the sense of turning a sheet rather than sliding cards.

The reader uses `src/components/AlbumBook.tsx` and `src/components/album-book.css`, with the page-fold engine supplied by `@openpageflip/react` and `@openpageflip/core`. The lockfile records the installed versions. Author, full UTC date, page position, and delivery status remain visible without a repeated explanatory paragraph on every page. A reply opens its corresponding contribution in the reader.

Previous/next controls and arrow-key navigation complement pointer interaction. Narrow screens use a portrait, single-page layout. The reduced-motion media query and effect are implemented to use the engine's instant navigation instead of animated turns; runtime testing of the OS preference remains pending. Long contributions stay inside a focusable region with native scrolling within the paper page, without a separate full-text modal. The **Page details** disclosure provides additional delivery information. Book navigation does not change delivery state, mark a page read for another participant, or generate a response.

## Less copy, information when needed

The home and editor focus on choosing a person, reading, and adding a page. Repeated slogans and prominent response-time reassurance are removed. The “no rush” explanation is available in the existing **How it works** modal through a discreet footer link outside the immersive reader. Operational status is still conveyed where it matters: a paused connection, an unsaved draft, or an unavailable browser store must remain clear.

Copy reduction does not remove the local-demo boundary, private check-in/storage information, or immediate support and emergency guidance. Those explain material limits or help the person make a decision, rather than repeating the product's mood.

## Pages and simulated transport

The delivery state describes what the prototype knows:

| State     | Meaning in this demo                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Recorded  | The contribution is saved locally and awaits the connection simulator.                                       |
| Sent      | The simulator has accepted the contribution and started its transit deadline.                                |
| Delivered | The 12-second simulated deadline has elapsed and a connected, unpaused simulator has applied the transition. |
| Answered  | A manually authored reply from the other participant in the same album has itself been delivered.            |

The simulated deadline is measured from sending; it is not a count of connected seconds. Offline and pause controls stop transitions. If the deadline elapses during an interruption, delivery may complete when the simulation resumes. There is no arrival promise, real acknowledgment from a recipient, or operational delay model behind these labels.

No timeout invents a reply or marks silence as a response. A same-author or cross-album contribution cannot answer the original page. Reply notifications appear for the original author's perspective after the reply is delivered. Opening a notification changes local notification state; it does not send a read receipt to another participant.

The interface avoids typing indicators, recipient read receipts, streaks, rankings, and activity targets. Page count and response speed are not proxies for relationship health. Dates retain a complete calendar date; model date formatting and week keys use UTC to stay consistent across locations.

## Persistence and drafts

Versioned `localStorage` holds the demo data schema. Pages and delivered replies support the shared demonstration; drafts are keyed by both profile and album, and weekly check-ins are associated with a profile. Draft autosave preserves work when leaving the editor or reloading the page.

Local persistence is not encryption, access control, cross-device synchronization, or a backup. Browser storage is quota-limited and can be removed by the browser or user. Errors must be visible rather than silently presented as a successful save. Offline editing refers to an already loaded application; a demo transport toggle alone is not evidence of an installable app or a guaranteed cold start without connectivity.

## Photo handling

Input is limited to JPEG, PNG, and WebP files of at most 10 MB. The browser decodes and re-encodes the image through canvas as JPEG, with a maximum longest edge of 1,280 pixels and an output target of roughly 350 KB. Original EXIF metadata is not copied. This reduces local-storage use and avoids retaining source camera/location metadata; it does not encrypt the picture or hide its visible content.

The editor permits removing the photo before recording the page. Base64 storage adds overhead, and browser quotas remain a constraint even after compression. The current design does not provide a remote media store, retention service, or production-grade image-processing pipeline.

## Weekly check-in

Connection, loneliness, and perceived support are separate, labeled 1–5 self-report responses with an optional note. They are saved for the active demo profile, and the current week's entry can be edited. Week boundaries are Monday in UTC.

No composite score, diagnostic label, risk classification, or alert to a third party is derived from these answers. The numbers have meaning only alongside their individual question labels; an increase in loneliness should not be interpreted like an increase in connection or support. Message frequency and album participation do not alter check-in answers.

## Immediate support

Help is available from the footer on the regular screens, independently of writing or completing a check-in. The immersive reader provides **Shelf** to return to those screens. Phrase matching in the editor and check-in note can surface an immediate, nonblocking support panel. Its English and Portuguese cues are a limited heuristic: it cannot reliably understand context, negation, intent, or every expression of distress. False positives and missed cues are expected limitations. It does not diagnose, contact anyone, or prevent a user from continuing.

The panel directs urgent situations to local emergency services or the mission medical team without waiting for a delayed album response. The demo includes a Brazil-specific CVV resource verified through the helpline lookup tool. This is a localized example, not a resource suitable for every country or mission. Production work must include clinical review, accessible wording, supported-language evaluation, current regional resources, and a clear operational response protocol.

## Stack and static deployment

The implementation uses Next.js 16.4.6, TypeScript, React 19, and Tailwind CSS 4. `next.config.ts` sets static export, producing `out/` for static hosting. There are no server routes, required secrets, or runtime API credentials in the MVP. Fonts and illustrative covers are self-hosted.

Use `npm ci` to install the lockfile, `npm run dev` for local development, `npm run typecheck` for TypeScript checking, `npm test` for model tests, and `npm run build` followed by `npm run preview` to inspect the export. `next start` does not serve this static-export workflow.

`.openai/hosting.json` records the Sites project binding and `out/` directory. The review deployment remains private through Sites access settings; that file is not itself an authentication mechanism. The application source is maintained on the original GitHub repository's `main` branch. A release has two distinct steps: push the validated source to GitHub and deploy its matching build through Sites.

## Verification approach

The `node:test` suite, executed through `tsx`, focuses on domain behavior: delivery interruption/reconnection, deadline handling, valid reply relationships, notifications, UTC dates/week boundaries, and a bounded set of support cues. Passing those tests cannot establish clinical safety, accessibility, or actual network delivery.

Manual acceptance should follow complete flows: open a book; navigate to its first and last pages; turn forward and backward; add a contribution; create and reload a draft; attach and remove a photo; record while offline; resume simulated delivery; switch perspective; author and deliver a reply; open the result on its book page; and create, reload, and edit a weekly check-in. Reader review should include odd/even page counts, a one-page album, corner dragging, portrait mode, keyboard controls, reduced motion, the focusable text region's native scrolling, and the **Page details** disclosure. Keyboard and mobile review should also cover focus visibility, dialog close/return behavior, labels, help access, and overflow. [VERIFICATION.md](VERIFICATION.md) records completed browser checks and distinguishes viewport testing from remaining real-device touch and runtime OS reduced-motion checks.

## Required before production

- Authenticated backend storage and explicit authorization/RBAC for album membership, profiles, and media.
- Encryption in transit and at rest, secure session handling, consent, retention, deletion, and appropriate protection for sensitive notes and check-ins.
- A delay-tolerant transport with durable queues, idempotency, duplicate handling, retries, and meaningful acknowledgments; product states must reflect actual evidence from that transport.
- Clinical review of support behavior and self-report language, with current localized resources and internationalization rather than reliance on a small bilingual phrase list.
- Evaluation with intended users of perceived connection, usability, accessibility, privacy, and effects over time. A successful demonstration or busy album does not establish a health benefit.

Concurrent tabs are intentionally guarded rather than merged: an external storage change pauses writes in the stale tab, keeps that session visible, and asks the reviewer to keep unsaved words before reloading. Use one editing tab at a time. Invalid stored snapshots are rejected as a whole and left untouched rather than silently filtered.

## Scrapbook composition

A reply is a new chronological page composed by its author. Classic, Postcard, and Letter provide readable text/photo arrangements; ten original code-native SVG stickers can be placed freely on top. Photos use a Polaroid frame and patterned washi tape, with linen, midnight, and sage colors. This follows the supplied visual reference without copying its people, text, or imagery. Audio recording is outside this change.

The editor and book use the same renderer. Text grows the paper as necessary and remains accessible through the reader’s native scrolling region. Sticker positions are percentages of that paper, with bounded rotation/scale and a maximum of 24 per page. Artwork that crosses a paper edge is clipped consistently in the preview and book. Text is always retained separately from decoration, so a sticker never deletes or rewrites it.

Pointer capture supports mouse/touch dragging; tap-to-add, arrow keys, Delete, labeled position sliders, and transform buttons provide alternatives. The narrow-screen tray stays accessible above the preview. Deleting a sticker returns focus to the tray. Physical touchscreen and assistive-technology verification are separate from viewport and keyboard checks.

Optional `design` metadata extends version-one pages/drafts without changing existing records. Strict validation rejects unknown kinds/layouts, duplicate sticker IDs, excessive counts, and nonfinite/out-of-range values. Publication copies the design independently of later draft changes. Designs contain no executable markup or remote assets. Existing delivery, replies, and private check-ins retain their original semantics. Crisis support remains immediately beneath the writing field, without disabling publication.

## Opening-to-reader handoff

The earlier transition removed its overlay and mounted the page-turn engine in the same update. Synchronous engine layout, image decoding, and resize work therefore happened exactly at reveal. The reader now mounts at its final immersive dimensions 780 ms into the cover animation, after the backdrop is opaque. It stays mounted through the handoff; clearing the overlay does not recreate the book.

`AlbumBook` reports readiness after its first engine initialization, the initial visible spread’s image load/decode (including failures), and two animation frames. Image waiting has a 1.8-second ceiling, stale callbacks are cancelled, and empty albums also become ready. The animation’s completion and reader readiness jointly release a 160 ms opacity transition. Offscreen photos never gate opening. The hardcover no longer has a deliberately stationary final 160 ms segment.

Skip, Escape, and viewport changes request the real reader immediately and hide the flying cover while it prepares. The overlay owns focus and the application stays inert until release; the reader heading receives focus afterward. Cancellation and final cleanup restore body scrolling. A seven-second recovery timer covers an interrupted animation or missing callback. These are presentation safeguards, not real-time performance guarantees. Reduced-motion state initializes before creating the page-turn engine to avoid rebuilding it immediately after mount.

## Physical album materials

The first physical-material revision placed the album on a self-hosted rustic wood material. The current reference-style reader replaces that visible table with a warm tan wash over the existing aged-paper texture. Cloth weave, stitched covers/spines, offset leaf stacks, uneven outer paper contours, a shaded gutter, and soft directional shadows create volume without transforming the page-turn engine or its input coordinates. The shelf pickup and reader share the current parchment/paper/cloth materials, preserving the prepared-reader handoff. Generated wood and paper textures total about 320 KB; no remote texture service is used. Prompts and provenance are kept in MATERIAL_PROMPTS.md and ASSETS.md.

Caveat 400 provides the current light handwritten titles and notes; the existing Caveat 600 and Kalam 400 assets remain self-hosted. Compact author labels, reader controls, and the sewn nameplate use a system typewriter face, while regular application controls keep the existing legible sans-serif. The reader readiness gate waits for visible photos and the active fonts under the same bounded 1.8-second deadline, followed by two paint frames. That avoids revealing a temporary fallback font before the handwritten page has settled.

The current shared renderer differentiates Earth and space pages: Earth photographs use leather-like photo corners and notes sit directly on the album paper; the astronaut's photographs retain visible washi tape, with notes on torn ruled paper. Organic angles, raised paper shadows, and aged surfaces preserve the physical composition. The ten vector sticker kinds retain their saved identity/position/rotation/scale, while unique per-instance SVG masks add woven threads and stitched hems. New designs default to linen tape; all previously saved tape colors/layouts remain supported. The shared renderer keeps editor and reader in sync. Text remains text, grows its paper, and is scrollable within the book; no message or decoration is rasterized into the background.

Night mode dims the table and retains textured blue paper with light ink. Texture/shadow layers are static, and book depth is drawn behind the engine, avoiding per-frame image filters. The previously published backup tag backup-before-major-changes-2026-11-15 preserves the earlier visual design at commit 204ba37.

## Continuous opening with real pages

The former presentation used decorative page captions and a cover photo, then dissolved into different story pages. The cover also stopped eight degrees short of flat, and two differently sized wood backgrounds changed the grain at handoff. The new opening shares AlbumLeaf with the chronological reader: the first page turns on the cover’s backface in desktop mode and the second page stays still; portrait mode reveals the first page behind the cover. One-page desktop albums leave the right side blank, matching the engine. The presentation is aria-hidden and has no focus stops. Empty visible albums bypass the pickup rather than presenting a nonmatching blank book.

The ready engine and physical case are measured once, inside the actual app subtree. Their paper size, spine, and case bounds replace a responsive estimate while the cover is moving. The cover reaches exactly minus 180 degrees; the final 160 ms opacity handoff blends the same content/materials at the same position. A single viewport-sized fixed parchment plane under the reader matches the opening backdrop, independent of the longer document height. The stationary leaf uses the engine’s right-side paper crease in portrait too. Its coordinates account for the case’s one-pixel border.

The real reader remains mounted through completion. Existing readiness, cancellation, focus trapping, body-scroll restoration, reduced-motion, skip, and resize safeguards remain in place. New geometry tests exercise measured spread/portrait targets, invalid or zero-sized boxes, cover padding, fallback bounds, and the orientation boundary. This is an alignment and continuity improvement; it is not a device-independent FPS guarantee.

## Reference-style open album

The supplied open-book image guides materials and placement; its Portuguese labels, photographed people, plant images, and story text are not copied into participant records. All controls remain English. The sewn label derives the companion and astronaut names from the existing people model. Page headers identify the author and **EARTH** or **IN SPACE**, rather than claiming a specific orbital location. Shared `AlbumNameplate` and `AlbumLeaf` renderers keep the moving presentation and live reader visually aligned; the presentation has no interactive controls or focus stops.

The wider 560:660 page proportion gives photos more room and positions replies within their own pages. Corner arrows and a folded-corner cue replace the external navigation row. A screen-reader live announcement retains the current page range, and the collapsed **Page details** disclosure preserves the complete delivery history. Keyboard-driven turns focus the newly visible paper without scrolling the document. Input guards check the engine's actual state, and reply/navigation controls remain inactive throughout a turn, including temporary page-engine clones. Hover curling is disabled so the corner arrow stays under the pointer.

`getReaderLayout` supplies one width/height budget to the reader and opening estimate. It allows the book to expand on large screens, reserves space for the top controls and bottom creation action, and lowers the minimum page width on very narrow screens. Layout uses the body's actual available width when a stable scrollbar gutter makes the root's reported client width wider than the usable content. Longer notes use a denser arrangement before falling back to the existing native text scrolling. These changes preserve saved layouts, photo angles, tape colors, sticker coordinates, and all delivery/reply semantics; they add no new data schema or raster assets.

## Paper turns and book depth

OpenPageFlip 0.4.2 marks an unpaired final page as hard even when `cover` is false. It also uses hard drawing for a neighboring page during that turn, producing the inconsistent rigid movement in odd-length albums. Contribution leaves explicitly use soft density. A bounded correction in `scripts/patch-openpageflip.mjs` makes positional hardness conditional on actual covers. It preserves pagination and physical cover behavior without adding a phantom blank contribution.

The core dependency is pinned to 0.4.2. Installation, development, builds, and tests apply the correction idempotently; the script rejects an unexpected version, entry point, or source branch instead of silently patching an unknown release. Regression checks exercise the installed engine's actual pagination for odd and even books in both orientations, with and without covers. Review this correction when upgrading the engine.

Depth comes from static ambient, contact, and directional shadows, a thicker cloth base, offset paper bands, and a shaded binding. Closed shelf books and the flying cover share visible fore-edges. The live reading surface remains flat so pointer coordinates, text scrolling, and the measured opening handoff stay aligned. Night mode uses the same layers with blue-toned shadows and paper edges. No extra image assets or per-frame filters are required.

The earlier stronger-volume revision used a continuous striped page block with cover padding of 16/18/44 px and 10/10/34 px. Its broad horizontal base did not read as a well-bound book. The CSS 3D revision below replaces that construction.

## CSS 3D book construction

`BookVolume` separates the left and right paper groups. Each group contains individual sheet planes and rotated bottom/outer faces under its own perspective, with a narrow spine gap. The paper balance follows the current spread without modifying contribution counts. A slim cloth board and restrained contact/cast shadows complete the physical shell. The same component is used in the opening presentation; decorative sheets are hidden from assistive technology and cannot receive pointer input.

The live folding engine remains aligned in two dimensions. Its pointer mapping uses bounding-box scaling, not an inverse perspective transform, so tilting that interactive surface would make dragging inaccurate. CSS 3D stays on the decorative geometry beneath it. Desktop cover padding is 16/18/30 px, mobile padding is 10/10/24 px, and the shared desktop height budget is 194 px around the paper. The nameplate is raised slightly so its ribbon does not overlap author labels on short pages.

Turn.js was evaluated as requested. Its documented [elevation option](https://www.turnjs.com/docs/Option%3A_elevation) controls elevation during a transition; the [official implementation](https://github.com/blasten/turn.js) is a jQuery plugin. A convincing static paper block still needs its own geometry, and replacing the functioning fold engine would require separate ownership of its imperatively generated DOM. CSS 3D directly addresses the physical construction while keeping the existing reply controls, native text scrolling, and soft-page behavior.

## Rustic home bookshelf

The home screen replaces the welcome artwork, photo-card grid, and teaser panels with a framed wooden cabinet. Upright cloth spines reveal their front covers through CSS 3D rotation and forward movement. The shared `ShelfCoverContents` supplies the sewn label, photo, four corner mounts, and original sprout emblem to both the shelf and the opening presentation. Pickup measures the front cover's current projected rectangle, preserving its position even if activated during a preview.

Books sit close together with a fixed 7px gap (5px on narrow shelves). Their spines use 85% of the shared width calculation, capped at 132px for a slimmer profile. Single-book rows use the same 15% reduction. Fixed gaps stay narrow, and the remaining room sits at the row end. Desktop capacity comes from available width rather than a six-book cap, so the seven example albums fit together when there is room. A hidden baseline-size probe determines capacity independently of the rendered spine widths. During a preview, the spines narrow together to make room for the active cover; the row's registered length property and numeric slot widths animate with the same timing. This prevents extra-wide gaps without clipping the last cover or regrouping books when one is hovered. Pointer and keyboard input select one active preview. A touch activation first previews, then opens. Narrow shelves use up to two books per row with capped spine typography. Reduced-motion styles remove the preview transitions. Paper navigation is shared across the ordinary workspace screens; the reader remains immersive.

Add album is a persistent action with a 1–70 character title, an existing or new companion, and an optional locally re-encoded cover photo. `AppData.customAlbums` and `customPeople` are optional within the existing version-one snapshot, so legacy data remains valid. Added albums and people are each limited to 48. A bundled companion's cover is the default; new people use a neutral keepsake photograph until a cover is selected. `getAlbums` and `getPeople` resolve seeded and added records. Contribution, draft, and check-in validation use the resolved participants, preserving participant and exact-album reply boundaries for custom IDs. Album creation saves a new person and album atomically without creating a contribution or reply. Profiles remain demonstration controls rather than authenticated accounts.

## Workspace continuity

The paper sidebar originally depended on the home-only class, causing Replies to restore the older palette, smaller astronaut name, navigation spacing, and footer brand. `scrapbook-shell` now supplies one shared layout to every non-reader view. Replies reuses the cabinet and header materials with parchment reply cards. Read and unread delivered replies remain in the list, and opening one still jumps to its exact contribution. The existing album-creation action is available in the Replies header as well.

Navigation resets scroll after the destination has rendered, then focuses its heading without moving the viewport. Modal focus restoration also prevents scrolling, so closing Settings cannot pull the next screen down to its footer. Tablet rails, phone bottom navigation, and the immersive reader remain distinct layouts.

## New stories and a growing circle

Gui's six-page school rocket story centers on a ten-year-old asking his father for engineering help, keeping a test notebook, sharing an imperfect attempt, and celebrating their joint team. The fictional project uses simple paper models and teacher-approved tests. Rosa's four pages preserve a bread recipe and family language; Theo's four pages continue an unfinished song. Each response links to a real preceding authored page, and the seed builder derives answered states from those links. Generated photographs illustrate fictional memories; provenance and prompts are recorded in ASSETS.md.

A one-time `demoStoriesVersion` marker adds these chapters to older validated snapshots. It preserves existing records and remaps colliding new seed IDs instead of overwriting a user's page. Once marked, reloading never reinstates removed example pages. Invalid snapshots remain untouched under the existing recovery behavior.

Alex manages the shared circle through Add album. The form can retain an existing companion or add a 1–60 character name; it rejects a duplicate circle name and supports existing newly added companions. Cover uploads reuse the contribution photo pipeline: JPEG/PNG/WebP up to 10 MB, canvas re-encoding to JPEG, bounded dimensions/payload, source metadata omitted. Preview, replacement, removal, and pending/error states are explicit. New person, album, and cover enter one local snapshot; browser quota warnings still apply. No contact information, invitation, or remote image URL is needed. Dynamic participants are passed through the reader, opening, labels, and settings. This remains local demonstration data, with no real sharing or secure accounts.

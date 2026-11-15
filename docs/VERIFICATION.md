# Verification record

Initial prototype and book-reader revision reviewed November 14, 2026 (America/Sao_Paulo). This is a functional prototype review, not clinical validation or a full accessibility audit. The sections below separate the initial results, completed reader checks, and remaining limits.

## Initial prototype: automated results

- TypeScript strict checking passes.
- 16 semantic tests pass: interrupted transport, reconnection, delivery deadline, valid manual replies and notifications, UTC dates and weeks, support cues, complete persistence roundtrips, malformed records, duplicate IDs, and unsafe image URLs.
- Next.js production static export completes successfully.

## Initial prototype: browser results

- Open an album and verify pages appear oldest first with full calendar dates and their delivery states.
- Write a draft, reload, reopen the editor, and recover the same title and words.
- Enter a synthetic crisis cue: immediate support appears and publishing remains available. Replace the cue before continuing the test.
- Pause the link, publish, and observe Recorded. Resume, allow the simulated deadline to elapse, and see Delivered from the other participant's perspective.
- Write and deliver a real demo-profile reply; the original becomes Answered and its author receives the reply in the inbox. Opening it clears its unread indicator.
- Save the three check-in answers and optional note; revisit and see the same selected answers. No check-in content appears in the shared album.
- Attach a 720px JPEG: canvas produces a JPEG payload of approximately 84 KB. Remove it and verify the upload control returns.
- Test mobile at 390 × 844: album/story/check-in navigation fits, help remains reachable, and the page has no horizontal overflow. Review the navy night palette.
- In a modal, Shift+Tab wraps from the close button to the last control; Escape closes it and focus returns to the opener.
- Edit from a second browser tab: the first tab shows a recovery notice and pauses writes, preserving the newer saved data.
- No application warnings or errors were observed in the browser console during these flows.

## Book-reader revision: completed browser checks

- TypeScript strict checking, all 16 semantic model/persistence tests, and the production static export passed against the revised source and page-turn dependencies.
- Desktop navigation advanced through spreads 1–2, 3–4, and 5–6. Previous-page navigation and arrow-key navigation returned through the book correctly.
- Opening an incoming reply selected its correct contribution on spread 3–4.
- A one-page album disabled both navigation directions. In a three-page album, next-page navigation reached page 3 of 3 and disabled the forward control.
- At a 390 × 844 viewport, the reader displayed one portrait page at a time without horizontal overflow. This was browser viewport testing, not a test on a physical touchscreen.
- Dragging the lower-right page corner across the spine advanced the page. A partial drag returned the sheet to its original position.
- Resizing the viewport during a turn initially left the navigation buttons locked. The turning-state reset was added for initialization, content updates, and orientation changes; the recovery behavior was retested successfully.
- Publishing a new, long contribution opened its exact new page (page 2 of 2 in the test album) and stayed there after the delivery-status update. The contribution retained approximately 4,800 characters. Focusing its native text region and pressing Ctrl+End reached scrollTop 2,020 with clientHeight 308 and scrollHeight 2,328, confirming access to the end of the text. Scrolling occurs inside the paper, not a separate full-text modal.

## Book-reader revision: pending checks and limits

- The reduced-motion media query, effect, and engine instant-navigation path were reviewed in source. Changing the OS preference at runtime was not exercised.
- Touch gestures on a physical mobile device were not tested. Pointer dragging and a mobile browser viewport are not substitutes for that check.
- A full assistive-technology, contrast, and clinical review remains outside this functional browser verification.

## Contrast and motion

In the initial prototype, core text pairs were checked against WCAG AA's 4.5:1 normal-text threshold, including muted copy on cream, sage surfaces, amber support panels, and navy mode. Borders, photographs, and decorative orbit lines are not text. CSS and reader logic implement reduced-motion behavior; the revision's runtime OS preference was not exercised. These checks do not substitute for an independent assistive-technology or full WCAG audit. [W3C contrast requirement](https://www.w3.org/WAI/WCAG20/Understanding/contrast-minimum.html).

## Remaining operational boundary

Shelf-opening animation was checked in the browser: the selected cover is hidden in place while a matching cover lifts with a matrix3d transform, moves forward, and rotates on its spine. At the opening phase the backdrop is opaque and the hardcover has a nontrivial 3D rotation. Normal completion opens the correct immersive album, restores body scrolling, removes inert/overlay state, and focuses the reader heading. Keyboard activation, Skip animation, Escape, repeated opening, double click (one overlay), mobile portrait opening, night mode, and resize during animation all completed without a stuck overlay. Resize restored overflow and scrollbar-gutter styles. Mobile widths of 390px and 414px showed no horizontal overflow. No browser warnings/errors were observed. TypeScript and the 16 existing semantic/persistence tests passed; these do not constitute automated visual-animation coverage. Reduced-motion paths were reviewed in source, without changing the OS preference during this check.

Immersive-reader revision was checked on desktop and at 390px: opening an album removes the sidebar/navigation, mobile identity, and global footer from the DOM. The workspace begins at x=0 and has no reserved bottom-navigation padding or horizontal overflow. Forward page turning works. Add a page opens the composer with normal navigation; Back to the album removes it again; All albums restores the shelf and navigation. The light sidebar computes to RGB 59/77/96 with cream text RGB 248/238/220, distinct from the unchanged cream body. Cream/sidebar text contrast is 7.55:1 and cream/active-selection contrast is 4.75:1; a separate selection marker and light keyboard focus outline are provided.

Complementary palette revision: browser-computed light background remained RGB 242/231/212. The four book covers match their new ochre/olive/clay/slate tokens, with cream names; calculated cover-name contrast is at least 4.58:1. The chronological reader still opens, its bottom creation action remains unique, and a 390px viewport has no horizontal overflow. Night mode uses RGB 29/43/60 with light page text RGB 240/233/220. No browser warnings/errors were observed during these checks.

The cream/bookshelf refinement was checked in the browser: the body background computes to RGB 242/231/212; the desktop shelf has four columns and the 390px viewport has two columns with no horizontal overflow. Relationship subtitle elements are absent. An album still opens its chronological book and keeps one bottom Add a page action. Night mode applies the darker shelf palette. Core normal-text contrast pairs for the revised cream palette were calculated at 4.81:1 or higher.

Layout refinement was checked in the browser on desktop and at 390 × 844: the global header and visible book heading are removed, the astronaut name remains in the upper-left (including after switching to Lily), exactly one Add a page control follows the reader, and that control opens the editor. Footer Settings retains profile selection, simulated connection controls, and the working night-mode switch. No horizontal overflow was observed at the mobile width.

All delivery tests use the clearly labeled simulator. They do not verify communication between devices, secure accounts, encryption, backups, or real spacecraft transport. The support heuristic has false positives and false negatives. See [DECISIONS.md](DECISIONS.md) for the production work required.

## Scrapbook editor revision

- TypeScript and all 21 model/persistence tests passed. New tests cover legacy snapshots, page/draft design roundtrips, malformed metadata, and independent published designs.
- In the browser, a mouse drag added a sticker from the tray at the drop position, and dragging an existing sticker changed its normalized position. Rotation, resize, tap/click addition, Enter addition, arrow-key movement, and Delete were exercised; deletion restored tray focus.
- A compressed local example photo appeared with navy electrical tape. Postcard selection changed the live composition. After a reload, the title, text, photo, layout, and stickers remained in the draft. Publishing opened the new chronological page with all five saved stickers and its photo/tape. Delivery advanced independently of decoration.
- A 390 × 844 viewport had no horizontal page overflow. The mobile tray remained available above the preview; dragging from it onto the paper added a sticker. The paper expanded to preserve the complete note. This is viewport/pointer verification, not a physical touchscreen test.
- A crisis cue displayed support next to the text field while Publish remained enabled. Removing the cue removed the panel. No browser warnings/errors were observed in these flows.
- Physical-device touch, runtime OS reduced-motion changes, a full assistive-technology audit, and clinical review remain unverified.

## Opening handoff performance revision

- TypeScript and all 25 tests passed. Four new isolated readiness tests cover loading/decoding (including rejection), the image deadline, cancellation and late callbacks, and empty spreads waiting for two paint frames.
- In a desktop browser sample approximately 1.1 seconds after activating a shelf book, the opening overlay was still present with an opaque backdrop, while the real reader already reported ready at its final 880 px width. Focus remained on Skip animation and the application stayed inert. After handoff, the ready reader remained available, focus moved to its heading, inert was removed, and body scrolling was restored.
- Page navigation advanced to the next spread. Repeated opening of different albums, keyboard activation, Escape, and the Skip animation button completed without a stuck overlay. A 390 × 844 viewport also had the reader ready while the opening was still present, with no horizontal overflow. Resizing to 414 px during opening safely revealed the correct ready reader and restored scrolling. No browser warnings/errors were observed.
- These are functional timing samples and source-level checks of the mount handoff, not an FPS benchmark or a promise for every device. CPU throttling, physical touch devices, and runtime OS reduced-motion changes were not exercised.

## Physical scrapbook revision

- TypeScript and all 27 semantic tests passed, including two new readiness tests for fonts loading together with photos, failure, timeout, late resolution, and cancellation.
- In the browser, the new self-hosted wood/paper textures, cloth cover stitching, visible leaf stacks, Polaroid photo frames, washi-taped notes, handwritten text, and fabric sticker weave/stitched hems rendered on existing saved pages. Different layouts and saved tape colors retained their data. Page turning still advanced through the book.
- At about 1.1 seconds during opening, the actual reader reported ready while the opening overlay was still visible and the handwriting fonts reported loaded. The handoff completed without a stuck overlay.
- At 390 × 844, the book switched to one portrait page, with document scrollWidth 375 and innerWidth 390 (the scrollbar gutter accounts for the difference). Both light and night materials were reviewed. Focusing the paper text and pressing Ctrl+End reached scrollTop 136, matching scrollHeight−clientHeight 136, and the complete end of the note was visible.
- The editor retained its draft and both new fabric stickers, and arrow-key positioning changed the selected sticker’s saved coordinates. No browser warnings/errors were observed during these flows.
- Representative flat color pairs were calculated: ink on paper 7.84:1, metadata on paper 4.98:1, ink on note 9.32:1, night ink on note 7.07:1, and wood-scene controls 7.28:1. Photographic texture variation and a full independent accessibility audit remain separate from these token checks. Physical touch, CPU-throttled FPS, and runtime OS reduced-motion testing were not performed.

The pickup geometry was aligned to the deeper cover: a desktop opening targeted y = 107 px while the mounted engine paper began at about 108 px. At 686 px viewport width, both the reader and the flying book used portrait mode, and the decorative left paper stayed hidden. Resizing during that opening completed into the correct album.

## Real-page opening continuity revision

- TypeScript and all 33 tests passed. Six new geometry tests cover exact measured spread/portrait targets, missing/invalid/zero DOM boxes, physical cover padding, responsive fallback centering, and the available-width orientation boundary.
- During desktop opening, the stationary page’s title and story matched the actual second reader page. The turning backface carried the actual first page. After accounting for the case border, a late-animation night-mode sample measured zero horizontal difference and about 0.08 px vertical difference between the stationary and real page; both used the same ink. The reader was already ready.
- The opening backdrop and reader’s fixed wood plane had identical image definitions and 720 px heights in the sampled desktop viewport. This removes the previous different crop caused by sizing the reader texture against the full scrollable document.
- At 390 × 844, the opening displayed the first real page in portrait mode, matching its eventual title; scrollWidth 375 remained below innerWidth 390. Escape and Skip animation completed into the correct album, restored body overflow, removed inert, and focused its heading. Resizing to 414 px during a night-mode opening also completed correctly.
- In an isolated fresh browser origin, the seeded one-page Maya album showed that exact page on the turning backface, kept the stationary right side blank, and finished at Page 1 of 1 with Next disabled. Reader page navigation still worked after the shared-leaf refactor. No browser warnings/errors were observed.
- Empty-album and reduced-motion bypasses were reviewed in source. Physical-device touch, CPU-throttled FPS measurements, and changing OS reduced-motion at runtime were not exercised.

## Reference-style open-album revision

- TypeScript strict checking and all 35 tests passed against the final reader layout, focus handling, turn-state guards, and scrollbar-gutter sizing changes. The geometry suite now covers the larger page proportion, viewport-height budget, and narrow-screen minimum width.
- At 1536 × 1024, the open case measured approximately 1489 × 897 px at x = 16, y = 46; the bottom actions ended at y = 995. The book and creation action fit the viewport. Document scrollWidth was 1521 px, below innerWidth 1536 px.
- At 1280 × 720, the existing longer pancake contribution displayed its complete note after the denser arrangement adjustment. The sewn pair label, uppercase author/location labels, thin handwriting and underlines, Earth photo corners, ruled space notes, in-page Reply, page numbers, and corner navigation rendered over the parchment scene.
- Keyboard navigation advanced through spreads 1–2, 3–4, and 5–6 and returned to 3–4. Focus moved to the newly visible paper after each completed turn. Turn controls remained guarded while the page engine was moving. Reply on Lily's fourth page opened the correct continuation in the composer and preserved the existing draft.
- The Page details disclosure expanded to show Recorded, Sent, Delivered, and Answered dates for the current pages, then collapsed. One Add a page action remained below the book. The composer retained its text and existing two stickers; adding, moving with an arrow key, and deleting a temporary sticker returned focus to the tray.
- Portrait layouts at 390 × 844 and 320 × 844 had no horizontal overflow. At 320 px, the page measured 259 px wide and stayed inside its 281 px case after using the body's available width to account for the scrollbar gutter. The bottom Add a page action and Page details did not overlap. At 390 px, portrait navigation advanced to page 2 and focused its paper.
- Light and night materials were reviewed. During opening samples at 390 px and 1536 px, the real reader reported ready while the presentation was still visible, and both scenes used the same pair label. No application warnings or errors were observed in the local browser console.
- These are local functional and viewport checks, not a full contrast or assistive-technology audit. Physical-device touch, CPU-throttled animation measurements, and runtime OS reduced-motion changes remain untested. Production-build and deployment validation are separate release steps.

## Soft final leaves and book depth

- A fresh `npm ci` applied the bounded dependency correction. Running the test hook again reported it already applied. TypeScript and all 39 tests passed. Four added regressions exercise actual installed pagination for one through seven pages in both orientations, preserve cover behavior and page counts, and check repeatability and rejection of unexpected patch targets.
- Before the correction, the three-page Sam album's last page rendered with `opf-page--hard`. Afterward, the same final page rendered with `opf-page--soft`. A timed forward-turn sample showed a polygon-clipped, rotated paper fold and zero hard page elements. The reverse turn also used soft polygon folds and returned focus to the first paper.
- At 390 × 844, navigation reached the final third page and returned to the second page. The sampled last-page turn used soft folds, and the final page received focus. Document scrollWidth was 375 px, below innerWidth 390 px.
- At 320 × 844, shelf books and the open album had document scrollWidth 305 px. The 259 px paper remained inside the 281 px cover. Layered edges, lower cloth cover, all-around shadows, and bottom controls remained contained. Night mode retained the depth layers and readable paper controls.
- During a night-mode opening, the real reader was ready while the presentation remained visible. Both cases had identical computed ambient, contact, and cast-shadow layers. No local browser warnings or errors were observed.
- These are functional and visual browser checks, not an FPS benchmark, a physical-touch test, or a full accessibility audit. Runtime OS reduced-motion testing remains separate; its existing instant-navigation path is unchanged.

## Stronger volume on the open album

- TypeScript checking and all 39 tests passed, with the eight geometry tests updated for the deeper cover, surrounding shadow space, and height budget.
- At 1280 × 720, the case began at y = 64 and ended near y = 628, with its bottom action ending near y = 708. The live paper began at y = 81; its lower edge sat 45 px above the case's lower edge, exposing the layered paper block. Forward and reverse page navigation retained soft leaves and moved focus correctly.
- At 1536 × 1024, the case measured about 1406 × 868 px with approximately 58 px of side space. The bottom action ended near y = 1012; document scrollWidth 1521 remained below innerWidth 1536. The surrounding shadow and lower cloth lip were visually reviewed.
- At 320 × 844, the 243 px paper remained within a 265 px case at x = 20, y = 62. The bottom action and Page details remained separate, and document scrollWidth was 305 px. Both day and night depth layers were reviewed.
- A timed night-mode opening showed the real reader ready while the presentation remained visible. Both ground-shadow elements had identical computed shadow layers, and the moving case was already within about one pixel of the real case. No local browser warnings or errors were observed.
- These checks do not measure frame rate or replace physical-device and full accessibility testing.

## CSS 3D book construction

- TypeScript and all 39 tests passed. Geometry tests cover the slimmer 30/24 px bottom cover padding and 194 px desktop height budget.
- The live reader contains twelve stable decorative sheet planes, six per half, with computed `preserve-3d`, a 1600 px perspective, and rotated side/bottom faces. At 1280 × 720, the volume box matched the live paper exactly. The right fore-edge projected about 6.2 px outward, and its deepest sheet extended about 16.1 px below the reading surface. The previous continuous striped layer is absent.
- Advancing from spread 1–2 to 3–4 preserved the twelve planes and changed the left/right depth from 11/17 px to 13/15 px. Keyboard navigation focused the new paper. Dragging the upper-right paper corner across the spine also reached spread 3–4; reverse navigation returned to the first spread. No hard contribution leaves were observed.
- Reply on Lily's fourth page opened the correct continuation and preserved the existing draft text and two decorations. No new page was published during this check.
- At 390 × 844, the single visible volume group matched the 313 px paper. Portrait navigation reached page 2 and focused its text region. At 320 × 844, the final page of the three-page Sam book remained soft, and document scrollWidth was 305 px. Night materials and the raised nameplate were visually reviewed.
- During a timed night opening, the real reader was ready while the presentation remained visible. Both volume components used the same initial depth values; their rectangles differed by less than 0.1 px vertically in the sampled late animation.
- At 1536 × 1024, the case fit within its 40 px side gutters, the volume matched the live paper, and the bottom action ended near y = 1009. Document scrollWidth was 1521 px. The wider projection retained a visible fine outer face. No local browser warnings or errors were observed.
- These are functional and visual viewport checks, not a frame-rate benchmark, a physical-touch test, or a full accessibility audit. Runtime OS reduced-motion testing remains separate; the new decorative transitions respect its media query.

## Rustic bookshelf home

- TypeScript and all 44 tests passed. Five new model/storage regressions cover album creation bounds, participant/reply rules, full custom-album/page/draft roundtrips, legacy snapshots, and rejection of malformed cover metadata.
- At 1280 × 720, the cabinet displayed the English header and upright spines. Hovering the first book revealed its textured front cover while pushing neighboring spines aside. Its revealed cover ended near x = 583 and the next spine began near x = 594. Document scrollWidth 1265 stayed below innerWidth 1280, and physical-book dragging did not select text.
- Clicking the revealed cover photo opened the correct album. During the opening, the shared label read Sam & Alex, all four photo corners were present, and the real reader was already ready while the presentation remained visible.
- With the pointer still over Sam, keyboard navigation focused Maya and produced exactly one active preview. Enter opened Maya's album. The previous reader's soft-page behavior and bottom creation action remained available.
- A new Little traditions album was created locally with Maya, survived a reload, accepted its first contribution, and reopened after another reload. The contribution retained its text and simulated transport state. Switching to Maya showed only her seeded and added albums; no unrelated books appeared.
- At 320 × 844, five albums formed three compartments. A focused front cover stayed inside the 285 px cabinet, and document scrollWidth 305 stayed below innerWidth 320. Day and night materials were reviewed. No local browser warnings or errors were observed.
- Physical touchscreen activation, runtime OS reduced-motion changes, a full accessibility audit, and frame-rate measurement remain untested. The touch preview branch and reduced-motion styles were reviewed in source.

## Replies workspace continuity

- TypeScript checking passed. This presentation change adds no data schema, transport, or notification rules.
- Before and after navigating from the bookshelf to Replies at 1280 × 720, the sidebar rectangle/background, astronaut name rectangle/font, navigation button positions, and workspace background were identical. The wood frame retained x = 258, y = 34, width = 977 px. Taller reply content flows naturally and can place the footer lower in the document.
- Read replies remained visible. Opening the response to Our little moon garden selected the correct contribution on spread 3–4 without a shelf-opening overlay, preserving the existing direct-reply behavior. The reader retained its immersive shell.
- The private check-in retained all three questions and the same paper navigation. Night mode was reviewed with both populated and empty Replies states.
- At 320 × 844, two reply cards wrapped without horizontal overflow: document scrollWidth was 305 px. Switching profiles through Settings and then navigating to Replies ended at scrollY = 0, frame y = 63.6, with focus on the Replies heading. No browser warnings or errors were observed.
- These functional viewport checks do not replace physical-device testing or a full accessibility audit. No new unit tests were added for the visual styling.

## New stories, people, and cover photos — 15 November 2026

- All 51 automated tests passed, including custom people, uploaded cover validation, exact-album participant/reply boundaries, legacy snapshot migration, one-time story installation, and collision-safe seed IDs. TypeScript passed.
- Existing local browser data retained its previous custom album, pages, and draft; Gui (6 pages), Rosa (4), and Theo (4) appeared without resetting storage. Opened Gui's real first spread and exercised the next-page control.
- Through the UI, created a fictional Milo album with a chosen JPEG cover. The preview appeared, submission added the book, and a reload retained its cover/person/album. Switched to Milo in Settings and published a first page; the reader displayed Milo in its author, accessible region, and sewn pair label.
- At 320 × 844, the new-person form fit without horizontal overflow (dialog client and scroll widths both 273 px). Reviewed its night palette, labels, photo control, preview, and submit control. Restored the normal viewport and day theme afterward.
- No warnings or errors were captured from the local tab. Real-device touch, OS reduced-motion, exhaustive image-decoder failures, and a full accessibility audit remain outside this verification.

## Full-width bookshelf distribution — 15 November 2026

- Removed the desktop six-book cap and permanent preview padding. Rows now distribute their books from edge to edge while retaining capacity for one expanded cover.
- At a 1280px desktop viewport with existing custom books, the first row held eight books; both outer gaps measured 0px across an 895px row. The last book's keyboard preview remained inside the row (cover right 1190px, row right 1194px).
- At 320 × 844, the two-book arrangement and last-book preview stayed within the cabinet (cover right 266px, row right 271px). Document width was 305px within a 320px viewport. No browser warnings or errors were captured; the temporary viewport was reset.
- No data model or storage changes. Existing automated model tests were not rerun for this layout-only change. Production build includes TypeScript validation; real-device touch and exhaustive animation timing remain separate checks.

## Closely packed bookshelf spines — 15 November 2026

- Replaced distributed empty gaps with fixed 7px desktop and 5px narrow-screen spacing. Rendered spine widths share the row's available width and narrow for the expanded cover, with a 155px cap and baseline thickness for a single book. Capacity measures an independent probe, so previews do not regroup rows.
- Local desktop review with eight books in the first row measured seven gaps of 7px and zero unused space at either end. Spines measured 106px closed and 79px during the last book's preview; the cover stayed inside the row with no horizontal overflow or capacity change.
- At 320 × 844, the last cover in a two-book row remained within its compartment with no document overflow. Spine typography was capped at 23px. Reset the viewport, opened a book through its full cover transition, and confirmed the reader appeared. No browser warnings or errors were captured.
- TypeScript passed. Model/storage behavior is unchanged; model tests were not rerun for this presentation change. Physical touch, exhaustive motion timing, and older browsers without registered custom-property animation remain outside this verification.

## Lighter bookshelf hover — 15 November 2026

- Removed the animated inherited spine-width property and flex-basis transitions. Hover keeps closed spine widths, slots, text sizes, and row capacity fixed. Only the selected volume and front-cover transforms animate, over 500ms; the cover floats in front of neighboring books and its horizontal offset is clamped to the compartment.
- Removed the growing invisible hit area. The actual active cover accepts pointer clicks through its existing button. An 80ms pointer-exit grace period is cancelled on entry, input-mode changes, and unmount. Pointer movement only changes mode state when switching input types.
- In the local desktop browser, all eight first-row book rectangles and text sizes matched exactly before and after the final book's preview. Row and slot transition durations were 0s, and the volume transition property was transform. The last cover stayed inside the row with no document overflow.
- At 320 × 844, the second cover stayed within the two-book row with no overflow. Restored the normal viewport, clicked the actual revealed cover, and confirmed its chronological reader opened. No browser warnings or errors were captured. TypeScript passed.
- No model or storage changes. Verification checked preview geometry and click behavior; it did not collect frame-rate benchmarks or an exhaustive physical mouse/touch sweep. Existing reduced-motion rules suppress the remaining transforms.

## Support a Crewmate — 15 November 2026

- All 61 automated tests, TypeScript checking, and the production build passed. The build generated offline copy `251e84165f71d8e8de01` with 97 version-matched app files.
- Manual browser checks covered emergency escalation remaining latched after **Feeling better** and **Back**, respect for refusal, and immediate routing to medical support when **Feeling worse** was selected. Improvement was not presented as a diagnosis or medical clearance.
- Explicitly saved a reviewed private summary, reloaded it, and checked filtering by the active demonstration crew profile. Reviewed the support-plan draft's empty-content guard, its authorized shared projection, and configurable onboard medical instructions. These records remain separate from family albums and are not sent automatically.
- At a 320px viewport, the support interface had no horizontal overflow. Night mode was visually reviewed. These checks are not a complete accessibility audit or a physical-device test.
- Tested the production static export on a fresh local origin at port 3003: **Prepare offline support** saved a copy, **Reload to activate offline copy** activated its worker, and the browser displayed its verified readiness indicator. Stopped the owned preview server and confirmed a normal server request failed; the same tab still reloaded through its cached app shell. Completed the emotional-overload route offline, opened **Why this step?**, and reached the finish screen after **Feeling better**.
- Separate in-memory worker smoke checks verified complete-cache readiness, asset-integrity metadata, offline root navigation, online authentication-response passthrough, exclusion of private API routes, and readiness becoming false after a required cached script was removed. Worker syntax checks and generator idempotence also passed. These checks supplement the browser test; they are not a hosted-platform authentication test.
- Offline support requires a completed preparation on that browser. External source documents and album photographs are not guaranteed offline. Clearing site data removes the cached app and locally stored records. A prepared offline shell cannot verify current server authentication or revoked access.
- Content remains demonstrative and pending clinical review. No real-device, clinical, or mission-operations validation was performed; secure operational authentication, clinical efficacy, and NASA approval are not provided by this prototype. Demonstration profile filtering does not prevent someone with access to the same browser from inspecting its local data.

## Revised Sam, Maya, June, and Lily albums — 15 November 2026

- All 69 automated tests and TypeScript checking passed. The new examples contain 21 pages (Sam 6, Maya 4, June 5, Lily 6), with 35 pages across the seven seeded albums. The authored exchanges have chronological dates and explicit alternating reply links.
- Focused migration tests cover idempotency, exact original-content signatures, edited or deleted original chapters, user-page ID collisions and remapped replies, drafts/read markers/custom albums, historical chronology when a June anchor is missing, and truthful Answered results from actual introduced replies even offline. Existing answered history remains unchanged.
- All eight new generated photographs are distinct, self-hosted 720 × 720 JPEGs, totaling 635,491 bytes. Their exact paths are bounded by the photo validator; old approved images remain supported. Per-scene alternative text is present in the shared page renderer. Prompts and illustrative provenance are documented separately.
- Local browser review used an existing saved snapshot with nine albums, additional personal pages, and a Lily draft. The revised covers and stories appeared, while the two custom albums, additional pages, and draft indicator remained. This complements the preservation tests without clearing browser data.
- Reviewed all four books and their new photo pages. Sam's last spread and June's odd final page were reachable through the normal page controls; the final June page had no forward control after the turn completed. Both Maya and Lily photo assets were confirmed loaded through the rendered image elements. No browser warnings or errors were recorded.
- At 320 × 844, Lily used the single-page layout, the book measured 265px wide, and document scrollWidth was 305px against a 320px viewport. The temporary viewport override was restored. No layout or page-turn timing changes were made for this content revision.

## Album-opening performance — 15 November 2026

- All 73 tests passed, including four new tests for intent deduplication, bounded preparation/eviction, failed-photo cleanup/retry, font coalescing, and missing browser APIs. TypeScript checking and the production static build passed.
- Compared local production builds using a temporary requestAnimationFrame/DOM observer on the same browser origin and viewport. The observer was added only to ignored build output and removed before release packaging; it is not application telemetry.
- In a baseline Sam sample, frame intervals of 79.1ms and 62.4ms occurred at approximately 906ms and 1002ms, during the main cover fold. The baseline reader mounted around 807–836ms. Initial memo/media optimizations reduced repeated work but retained a visible loading overlap, so the engine's preparation was moved after the busy reveal.
- In two final Sam samples, the reader mounted around 1681–1723ms and became ready around 1792–1847ms. Neither sample recorded an interval above 32ms between 800ms and 1600ms. Total observed completion stayed approximately 2.20–2.23 seconds, including the observer's extra 100ms. Initial/settling frames still exceeded 32ms; this is a small diagnostic sample on one device, not a guarantee of zero jank or a general FPS benchmark.
- Reviewed the full opening, repeated opening, and subsequent page turn. Skip animation and Escape both opened the real reader. At 390 × 844, normal opening reached the portrait book; book width was 335px and document scrollWidth 375px. The temporary viewport was reset. No browser warnings or errors were captured.
- Animation durations, opaque folding pages, depth/shadows, reader readiness fallback, and contribution/storage semantics remain intact. The fixed clipping window replaces the animated base clip-path; final reader geometry is unchanged.

## Alex's space-meal photograph — 15 November 2026

- Added one original generated, self-hosted JPEG (720 × 720, 54,618 bytes) to Alex's first reply in Sam's album, “The chef is requesting cinnamon”. The existing Polaroid frame and tape render the photo; the image has a specific accessible description.
- All 75 automated tests and the production build passed. Regression coverage verifies that previously saved, untouched demo replies receive the photo once while personalized/deleted replies, delivery history, drafts, reflections, and read markers remain intact.
- Opened Sam's first spread in the local production preview. The new image loaded at its full 720px source size and appeared on Alex's right-hand page. Reviewed the complete spread; the story text, cover-opening sequence, and album layout remain unchanged.

# Still Here

A quiet place for an astronaut and the people they love to keep sharing ordinary moments when a reply takes time.

Still Here is a **local-first MVP and clearly labeled DEMO**. Its shared albums, people, example memories, connection state, and delivery are a simulation in one browser. It has no authentication, backend, or real sharing between devices. The original repository is [guiabbehusen/nasa-space-apps-2026](https://github.com/guiabbehusen/nasa-space-apps-2026).

## Run locally

The app uses Next.js **16.4.6**, TypeScript, React **19**, and Tailwind CSS **4**. Install Node.js and npm compatible with the pinned dependencies, then run these commands from the repository directory:

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). No API key or environment file is required.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`build` creates the static site in `out/`; `preview` serves that export on port 3000. Stop the development server before previewing on the same port. Use the static preview for a production-build check: this project exports static files and does not use `next start`.

## Explore the demo

The home screen is **My bookshelf**, a rustic wooden cabinet with upright cloth-bound spines. Hover a book or focus it with the keyboard to pull it forward and reveal its embroidered name label, printed photo, and four corner mounts. Books sit close together with narrow gaps. Their slim spines stay in place while the selected cover lifts forward, with its position kept inside the shelf. On a touch device, the first tap previews the cover and the next tap opens it. The astronaut's name sits on the paper navigation panel. The same navigation, background, spacing, and footer continue through Replies, the composer, and the private check-in; the album reader remains immersive. Replies uses the bookshelf's wood frame and parchment materials, with Add album and Still Here in the same header positions.

Opening an album fills the workspace with a physical scrapbook against a warm parchment surface: aged paper, worn edges, a shaded gutter, and visible stacked pages above a cloth cover. Uppercase author/location labels, light handwritten titles, photo frames, washi tape, and fabric stickers carry the album materials into the editor. Existing words, photos, and saved decorations remain intact. Night mode preserves textured blue surfaces and light ink. Use **Shelf** to return.

Choosing a book on the shelf lifts it forward and opens its hardcover over about 1.9 seconds. The opening shows the actual first spread, using the same page renderer and sewn label as the reader. The prepared reader supplies its measured paper/cover bounds, the cover settles fully flat, and a brief 160 ms handoff blends matching pages. Both scenes use one viewport-sized parchment texture plane, so its scale and position stay consistent. The reader still waits for its first layout, photos, and handwriting fonts. **Skip animation** or Escape bypasses the cover motion while preparing the reader. Reduced-motion preference and empty albums go directly to the reading view; a viewport resize safely skips the remaining motion. Direct reply links still open their target page without a shelf animation. These presentation steps do not change delivery or response state.

All contribution pages bend as paper, including the last page of an odd-length album. Only the shelf-opening hardcover remains rigid. A CSS 3D shell gives the open album separate left/right groups of individual paper planes, outer and bottom faces, a recessed spine, and a slim cloth board. The balance of paper changes with the current spread. Contact and cast shadows ground the album on the surface. These decorative layers stay below the aligned reading surface and do not change page counts or turn hit areas.

The bookshelf includes seven authored example albums. Three new stories follow **Gui**, Alex's ten-year-old son, as they prepare a school rocket-olympiad project together; **Rosa**, his grandmother, as they trade bread recipes and family memories; and **Theo**, his old friend, as they finish a song across the distance. Their 14 pages include actual linked responses, dates, tape, stickers, and original illustrative photographs. Gui's project uses teacher-supervised paper models. These examples are written demonstration content; the transport never invents a reply. Existing browser snapshots receive the new chapters once without replacing saved pages, drafts, reflections, or albums.

Use **+ Add album** on the bookshelf to name an album. As Alex, choose an existing companion or **Someone new** and enter their name. Optionally choose a cover photograph; its preview appears before saving, and **Remove photo** restores the default. New people and covers are saved locally together with the empty album. New companions also appear in the demo profile selector so reviewers can write both sides of their story. No invitation is sent. Open the album and choose **Add a page** to start writing. Up to 48 added albums and 48 added people are supported. From a book, **Add a page** opens the composer with the normal navigation restored. **Settings** and **Support** are available in the footer on the other screens; Settings contains the demo profile, connection, and night-mode controls.

1. Open a person's album as a book. The surrounding navigation disappears, leaving **Shelf**, the book, and one bottom **Add a page** action. Each contribution occupies a page in chronological order, with a complete date and delivery state. Use the arrows inside the lower page corners, arrow keys, or a corner drag to turn pages; **Reply** appears within an eligible page. Keyboard navigation moves focus to the newly visible paper. The wide book scales to the available width and height; narrow screens show one page at a time. Reduced-motion mode is implemented to navigate without the page-turn animation. Longer contributions remain inside a focusable region with native scrolling on the paper page; there is no separate full-text modal.
2. Choose **Reply** or **Add a page** to open the scrapbook editor. Write a moment, attach a Polaroid-style photo held by washi tape, and choose Classic, Postcard, or Letter. Drag a sticker from the tray onto the paper, or tap it to add; select it to move, rotate, resize, or remove it. Arrow keys move a focused sticker, Shift moves in larger steps, and Delete removes it. Across/Down sliders provide another way to position stickers. On narrow screens the sticker tray stays above the preview while scrolling. Up to 24 decorations, the layout, tape, photo angle, and writing are saved in the draft and published with the page.
3. Use connection settings to pause simulated delivery. A recorded page stays in this browser until the simulator can advance it. Resume to see **Recorded → Sent → Delivered**. Delivery uses a 12-second simulated deadline; an offline or paused simulator makes no transitions. If the deadline passes during a pause, pending delivery can complete on reconnection. This is not a real network guarantee or a promised arrival time.
4. In connection settings, switch from Alex to another companion, including someone you added. Open the relevant book and manually reply to a delivered page. Switch back after that reply is delivered to see its notification and the original page marked **Answered**. Opening a reply takes you to that contribution in the book. A timer never writes a human reply.
5. Open the weekly check-in. Connection, loneliness, and support are separate labeled 1–5 responses. The current week's check-in can be edited; there is no composite health score, diagnosis, or automatic third-party alert.

The interface keeps explanatory copy brief. Response-time reassurance lives in **How it works**, reached from a discreet footer link outside the immersive reader. Delivery states remain in the book; demo limitations, privacy information, and support remain on the other screens. There are no typing indicators, recipient read receipts, streaks, rankings, or measures that treat message quantity as relationship health. The local notification state only tracks which reply notifications have been opened in this demo.

## Local data and photos

Versioned `localStorage` stores added albums, pages, drafts, check-ins, and reply-notification state. Legacy snapshots without custom albums continue to load unchanged. Use one editing tab at a time: if another tab changes saved data, writes pause in the stale tab and a recovery notice preserves the original saved version. Invalid saved snapshots are left untouched. Drafts are separated by profile and album; check-ins belong to a profile. **Profile switching is a demonstration control, not authentication, security isolation, or encryption. Anyone using this browser can inspect all stored data.** Clearing site data removes the demo's saved content, and no server backup exists. Use fictional content when evaluating it on a shared device.

The photo editor accepts JPEG, PNG, and WebP files up to 10 MB. It uses canvas to produce a JPEG with a longest edge of at most 1,280 pixels and a target size of roughly 350 KB, without copying original EXIF metadata. A photo can be removed before recording the page. Storage overhead and browser quota still apply; the compressed result is stored locally.

## Support behavior

**Support** is available from the footer outside the immersive reader; use **Shelf** to return from a book. Limited English and Portuguese phrase matching also surfaces a nonblocking support panel while typing in the editor or a check-in note. It can miss a crisis or match unrelated text; it does not diagnose risk, monitor anyone, send an alert, or replace human help. Urgent support must use local emergency services or the mission medical team without waiting for an album response. The Brazil resource included in this demo is CVV: [188](tel:+55188?oai_link_source=model_response_hotline), [https://www.cvv.org.br/](https://www.cvv.org.br/?oai_link_source=model_response_hotline). Resources need localization and clinical review before use beyond the demo.

## Verification guide

`npm test` runs semantic model and transport tests with `node:test` through `tsx`. It checks interruption and reconnection, the delivery deadline, manual-reply requirements, reply notifications, author/album validation, UTC dates and week boundaries, and support-language cues. It also checks responsive opening geometry and the installed page-turn engine's soft-page behavior. The pinned engine receives a small, checked correction automatically during install, development, build, and test; see [DECISIONS.md](docs/DECISIONS.md). Run the commands above to validate your checkout; this guide is not a record of checks performed.

For a manual review, follow the album/reply flow above, reload with a saved draft and a check-in, remove an attached photo, and exercise the paused/offline controls. For the book, check first/last boundaries, odd and even page counts, forward/backward turns, a newly added contribution, and opening a reply directly. Check corner dragging, arrow-key navigation, the focusable text region's native scroll, and the **Page details** disclosure. Repeat with keyboard only: verify visible focus, dialog dismissal and return focus, form labels, and access to help. Check a narrow mobile viewport for portrait book pages, editor controls, long messages, and dialogs without horizontal overflow. Verify that support appears while entering a cue and that the editor remains usable. Real-device touch and runtime OS reduced-motion preference testing remain separate checks. See [VERIFICATION.md](docs/VERIFICATION.md) for completed results and remaining limits.

## Files and deployment

- `src/app/page.tsx`: interactive application, album creation, and local browser state.
- `src/components/Bookshelf.tsx` and `bookshelf-scene.css`: rustic cabinet, upright spines, pointer/keyboard previews, and shared cover contents.
- `src/components/AddAlbumForm.tsx` and `add-album-form.css`: existing/new companion selection and compressed cover-photo preview.
- `src/app/bookshelf-home.css`: shared paper navigation and workspace layout outside the immersive reader.
- `src/app/replies-board.css`: replies framed in the same wood and parchment materials as the bookshelf.
- `src/app/globals.css`: responsive visual styles and focus states.
- `src/app/layout.tsx`: metadata, document language, and self-hosted fonts.
- `src/components/AlbumBook.tsx`: chronological book reader, page-turn interaction, and accessible navigation.
- `src/components/AlbumLeaf.tsx`: shared real contribution page used in the reader and opening.
- `src/components/BookVolume.tsx` and `book-volume.css`: shared CSS 3D sheet groups, outer faces, and binding geometry beneath the reader and opening.
- `src/components/AlbumNameplate.tsx`: shared sewn pair-name label for the open book and its opening animation.
- `src/lib/opening-geometry.ts`: measured and initial responsive geometry for the shelf transition.
- `src/components/album-book.css`: paper, binding, page shadows, and responsive reader styles.
- `src/components/ScrapbookEditor.tsx`: pointer and keyboard composition controls.
- `src/components/ScrapbookPage.tsx` and `StickerArt.tsx`: shared page rendering and ten original SVG stickers.
- `src/lib/scrapbook.ts`: bounded, validated decoration metadata.
- `src/components/AlbumOpening.tsx` and `src/components/album-opening.css`: shelf-to-reader lift, forward motion, hardcover opening, and accessible skip/cleanup behavior.
- `src/lib/model.ts`: domain types, sample data, delivery reducer, notifications, and check-in/date helpers.
- `src/lib/model.test.ts` and `src/lib/storage.test.ts`: model, transport, and persistence behavior tests.
- `next.config.ts`: static export configuration.
- `.openai/hosting.json`: Sites project binding and the `out` static directory.
- [Research sources](docs/SOURCES.md), [product and technical decisions](docs/DECISIONS.md), and [image credits](docs/ASSETS.md).

Build before deploying through Sites. The review deployment remains private; access is controlled by Sites settings. `.openai/hosting.json` binds this checkout to the hosting project and identifies `out/` as the static directory. GitHub holds the application source on `main`; Sites serves the built application. Source pushes and private deployment are separate release steps.

A production service needs authenticated backend storage, authorization/RBAC, encryption, a delay-tolerant transport with idempotency and acknowledgments, and review of consent, accessibility, clinical behavior, and localized support resources. See [DECISIONS.md](docs/DECISIONS.md) for the boundary between the demonstration and that work.

## Support a Crewmate

The home screen and navigation open a separate support workspace with four situations: **Anxiety or agitation**, **Emotional overload**, **Crew conflict**, and **Not sure**. These are fixed demonstration paths pending clinical and mission-specific review, with one practical action, suggested words, response choices, and source-linked **Why this step?** explanations. Guidance follows the WHO and NCTSN/National Center for PTSD psychological first aid manuals. It respects consent and refusal, and can be ended at any time. Serious physical symptoms or immediate danger lead to onboard emergency instructions without assuming a psychological cause. **Get Medical Support** stays visible and displays configurable mission-approved instructions; it does not call or alert anyone. Reporting **Feeling better** never clears an earlier medical or emergency escalation or constitutes medical clearance.

**My Support Plan** contains helpful strategies, approaches to avoid, and support contacts. A colleague sees only entries explicitly authorized for sharing. Alex and Jordan are fictional demo profiles, not authenticated accounts. A session can end without saving, or its observations, actions, and next steps can be reviewed and explicitly saved as a private local summary. Plans and summaries use the separate `still-here:crew-support:v1` browser key, outside family albums; nothing is sent automatically. Browser storage is not a secure medical record: do not enter real sensitive information.

Offline preparation is available only in the production build. While connected in a supported HTTPS browser, select **Prepare offline support**, then **Reload to activate offline copy**. Rely on the copy only after **Offline support ready on this browser.** confirms that the active cache matches the current build. First preparation requires a connection; clearing browser data removes the copy. A disconnected local cache cannot enforce later revocation of server access. See [CREW_SUPPORT.md](docs/CREW_SUPPORT.md) for the flow, safety boundaries, privacy model, and offline checks.

# Still Here

Still Here helps astronauts take part in the everyday lives of people they love, even when communication is delayed. Instead of waiting for a live conversation, each person adds a page to a shared story, and the other person continues it later.

**[Open the demo at still-here.health](https://still-here.health)** — no login required. The interface is in English.

**This is a demonstration.** People, conversations, and delivery are simulated in one browser. Pages are not sent to another person or device, and there are no real accounts or server backups.

## What you can do

- **Browse your bookshelf.** Each album is a cloth-bound book. Preview its cover, open it, and turn through memories in chronological order. Use the page arrows, keyboard, or a corner drag; on small screens, read one page at a time.
- **Create an album.** Choose **+ Add album**, give it a title, and select a companion. As Alex, you can also choose **Someone new**, enter their name, and add a cover photo.
- **Make a scrapbook page.** Choose **Add a page** or **Reply**. Write, add a photo, choose a layout, and decorate with tape and movable stickers. Photos are compressed automatically. Drafts save in this browser; **Publish page** adds the finished page to the album.
- **Follow replies.** Each page shows its author, full date, and delivery state. When the other participant's reply is delivered, **Replies** shows it and links to the matching page in the book.
- **Complete a weekly check-in.** Answer three short questions about connection, loneliness, and support on separate 1–5 scales. You can edit the current week's answers and revisit previous check-ins. They stay outside the family albums.
- **Support a crewmate.** Follow a separate, step-by-step demonstration of peer support, with a personal support plan and an optional private summary. Details are below.

**Settings** contains the demo profile selector, the simulated connection switch, and **Night mode**. Keyboard controls and reduced-motion support are included. **How it works** explains communication delays without interrupting the album experience.

## Try a complete exchange

1. Start as Alex; choose that profile in **Settings** if needed. Open an album, choose **Add a page**, write a memory, and select **Publish page**.
2. Wait for **Delivered**. Choose **Shelf**, open **Settings**, and use **Explore another side of the story** to switch to that album's other participant.
3. Open the delivered page and choose **Reply**. Write and publish the response.
4. Once the reply is delivered, return through **Shelf → Settings** and switch back to Alex. Open **Replies**, then open the response in the book. The original page now shows **Answered**.

Both sides are written manually in this demo. A timer never creates a person's reply.

## What the delivery states mean

| State | Meaning in the demo |
| --- | --- |
| **Recorded** | The page is saved in this browser and waiting to send. |
| **Sent** | The simulated delivery has started. |
| **Delivered** | The page is available to the other demo participant. |
| **Answered** | A reply from the other participant has been delivered. |

Delivery takes at least 12 seconds after sending while the link is available. Pausing the link or going offline holds updates until the connection returns. This timing is a demonstration, not a real communications service or an arrival guarantee.

To try an interruption, return through **Shelf → Settings**, pause the simulated link, then resume it to let pending delivery continue.

## Stories already on the shelf

Seven fictional albums let you explore both sides of a shared story:

| Album | Story |
| --- | --- |
| **Sam & Alex** | A midnight supper club connects a rooftop dinner on Earth with Alex's meal in space. |
| **Maya & Alex** | A lighthouse treasure hunt uncovers clues and an old keepsake capsule. |
| **June & Alex** | A neighborhood brings an old picture house back to life. |
| **Lily & Alex** | A backyard expedition follows fireflies and invents a constellation. |
| **Gui & Alex** | Ten-year-old Gui prepares a school rocket-olympiad project with his father's engineering tips and teacher-supervised paper models. |
| **Rosa & Alex** | Bread recipes become a way to share family memories. |
| **Theo & Alex** | Old friends finish a song across the distance. |

Illustrative photographs include original AI-generated scenes. Credits and generation prompts are in [ASSETS.md](docs/ASSETS.md) and [STORY_IMAGE_PROMPTS.md](docs/STORY_IMAGE_PROMPTS.md).

## Support a Crewmate

Open **Support a Crewmate** from the home screen or navigation. Choose **Anxiety or agitation**, **Emotional overload**, **Crew conflict**, or **Not sure**, then select **Start guided support**.

This area has its own **Demo crew profile** selector for fictional crewmembers Alex and Jordan.

The guide begins with a safety check. Each screen offers one practical action, suggested words, and response choices. **Why this step?** explains the source behind the guidance. **Back**, **Continue**, and **End support** let you control the pace and stop at any time, including when someone declines help.

- **Get Medical Support** stays available throughout the guide. It shows onboard contact instructions; it does not place a call or notify anyone. **Medical contact setup** lets you replace the demonstration placeholders with instructions reviewed for the mission.
- **My Support Plan** records helpful strategies, approaches to avoid, and support contacts. The colleague's view shows only entries the plan owner has authorized for sharing.
- **Feeling better**, **About the same**, and **Feeling worse** let the person describe how they feel. Improvement is not a diagnosis or medical clearance and cannot cancel an earlier medical escalation.
- At the end, you can prepare, review, and explicitly save a private summary. Summaries stay separate from family albums and are never sent automatically.

**The support content is demonstrative and pending clinical and mission-specific review.** It uses fixed, authored paths based on the WHO and NCTSN/National Center for PTSD psychological first aid guides. It does not diagnose, prescribe, or generate treatment instructions with AI. Serious physical symptoms or immediate danger lead to emergency instructions without assuming a psychological cause. NASA references provide context, not approval or proof that Still Here is effective.

### Prepare support for offline use

In the production build, while connected through HTTPS or localhost in a browser that supports service workers:

1. Select **Prepare offline support**.
2. Select **Reload to activate offline copy** when prompted.
3. Wait for **Offline support ready on this browser.** before disconnecting.

The prepared copy includes the guide and its step explanations. External reference websites still need a connection. Clearing browser data or losing the cached copy removes offline availability. This is not an emergency communications system.

## Your data and the demo's limits

- Albums, added people, cover photos, pages, drafts, and check-ins stay in this browser. Crew-support plans and summaries use separate local storage.
- Check-ins and summaries are filtered to their demo profile. **Profile switching is not authentication or a security boundary.** Anyone with access to the browser can inspect its saved data. Use fictional information, especially on a shared device.
- There is no device synchronization, invitation, automatic message, or server backup. Clearing site data removes saved content. Use one editing tab at a time to avoid conflicting changes.
- Message counts are never used as a mental-health score. Check-ins do not produce a diagnosis or an automatic alert.
- Limited phrase matching in page text and check-in notes can show nonblocking support information. It can miss a crisis or match unrelated text; it is not a risk assessment. Urgent help must use local emergency services or the mission medical team, without waiting for an album reply.

## Run locally

Requirements: **Node.js 20.9 or later** and **npm**. The app uses Next.js, TypeScript, React, and Tailwind CSS. No API key or environment file is required.

```sh
git clone https://github.com/guiabbehusen/nasa-space-apps-2026.git
cd nasa-space-apps-2026
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

To check the code:

```sh
npm run typecheck
npm test
```

To preview the production build, stop the development server first:

```sh
npm run build
npm run preview
```

The build creates static files in `out/`; preview serves them on port 3000. Use this production preview to test offline preparation. The project does not use `next start`.

## Documentation and publishing

- [Product and technical decisions](docs/DECISIONS.md)
- [Research sources and evidence limits](docs/SOURCES.md), including the Human Research Roadmap, BMed-106, the 2026 family-communication study, NASA-STD-3001, and BMed-103
- [Crew-support flow, sources, and privacy](docs/CREW_SUPPORT.md)
- [Image credits](docs/ASSETS.md) and [generation prompts](docs/STORY_IMAGE_PROMPTS.md)
- [Completed verification and remaining limits](docs/VERIFICATION.md)

GitHub `main` holds the source. Sites hosts the built application at [still-here.health](https://still-here.health), publicly accessible without ChatGPT login. Source pushes and website deployment are separate steps. Publishing the application does not upload browser-local albums, plans, or summaries.

A real multiuser service still needs authenticated accounts, secure backend storage, verified delivery, and clinical, privacy, accessibility, and mission-operations review.

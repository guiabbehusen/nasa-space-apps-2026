# Image credits

The four stock photographs below remain as legacy-compatible assets for older local albums. Current Sam, Maya, June, and Lily covers and story photographs use original generated scenes under `public/images/stories/`, documented at the end of this file. The stock memories do not depict the fictional participants or real astronauts. These legacy files are self-hosted JPEG crops at 720 × 720 pixels, downloaded on 14 November 2026. No runtime request to Unsplash is required. Their original credits and license details are retained below.

| Local file               | Photographer   | Original photograph                                                                                                                          | File size     |
| ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `public/images/lily.jpg` | Erwin Bosman   | [Child digging in sand with a shovel at the beach](https://unsplash.com/photos/child-digging-in-sand-with-a-shovel-at-the-beach-FxOWW-x7kFM) | 105,886 bytes |
| `public/images/sam.jpg`  | Simon Maisch   | [Lake in the middle of mountains](https://unsplash.com/photos/lake-in-the-middle-of-mountains-lawlMewb8Xg)                                   | 86,404 bytes  |
| `public/images/maya.jpg` | Justin Buisson | [People hiking on a mountain trail](https://unsplash.com/photos/people-hiking-on-mountain-trail-vIluu0IH6Ps)                                 | 95,365 bytes  |
| `public/images/june.jpg` | Amie Roussel   | [A woman holding a bouquet of flowers in a garden](https://unsplash.com/photos/a-woman-holding-a-bouquet-of-flowers-in-a-garden-rvh3HHWlRu0) | 117,707 bytes |

Each original page states that its photograph is free to use under the [Unsplash License](https://unsplash.com/license). The license permits downloading and using images for commercial and noncommercial purposes. It prohibits selling unmodified images and compiling them into a competing image service. Attribution is retained here as a courtesy. The Unsplash License does not imply endorsement, identity, or consent for every sensitive context; obtain appropriate rights and review imagery before a real clinical or mission deployment.

Images were resized and cropped through Unsplash's image service (`fit=crop&w=720&h=720&q=78`). The people pictured are unrelated to the fictional album names. Covers are decorative examples and should be replaced by participant-chosen memories in a deployed multiuser service.

## Rustic bookshelf

The cabinet reuses the existing self-hosted wood and aged-paper materials below. Cloth-bound spines, raised bands, sewn labels, corner mounts, and the small sprout emblem in `Bookshelf.tsx` are original CSS/SVG construction. The shelf and flying cover share the same content renderer. No new raster images or external asset requests were introduced for this revision.

## Generated physical materials

The following original material textures were generated with the built-in OpenAI image-generation tool on 15 November 2026 for this application. They contain no photographs of people, text, logos, or third-party artwork. The generated PNG originals were retained outside the repository; project copies were resized and JPEG-compressed with the existing Sharp dependency, without content editing.

| Local file                        | Material                                                                                       | Dimensions  | File size     |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- | ------------- |
| `public/textures/rustic-wood.jpg` | Matte rustic walnut/oak tabletop, horizontal grain, gentle wear, natural light from upper-left | 1536 × 1024 | 263,174 bytes |
| `public/textures/aged-paper.jpg`  | Pale yellowed ivory album paper with fine cellulose fibers and gentle mottling                 | 768 × 768   | 56,806 bytes  |

Both files are self-hosted. The wood texture is a full-frame surface, not a repeating seamless tile. The paper texture is deliberately subtle to preserve readable dark ink. Full generation prompts and the built-in generation method are recorded in [MATERIAL_PROMPTS.md](MATERIAL_PROMPTS.md) and the delivered `material-prompts.txt` artifact.

Handwriting uses self-hosted [Caveat](https://fontsource.org/fonts/caveat) 400 and 600 and [Kalam](https://fontsource.org/fonts/kalam) 400 from the pinned Fontsource 5.3.0 packages, under OFL-1.1. Their license files are retained under `public/licenses/` and in the installed packages; no runtime font-service request is needed. The woven cover tile `public/textures/cloth-weave.svg` and the ten stitched applique SVGs in `StickerArt.tsx` are original code-native artwork. Generated image textures are decorative materials, not photographs of an actual participant’s belongings.

## Open-album reference revision

The reference supplied on 15 November 2026 is used as visual guidance only. Its people, plant photographs, Portuguese text, and complete image are not included as application assets. The current reader's tan background reuses `aged-paper.jpg` with a CSS color wash; the former rustic wood file remains in the repository. No new raster generation or external image download was required for this revision.

The added Caveat 400 stylesheet comes from the already installed, pinned Fontsource package under OFL-1.1. The olive sprigs in `AlbumNameplate.tsx` are original code-native artwork. Photo corners, ruled paper, tape, and pencil underlines use CSS or inline vector artwork.

## New shared stories and optional cover

Four original illustrative photographs were generated on 15 November 2026 with the built-in OpenAI image-generation tool, using the `imagegen` skill in built-in mode. These are fictional scenes, not photographs of real participants or their belongings. No external photo service is contacted at runtime. The generated PNG originals remain in the generation workspace; the self-hosted JPEG copies below were resized to 720 × 720 and compressed at quality 82 with Sharp, without content editing. Physical frames, tape, and photo corners are supplied by the application.

| Local file                      | Scene                                                                    | File size    |
| ------------------------------- | ------------------------------------------------------------------------ | ------------ |
| `public/images/gui.jpg`         | Fictional ten-year-old Gui with his school paper rocket                  | 68,578 bytes |
| `public/images/rosa.jpg`        | Grandmother's bread-making hands and recipe notebook                     | 84,968 bytes |
| `public/images/theo.jpg`        | Friend's acoustic guitar and songwriting notebook                        | 76,725 bytes |
| `public/images/blank-album.jpg` | Neutral postcard and pressed flower, used until a person chooses a cover | 75,676 bytes |

### Final generation prompts

**Gui**

```text
Use case: photorealistic-natural. Asset type: square photograph for a warm family scrapbook album cover. Create a fictional candid family memory of Gui, a cheerful ten-year-old boy with dark curly hair at a wooden kitchen table, proudly examining a small handmade blue-and-cream paper rocket with three simple paper fins for his school science project. Plain rolled paper and a drinking straw, colored pencils and his sketchbook on the table; no fuel, no bottle, no launcher, no flame, no dangerous hardware. Framing: medium candid scene, boy and paper rocket centered, hands natural, enough margin for square crop. Soft afternoon window light, tactile everyday textures, warm nostalgic natural colors, authentic home snapshot, slight film grain. This is a new fictional person, not based on any real child. Full-bleed photographic image only. No decorative frame, no Polaroid border, no writing or text, no watermark, no logos.
```

**Rosa**

```text
Use case: photorealistic-natural. Asset type: square photograph for a warm family scrapbook album cover. Create a fictional candid memory of a grandmother's kitchen: aged hands gently shaping a small loaf of bread on a floured rustic wooden table, a finished golden loaf, a well-loved cream recipe notebook opened nearby with small indistinct handwritten marks. Warm humble home, linen cloth, calm soft afternoon window light, tactile flour and bread textures, nostalgic real family snapshot, slight film grain. Composition centered on hands and loaf, enough space around the main subject for a square crop. No need to show face. Full-bleed photographic image only. No decorative frame, no Polaroid border, no readable text, no logos or watermark.
```

**Theo**

```text
Use case: photorealistic-natural. Asset type: square photograph for a warm shared-memory scrapbook album cover. Create a fictional candid memory of an old friend's songwriting afternoon: close view of a friend's hands resting on a well-loved natural wood acoustic guitar in a cozy living room, simple open cream music notebook and pencil beside him, late afternoon sun falling across the guitar's worn wood, a soft blue shirt, relaxed and nostalgic. Natural human hands and plausible six-string guitar, gentle film grain, authentic everyday family-photo feeling. Composition with guitar and hands central and room for a square crop; face need not be visible. Full-bleed photographic image only. No decorative frame or Polaroid border, no readable words or notation, no text, no logos, no watermark.
```

**Optional-cover fallback**

```text
Use case: photorealistic-natural. Asset type: square neutral placeholder photograph for the front cover of a cozy personal scrapbook. An unmarked cream postcard lying on a warm wooden desk, a tiny pressed yellow flower and a plain wooden pencil nearby. Soft afternoon window light, real paper fibers and subtle wood texture, warm nostalgic everyday photo, calm and minimal composition with postcard centered. Full-bleed photograph only. Absolutely no text or handwriting or symbols, no logo, no border or frame, no people or hands, no watermark.
```

## Generated Sam, Maya, June, and Lily story photographs

Eight original illustrative photographs were generated on 15 November 2026 with the built-in `image_gen` tool, applying the imagegen skill in built-in generate mode (`photorealistic-natural`). One independent call produced each square scene. These are fictional family memories, not NASA photographs, records of actual missions, or depictions of real participants. They do not establish a real person's identity or affiliation.

All final JPEGs are self-hosted at 720 × 720 pixels, resized and compressed at quality 82 with the existing Sharp dependency, without content editing. No frames, tape, text overlays, or application UI are baked into the images; the interface supplies the physical scrapbook treatment. No runtime photo-service requests are required.

| Local file                                  | Scene                                                                                 | Dimensions | File size    |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | ---------- | ------------ |
| `public/images/stories/sam-supper.jpg`      | Cozy rooftop supper for two, folded blank place cards and orange-cinnamon dessert     | 720 × 720  | 85,798 bytes |
| `public/images/stories/sam-menu.jpg`        | Homemade menu made of food drawings, cake, orange peel and cinnamon                   | 720 × 720  | 89,319 bytes |
| `public/images/stories/maya-lighthouse.jpg` | Anonymous friend discovering a lighthouse on a public coastal path                    | 720 × 720  | 91,861 bytes |
| `public/images/stories/maya-capsule.jpg`    | Weathered keepsake tin, indistinct old snapshots, blue button, shell and drawn map    | 720 × 720  | 82,517 bytes |
| `public/images/stories/june-cinema.jpg`     | Fictional older woman and volunteers reviving a small community cinema                | 720 × 720  | 72,752 bytes |
| `public/images/stories/june-film.jpg`       | Older hands with Super 8 reel, projector and indistinct family slides                 | 720 × 720  | 72,788 bytes |
| `public/images/stories/lily-expedition.jpg` | Fictional child in supervised backyard blanket-fort expedition, free-flying fireflies | 720 × 720  | 69,056 bytes |
| `public/images/stories/lily-lanterns.jpg`   | Safe LED paper lantern constellation and a child's drawn star map at blue hour        | 720 × 720  | 71,400 bytes |

Exact unabridged generation prompts, tool mode, final project paths, and original local PNG paths are recorded in [STORY_IMAGE_PROMPTS.md](STORY_IMAGE_PROMPTS.md). Original PNGs remain in the built-in generation directory. The eight JPEGs total 635,491 bytes (about 621 KiB). The legacy Unsplash assets above are retained without modification for compatibility and their credits remain applicable only to those older files.


## Generated Alex space-meal reply photograph

The original illustrative photograph `public/images/stories/alex-space-meal.jpg` was generated on 15 November 2026 with the built-in `image_gen` tool in generate mode (`photorealistic-natural`). Alex is a fictional anonymous adult father and astronaut, shown eating from a meal pouch in a plausible small spacecraft cabin. This is not a NASA photograph, a record of a real mission, or a depiction of any actual crewmember. It carries no readable labels, mission patches, logos, framing, tape, or application UI. The self-hosted JPEG is 720 × 720 pixels, 54,618 bytes, resized and compressed at quality 82 with Sharp without content editing. Its exact prompt and original local PNG path are appended to [STORY_IMAGE_PROMPTS.md](STORY_IMAGE_PROMPTS.md).

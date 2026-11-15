import test from "node:test";
import assert from "node:assert/strict";
import {
  addContribution,
  advanceDelivery,
  createAlbum,
  createInitialData,
  getReplyNotifications,
  getPeople,
  MAX_CUSTOM_ALBUMS,
  type AppData,
  type PageDesign,
} from "./model";
import { parseStoredData } from "./storage";

const now = new Date("2026-11-14T15:00:00Z");
const saved = (): AppData => ({
  ...createInitialData(now),
  drafts: {
    "alex:lily": {
      title: "A reply in progress",
      text: "Your plant made me smile.",
      replyTo: "lily-4",
      photo: "data:image/jpeg;base64,/9j/2Q==",
    },
    "sam:sam": { title: "Our Saturday", text: "I saved a seat for you." },
  },
  checkIns: [
    {
      id: "reflection-1",
      profileId: "alex",
      week: "2026-11-09",
      createdAt: now.toISOString(),
      connection: 4,
      loneliness: 2,
      support: 5,
      note: "A quiet but good week.",
    },
  ],
  readReplyIds: ["lily-4"],
});
const parse = (data: unknown) => parseStoredData(JSON.stringify(data));
const design = (): PageDesign => ({
  layout: "postcard",
  tape: "midnight",
  photoTilt: -3,
  stickers: [
    { id: "planet-1", kind: "planet", x: 80, y: 15, rotation: -18, scale: 1.2 },
    { id: "heart-1", kind: "heart", x: 20, y: 80, rotation: 9, scale: 0.8 },
  ],
});

test("a valid saved snapshot round-trips with every page, draft, reflection and read marker intact", () => {
  const data = saved();
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(restored.pages.length, data.pages.length);
  assert.equal(Object.keys(restored.drafts).length, 2);
  assert.equal(restored.checkIns[0].note, "A quiet but good week.");
});

test("scrapbook designs round-trip on both published pages and unfinished drafts", () => {
  const data = saved();
  data.pages[0].design = design();
  data.drafts["alex:lily"].design = {
    ...design(),
    layout: "letter",
    tape: "sage",
  };
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(restored.pages[0].design!.stickers[0].x, 80);
  assert.equal(restored.drafts["alex:lily"].design!.tape, "sage");
});

test("legacy version-one snapshots without design metadata still load unchanged", () => {
  const data = saved();
  for (const page of data.pages) delete page.design;
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(Object.hasOwn(restored.pages[0], "design"), false);
  assert.equal(Object.hasOwn(restored.drafts["alex:lily"], "design"), false);
  assert.equal(Object.hasOwn(restored, "customAlbums"), false);
});

const customSaved = () => {
  let data = createAlbum(
    saved(),
    { personId: "lily", title: "Our garden" },
    "album-garden",
  );
  data = addContribution(
    data,
    {
      albumId: "album-garden",
      authorId: "alex",
      title: "From here",
      text: "A leaf unfolded.",
    },
    now,
  );
  data = {
    ...data,
    pages: advanceDelivery(
      advanceDelivery(data.pages, true, now),
      true,
      new Date(now.getTime() + 12_000),
    ),
  };
  const parent = data.pages.find((item) => item.albumId === "album-garden")!;
  data.drafts["lily:album-garden"] = {
    title: "From Earth",
    text: "Two leaves now.",
    replyTo: parent.id,
    design: design(),
  };
  data.drafts["alex:album-garden"] = {
    title: "Another moment",
    text: "A draft for this book.",
  };
  return addContribution(
    data,
    {
      albumId: "album-garden",
      authorId: "lily",
      title: "Your plant says hello",
      text: "Mine has grown too.",
      replyTo: parent.id,
    },
    new Date(now.getTime() + 20_000),
  );
};

/** Exact authored fields from the version shipped before the four story refreshes. */
const legacyClassicSaved = (): AppData => {
  const data = customSaved();
  const at = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  const seed = (
    id: string,
    albumId: string,
    authorId: string,
    hoursAgo: number,
    title: string,
    text: string,
    extra: Partial<AppData["pages"][number]> = {},
  ): AppData["pages"][number] => ({
    id,
    albumId,
    authorId,
    title,
    text,
    createdAt: at(hoursAgo),
    sentAt: at(hoursAgo - 0.05),
    deliveredAt: at(hoursAgo - 0.25),
    status: "delivered",
    ...extra,
  });
  const oldPages = [
    seed(
      "june-1",
      "june",
      "june",
      240,
      "The kitchen is still yours",
      "The rosemary on the windowsill has grown a little wild. I made your favorite tea and sat in the afternoon light. There will always be a place for you at this table.",
      { photo: "/images/june.jpg" },
    ),
    seed(
      "sam-1",
      "sam",
      "sam",
      216,
      "Saving you the window seat",
      "It rained all morning, so I took our books to the little café. Your chair caught the only patch of sun. I thought you would like that.",
      { status: "answered", answeredAt: at(191.75), photo: "/images/sam.jpg" },
    ),
    seed(
      "lily-1",
      "lily",
      "lily",
      204,
      "A very important pancake",
      "Dad! I made a pancake shaped like Saturn. The rings fell off but Mom says that happens in space sometimes. I saved a picture for you.",
      { status: "answered", answeredAt: at(167.75), photo: "/images/lily.jpg" },
    ),
    seed(
      "sam-2",
      "sam",
      "alex",
      192,
      "A seat beside the stars",
      "I read a chapter during our quiet hour today. The view was a little different, but for a moment it felt like we were sitting together. Keep my place.",
      { replyTo: "sam-1" },
    ),
    seed(
      "lily-2",
      "lily",
      "alex",
      168,
      "Best planet in the solar system",
      "I can almost smell the pancakes from here. Saturn loses bits of its rings too, so yours sounds very accurate. Next time, could you make a tiny moon for me?",
      { replyTo: "lily-1" },
    ),
    seed(
      "maya-1",
      "maya",
      "maya",
      120,
      "The long way home",
      "I took the coastal path after work. Same bend in the trail, same unreasonable wind. I stopped where we used to watch the boats and sent a hello up to your part of the sky.",
      { photo: "/images/maya.jpg" },
    ),
    seed(
      "lily-3",
      "lily",
      "alex",
      72,
      "Our little moon garden",
      "I checked on the little plant we started before launch. A new leaf has opened! I wondered how your windowsill garden is doing. Maybe our plants can be pen pals.",
      { status: "answered", answeredAt: at(5.75) },
    ),
    seed(
      "sam-3",
      "sam",
      "alex",
      48,
      "Something ordinary to keep",
      "The first sip of coffee today reminded me of our slow Saturday mornings. Tell me one ordinary thing from your day, whenever a moment finds you. There is no hurry.",
      { photo: "/images/sam.jpg" },
    ),
    seed(
      "june-2",
      "june",
      "alex",
      36,
      "I brought the recipe",
      "I found your handwritten soup recipe tucked into my notebook. The little note at the bottom says, ‘a little more lemon.’ It made me feel close to home today.",
    ),
    seed(
      "lily-4",
      "lily",
      "lily",
      6,
      "The moon got a friend",
      "Our bean has TWO new leaves! I drew a tiny astronaut next to the pot so it has someone to talk to. Please tell your space plant that mine says hello.",
      { replyTo: "lily-3", photo: "/images/lily.jpg" },
    ),
  ];
  data.pages = [
    ...data.pages.filter(
      (page) => !["sam", "maya", "june", "lily"].includes(page.albumId),
    ),
    ...oldPages,
  ].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  data.customAlbums![0].cover = "/images/lily.jpg";
  delete data.classicStoriesVersion;
  return data;
};

test("untouched older demo albums receive the four complete story arcs without losing their delivery history or personal records", () => {
  let legacy = legacyClassicSaved();
  legacy = addContribution(
    legacy,
    {
      albumId: "sam",
      authorId: "sam",
      title: "A personal reply",
      text: "These are my own words.",
      replyTo: "sam-3",
    },
    now,
  );
  const personalReply = legacy.pages.find(
    (page) => page.title === "A personal reply",
  )!;
  legacy.drafts["sam:sam"].replyTo = "sam-3";
  const raw = JSON.stringify(legacy);
  const beforeNotifications = getReplyNotifications(legacy, "alex").map(
    (page) => page.id,
  );
  const upgraded = parseStoredData(raw);
  assert.equal(upgraded.classicStoriesVersion, 1);
  assert.equal(upgraded.pages.length, legacy.pages.length + 11);
  for (const [albumId, count] of [
    ["sam", 6],
    ["maya", 4],
    ["june", 5],
    ["lily", 6],
  ] as const)
    assert.equal(
      upgraded.pages.filter(
        (page) => page.albumId === albumId && page.id !== personalReply.id,
      ).length,
      count,
    );
  for (const prior of legacy.pages) {
    const next = upgraded.pages.find((page) => page.id === prior.id)!;
    if (
      !["sam", "maya", "june", "lily"].includes(prior.albumId) ||
      prior.id === personalReply.id
    ) {
      assert.deepEqual(next, prior);
      continue;
    }
    assert.equal(next.createdAt, prior.createdAt);
    assert.equal(next.sentAt, prior.sentAt);
    assert.equal(next.deliveredAt, prior.deliveredAt);
    if (prior.status === "answered") {
      assert.equal(next.answeredAt, prior.answeredAt);
      assert.equal(next.status, prior.status);
    } else {
      const reply = upgraded.pages.find(
        (page) => page.replyTo === prior.id && page.deliveredAt,
      )!;
      assert.equal(next.status, "answered");
      assert.equal(next.answeredAt, reply.deliveredAt);
    }
    if (prior.replyTo) assert.equal(next.replyTo, prior.replyTo);
  }
  for (const [child, parent] of [
    ["sam-3", "sam-4"],
    ["june-2", "june-1"],
    ["lily-3", "lily-5"],
  ]) {
    assert.equal(
      upgraded.pages.find((page) => page.id === child)!.replyTo,
      parent,
    );
    assert.ok(upgraded.readReplyIds.includes(child));
  }
  assert.deepEqual(
    getReplyNotifications(upgraded, "alex").map((page) => page.id),
    beforeNotifications,
  );
  assert.deepEqual(
    upgraded.readReplyIds.slice(0, legacy.readReplyIds.length),
    legacy.readReplyIds,
  );
  assert.deepEqual(upgraded.drafts, legacy.drafts);
  assert.deepEqual(upgraded.checkIns, legacy.checkIns);
  assert.deepEqual(upgraded.customAlbums, legacy.customAlbums);
  assert.equal(JSON.stringify(legacy), raw);
  assert.deepEqual(parse(upgraded), upgraded);
});

test("an offline story refresh derives Answered only from introduced delivered replies and preserves earlier answer history", () => {
  const legacy = legacyClassicSaved();
  const alreadyAnswered = legacy.pages.find((page) => page.id === "sam-1")!;
  alreadyAnswered.answeredAt = "2026-10-01T10:00:00.000Z";
  const upgraded = parse(legacy);
  const offline = advanceDelivery(
    upgraded.pages,
    false,
    new Date("2027-01-01T00:00:00Z"),
  );
  assert.equal(
    offline,
    upgraded.pages,
    "offline transport does not need to run to reconcile the authored results",
  );
  for (const [parentId, replyId] of [
    ["sam-2", "sam-4"],
    ["sam-3", "sam-5"],
    ["maya-1", "maya-2"],
    ["june-1", "june-2"],
    ["june-2", "june-3"],
    ["lily-2", "lily-5"],
    ["lily-4", "lily-6"],
  ]) {
    const prior = legacy.pages.find((page) => page.id === parentId)!;
    const parent = offline.find((page) => page.id === parentId)!;
    const reply = offline.find((page) => page.id === replyId)!;
    assert.equal(prior.status, "delivered");
    assert.equal(parent.status, "answered");
    assert.equal(parent.answeredAt, reply.deliveredAt);
    assert.equal(parent.createdAt, prior.createdAt);
    assert.equal(parent.sentAt, prior.sentAt);
    assert.equal(parent.deliveredAt, prior.deliveredAt);
  }
  assert.equal(
    offline.find((page) => page.id === "sam-1")!.answeredAt,
    alreadyAnswered.answeredAt,
  );
  for (const page of legacy.pages.filter(
    (page) => page.albumId === "album-garden",
  ))
    assert.deepEqual(
      offline.find((item) => item.id === page.id),
      page,
    );
});

test("a personally edited original chapter keeps its entire album intact and receives no historical replies", () => {
  for (const patch of [
    { title: "My personal title" },
    { text: "My own story." },
    { photo: "data:image/jpeg;base64,/9j/2Q==" },
    { design: design() },
    { replyTo: "sam-1" },
  ]) {
    const legacy = legacyClassicSaved();
    Object.assign(legacy.pages.find((page) => page.id === "sam-3")!, patch);
    const samBefore = legacy.pages.filter((page) => page.albumId === "sam");
    const upgraded = parse(legacy);
    assert.deepEqual(
      upgraded.pages.filter((page) => page.albumId === "sam"),
      samBefore,
    );
    assert.equal(
      upgraded.pages.filter((page) => page.albumId === "maya").length,
      4,
    );
    assert.deepEqual(parse(upgraded), upgraded);
  }
});

test("removed original demo chapters stay removed instead of being resurrected by the story refresh", () => {
  const legacy = legacyClassicSaved();
  legacy.pages = legacy.pages.filter((page) => page.id !== "sam-3");
  const samBefore = legacy.pages.filter((page) => page.albumId === "sam");
  const upgraded = parse(legacy);
  assert.deepEqual(
    upgraded.pages.filter((page) => page.albumId === "sam"),
    samBefore,
  );
  assert.equal(
    upgraded.pages.some((page) => page.id === "sam-3"),
    false,
  );
  assert.deepEqual(parse(upgraded), upgraded);
});

test("a missing first June chapter and a much newer personal page cannot move the historical story dates", () => {
  let legacy = legacyClassicSaved();
  legacy.pages = legacy.pages.filter((page) => page.id !== "june-1");
  legacy = addContribution(
    legacy,
    {
      albumId: "maya",
      authorId: "alex",
      title: "A newer personal moment",
      text: "This page belongs to a later month.",
    },
    new Date(now.getTime() + 30 * 86_400_000),
  );
  const upgraded = parse(legacy);
  const byId = new Map(upgraded.pages.map((page) => [page.id, page]));
  for (const page of upgraded.pages) {
    if (page.replyTo)
      assert.ok(
        Date.parse(byId.get(page.replyTo)!.createdAt) <
          Date.parse(page.createdAt),
        `${page.id} must follow its parent`,
      );
  }
  for (const old of legacy.pages)
    assert.equal(byId.get(old.id)!.createdAt, old.createdAt);
  assert.equal(
    upgraded.pages.some((page) => page.id === "june-1"),
    false,
  );
  assert.deepEqual(parse(upgraded), upgraded);
});

test("a user page colliding with an added chapter keeps its ID while historical reply links use the remapped chapter", () => {
  const legacy = legacyClassicSaved();
  const userPage = {
    ...legacy.pages.find((page) => page.id === "sam-3")!,
    id: "sam-4",
    title: "My own page",
    text: "This ID was already here.",
    photo: undefined,
  };
  delete userPage.photo;
  legacy.pages.push(userPage);
  legacy.readReplyIds.push("sam-4");
  const upgraded = parse(legacy);
  assert.deepEqual(
    upgraded.pages.find((page) => page.id === "sam-4"),
    userPage,
  );
  const added = upgraded.pages.find((page) => page.id === "classic-sam-4-1")!;
  assert.equal(added.title, "Opening night was slightly smoky");
  assert.equal(
    upgraded.pages.find((page) => page.id === "sam-3")!.replyTo,
    added.id,
  );
  assert.ok(upgraded.readReplyIds.includes(added.id));
  assert.deepEqual(parse(upgraded), upgraded);
});

test("added albums, their contributions and both participant drafts round-trip with legacy records", () => {
  const data = customSaved();
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(restored.customAlbums?.[0].title, "Our garden");
  assert.equal(
    restored.pages.filter((item) => item.albumId === "album-garden").length,
    2,
  );
  assert.equal(restored.drafts["lily:album-garden"].design?.layout, "postcard");
  assert.equal(restored.checkIns[0].note, data.checkIns[0].note);
});

test("invalid added-album metadata rejects the complete snapshot without introducing external covers or participants", () => {
  const invalidPatches = [
    { id: "lily" },
    { id: "album-bad:id" },
    { id: "album-" },
    { personId: "alex" },
    { personId: "unknown" },
    { title: "" },
    { title: " padded " },
    { title: "x".repeat(71) },
    { title: "New\nline" },
    { cover: "https://tracker.example/book.jpg" },
    { cover: "javascript:alert(1)" },
    { cover: "data:image/jpeg;base64," },
    { cover: "/images/unknown.jpg" },
    { accent: "script" },
    { subtitle: "Unvalidated metadata" },
  ];
  for (const patch of invalidPatches) {
    const data = customSaved();
    Object.assign(data.customAlbums![0], patch);
    const raw = JSON.stringify(data);
    assert.throws(() => parseStoredData(raw), /invalid or duplicate/);
    assert.equal(JSON.stringify(data), raw);
  }
  assert.throws(
    () => parse({ ...saved(), customAlbums: null }),
    /invalid or duplicate/,
  );
  const duplicate = customSaved();
  duplicate.customAlbums!.push({ ...duplicate.customAlbums![0] });
  assert.throws(() => parse(duplicate), /invalid or duplicate/);
  const tooMany = customSaved();
  tooMany.customAlbums = Array.from(
    { length: MAX_CUSTOM_ALBUMS + 1 },
    (_, index) => ({ ...tooMany.customAlbums![0], id: `album-${index}` }),
  );
  assert.throws(() => parse(tooMany), /invalid or duplicate/);
});

test("new people, uploaded covers, replies, drafts and their private check-ins all survive reload", () => {
  let data = createAlbum(
    saved(),
    {
      title: "Our new book",
      newPersonName: "Eva Chen",
      cover: "data:image/jpeg;base64,/9j/2Q==",
    },
    "album-eva",
  );
  const eva = getPeople(data).find((person) => person.name === "Eva Chen")!;
  data = addContribution(
    data,
    {
      albumId: "album-eva",
      authorId: eva.id,
      title: "A hello",
      text: "From my corner of Earth.",
    },
    now,
  );
  data.drafts[`${eva.id}:album-eva`] = {
    title: "Next time",
    text: "A little more to tell.",
    design: design(),
  };
  data.checkIns.push({
    ...data.checkIns[0],
    id: "eva-check-in",
    profileId: eva.id,
  });
  assert.deepEqual(parse(data), data);
  const second = createAlbum(
    data,
    { title: "Another chapter", personId: eva.id, cover: "/images/theo.jpg" },
    "album-second",
  );
  assert.deepEqual(parse(second), second);
});

test("malformed and duplicate custom participants reject the complete snapshot", () => {
  const make = () =>
    createAlbum(
      saved(),
      { title: "Our book", newPersonName: "Eva Chen" },
      "album-eva",
    );
  for (const patch of [
    { id: "alex" },
    { id: "person-" },
    { name: "" },
    { name: " padded " },
    { name: "x".repeat(61) },
    { role: "Astronaut" },
    { location: "Unknown" },
    { initials: "XX" },
    { color: "script" },
  ]) {
    const data = make();
    Object.assign(data.customPeople![0], patch);
    assert.throws(() => parse(data), /invalid or duplicate/);
  }
  const duplicated = make();
  duplicated.customPeople!.push({ ...duplicated.customPeople![0] });
  assert.throws(() => parse(duplicated), /invalid or duplicate/);
  const missing = make();
  delete missing.customPeople;
  assert.throws(() => parse(missing), /invalid or duplicate/);
  const orphan = make();
  orphan.checkIns[0].profileId = "person-missing";
  assert.throws(() => parse(orphan), /invalid or duplicate/);
});

test("legacy snapshots receive the three new story chapters once while preserving every earlier record", () => {
  const legacy = customSaved();
  legacy.pages = legacy.pages.filter(
    (page) => !["gui", "rosa", "theo"].includes(page.albumId),
  );
  delete legacy.demoStoriesVersion;
  legacy.pages.find((page) => page.id === "lily-1")!.text =
    "A personally edited old page.";
  const before = JSON.stringify(legacy);
  const upgraded = parseStoredData(before);
  assert.equal(upgraded.pages.length, legacy.pages.length + 14);
  assert.equal(upgraded.demoStoriesVersion, 1);
  for (const old of legacy.pages)
    assert.deepEqual(
      upgraded.pages.find((page) => page.id === old.id),
      old,
    );
  assert.deepEqual(upgraded.customAlbums, legacy.customAlbums);
  assert.deepEqual(upgraded.drafts, legacy.drafts);
  assert.deepEqual(upgraded.checkIns, legacy.checkIns);
  assert.deepEqual(upgraded.readReplyIds, legacy.readReplyIds);
  assert.equal(JSON.stringify(legacy), before);
  assert.deepEqual(parse(upgraded), upgraded);
  const edited = {
    ...upgraded,
    pages: upgraded.pages.filter((page) => page.albumId !== "gui"),
  };
  assert.deepEqual(
    parse(edited),
    edited,
    "the migration marker prevents restoring intentionally removed demo pages",
  );
});

test("a historical user page with a demo-like ID is preserved without breaking the added story's reply links", () => {
  const legacy = saved();
  legacy.pages = legacy.pages.filter(
    (page) => !["gui", "rosa", "theo"].includes(page.albumId),
  );
  delete legacy.demoStoriesVersion;
  legacy.pages.push({
    ...legacy.pages.find((page) => page.id === "lily-1")!,
    id: "gui-1",
    text: "My own page with an older ID.",
  });
  const upgraded = parse(legacy);
  assert.deepEqual(
    upgraded.pages.find((page) => page.id === "gui-1"),
    legacy.pages.at(-1),
  );
  assert.equal(
    upgraded.pages.filter((page) => page.albumId === "gui").length,
    6,
  );
  assert.deepEqual(parse(upgraded), upgraded);
});

test("added-album pages and drafts retain participant and exact-album reply validation", () => {
  const wrongPageAuthor = customSaved();
  wrongPageAuthor.pages.find(
    (item) => item.albumId === "album-garden",
  )!.authorId = "maya";
  assert.throws(() => parse(wrongPageAuthor), /invalid or duplicate/);
  const wrongDraftAuthor = customSaved();
  wrongDraftAuthor.drafts["maya:album-garden"] = {
    title: "",
    text: "Not a participant",
  };
  assert.throws(() => parse(wrongDraftAuthor), /invalid or duplicate/);
  const foreignDraft = customSaved();
  foreignDraft.drafts["lily:album-garden"].replyTo = "lily-2";
  assert.throws(() => parse(foreignDraft), /invalid or duplicate/);
  const foreignPage = customSaved();
  foreignPage.pages.find(
    (item) => item.albumId === "album-garden" && item.authorId === "lily",
  )!.replyTo = "lily-2";
  assert.throws(() => parse(foreignPage), /invalid or duplicate/);
});

test("invalid scrapbook metadata rejects the whole snapshot for pages and drafts", () => {
  const valid = design();
  const invalidDesigns: unknown[] = [
    null,
    [],
    { ...valid, layout: "html" },
    { ...valid, tape: "external-url" },
    { ...valid, photoTilt: 13 },
    { ...valid, photoTilt: -13 },
    { ...valid, photoTilt: Number.NaN },
    { ...valid, stickers: null },
    {
      ...valid,
      stickers: Array.from({ length: 25 }, (_, i) => ({
        ...valid.stickers[0],
        id: `s-${i}`,
      })),
    },
    { ...valid, stickers: [valid.stickers[0], { ...valid.stickers[0] }] },
    ...[
      { id: "" },
      { id: "x".repeat(101) },
      { kind: "script" },
      { x: -1 },
      { x: 101 },
      { x: "40" },
      { x: Number.POSITIVE_INFINITY },
      { y: -1 },
      { y: 101 },
      { rotation: -181 },
      { rotation: 181 },
      { scale: 0.59 },
      { scale: 1.61 },
    ].map((patch) => ({
      ...valid,
      stickers: [{ ...valid.stickers[0], ...patch }],
    })),
  ];
  for (const invalidDesign of invalidDesigns) {
    const pageData = saved();
    (pageData.pages[0] as unknown as Record<string, unknown>).design =
      invalidDesign;
    assert.throws(() => parse(pageData), /invalid or duplicate/);
    const draftData = saved();
    (
      draftData.drafts["alex:lily"] as unknown as Record<string, unknown>
    ).design = invalidDesign;
    assert.throws(() => parse(draftData), /invalid or duplicate/);
  }
});

test("malformed JSON or an unsupported root schema is rejected rather than repaired", () => {
  assert.throws(() => parseStoredData("{incomplete"));
  for (const invalid of [
    null,
    [],
    {},
    { ...saved(), version: 2 },
    { ...saved(), classicStoriesVersion: 2 },
    { ...saved(), drafts: [] },
    { ...saved(), pages: null },
  ]) {
    assert.throws(() => parse(invalid));
  }
});

test("one malformed record rejects the complete snapshot, preserving the original source for recovery", () => {
  for (const mutate of [
    (data: AppData) => {
      data.pages[3].createdAt = "not a date";
    },
    (data: AppData) => {
      data.pages[3].authorId = "maya";
    },
    (data: AppData) => {
      data.checkIns[0].connection = 6;
    },
    (data: AppData) => {
      data.checkIns[0].week = "2026-11-99";
    },
    (data: AppData) => {
      data.checkIns[0].week = "2026-11-10";
    },
    (data: AppData) => {
      data.drafts["alex:lily"].text = "x".repeat(10_001);
    },
    (data: AppData) => {
      data.readReplyIds.push("");
    },
  ]) {
    const data = saved();
    mutate(data);
    const raw = JSON.stringify(data);
    assert.throws(() => parseStoredData(raw), /invalid or duplicate/);
    assert.equal(
      JSON.stringify(data),
      raw,
      "validation does not mutate or replace the source",
    );
  }
});

test("arbitrary external, script, SVG and unapproved local image URLs are rejected", () => {
  for (const photo of [
    "https://tracker.example/photo.jpg",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "/private/photo.jpg",
    "data:image/jpeg;base64,not valid",
  ]) {
    const pageData = saved();
    pageData.pages[0].photo = photo;
    assert.throws(() => parse(pageData), /invalid or duplicate/, photo);
    const draftData = saved();
    draftData.drafts["alex:lily"].photo = photo;
    assert.throws(() => parse(draftData), /invalid or duplicate/, photo);
  }
});

test("duplicate primary IDs and ambiguous weekly reflections are rejected", () => {
  const duplicatePage = saved();
  duplicatePage.pages.push({ ...duplicatePage.pages[0] });
  assert.throws(() => parse(duplicatePage), /invalid or duplicate/);
  const duplicateCheckIn = saved();
  duplicateCheckIn.checkIns.push({
    ...duplicateCheckIn.checkIns[0],
    week: "2026-11-02",
  });
  assert.throws(() => parse(duplicateCheckIn), /invalid or duplicate/);
  const duplicateWeek = saved();
  duplicateWeek.checkIns.push({
    ...duplicateWeek.checkIns[0],
    id: "different-id",
  });
  assert.throws(() => parse(duplicateWeek), /invalid or duplicate/);
  const duplicateRead = saved();
  duplicateRead.readReplyIds.push("lily-4");
  assert.throws(() => parse(duplicateRead), /invalid or duplicate/);
});

test("draft reply links require an existing, delivered page by the other participant in the same album", () => {
  for (const replyTo of ["missing-parent", "sam-1", "lily-3"]) {
    const data = saved();
    data.drafts["alex:lily"].replyTo = replyTo;
    assert.throws(() => parse(data), /invalid or duplicate/, replyTo);
  }
  const notDelivered = saved();
  notDelivered.pages.find((p) => p.id === "lily-4")!.status = "sent";
  assert.throws(() => parse(notDelivered), /invalid or duplicate/);
  const wrongParticipant = saved();
  wrongParticipant.drafts["maya:lily"] = { title: "", text: "Wrong album" };
  assert.throws(() => parse(wrongParticipant), /invalid or duplicate/);
});

test("published reply links also reject orphan, self-authored and cross-album relationships", () => {
  for (const replyTo of ["missing-parent", "sam-3", "lily-3"]) {
    const data = saved();
    data.pages.find((p) => p.id === "lily-2")!.replyTo = replyTo;
    assert.throws(() => parse(data), /invalid or duplicate/, replyTo);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  addContribution,
  advanceDelivery,
  createAlbum,
  createInitialData,
  isLocalPhoto,
  formatDate,
  getReplyNotifications,
  getAlbums,
  getPeople,
  DEFAULT_ALBUM_COVER,
  getStatusLabel,
  hasCrisisLanguage,
  weekKey,
  MAX_CUSTOM_ALBUMS,
  type AppData,
  type Contribution,
  type PageDesign,
} from "./model";

const now = new Date("2026-11-14T15:00:00Z");
const empty = (): AppData => ({
  version: 1,
  pages: [],
  drafts: {},
  checkIns: [],
  readReplyIds: [],
});

test("adding an album creates an empty persistent book with bounded title and existing companion materials", () => {
  const original = empty();
  const data = createAlbum(
    original,
    { personId: "lily", title: "  Growing together  " },
    "album-garden",
  );
  const book = getAlbums(data).find((item) => item.id === "album-garden")!;
  assert.equal(book.title, "Growing together");
  assert.equal(book.personId, "lily");
  assert.equal(book.cover, "/images/stories/lily-expedition.jpg");
  assert.equal(book.accent, "amber");
  assert.equal(getAlbums(data).length, 8);
  assert.deepEqual(data.pages, []);
  assert.equal(Object.hasOwn(original, "customAlbums"), false);
  assert.throws(
    () =>
      createAlbum(data, { personId: "lily", title: "Same ID" }, "album-garden"),
    /try again/,
  );
  for (const title of ["", "   ", "x".repeat(71), "Two\nlines"])
    assert.throws(
      () => createAlbum(original, { personId: "lily", title }),
      /name between/,
    );
  for (const personId of ["alex", "unknown"])
    assert.throws(
      () => createAlbum(original, { personId, title: "A book" }),
      /existing circle/,
    );
  assert.throws(
    () =>
      createAlbum(original, { personId: "lily", title: "A book" }, "alex:lily"),
    /try again/,
  );
  let full = original;
  for (let i = 0; i < MAX_CUSTOM_ALBUMS; i++)
    full = createAlbum(
      full,
      { personId: "lily", title: `Book ${i + 1}` },
      `album-${i}`,
    );
  assert.throws(
    () => createAlbum(full, { personId: "lily", title: "One more" }),
    /48 added albums/,
  );
});

test("an album can atomically add a new loved one and a compressed cover, then receive a reply from them", () => {
  const original = empty();
  const cover = "data:image/jpeg;base64,/9j/2Q==";
  let data = createAlbum(
    original,
    { title: "A place for us", newPersonName: "  Eva Chen  ", cover },
    "album-eva",
  );
  const eva = getPeople(data).find((item) => item.name === "Eva Chen")!;
  assert.equal(eva.id, "person-eva");
  assert.equal(eva.initials, "EC");
  assert.equal(data.customAlbums![0].personId, eva.id);
  assert.equal(data.customAlbums![0].cover, cover);
  assert.deepEqual(data.pages, []);
  assert.equal(original.customPeople, undefined);
  data = addContribution(
    data,
    {
      albumId: "album-eva",
      authorId: "alex",
      title: "From here",
      text: "Our little corner.",
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
  const parent = data.pages[0];
  data = addContribution(
    data,
    {
      albumId: "album-eva",
      authorId: eva.id,
      title: "From Earth",
      text: "A corner for both of us.",
      replyTo: parent.id,
    },
    new Date(now.getTime() + 20_000),
  );
  data = {
    ...data,
    pages: advanceDelivery(
      advanceDelivery(data.pages, true, new Date(now.getTime() + 20_000)),
      true,
      new Date(now.getTime() + 32_000),
    ),
  };
  assert.equal(getReplyNotifications(data, "alex")[0].authorId, eva.id);
  assert.equal(data.pages[0].status, "answered");
  const second = createAlbum(
    data,
    { title: "Our next chapter", personId: eva.id },
    "album-eva-next",
  );
  assert.equal(second.customPeople?.length, 1);
  assert.equal(second.customAlbums![1].cover, DEFAULT_ALBUM_COVER);
});

test("invalid or ambiguous new people and unsafe covers never partially create an album", () => {
  const data = empty();
  for (const name of ["", "   ", "x".repeat(61), "Two\nlines"])
    assert.throws(
      () => createAlbum(data, { title: "Our book", newPersonName: name }),
      /name between/,
    );
  assert.throws(
    () => createAlbum(data, { title: "Our book", newPersonName: "aLeX" }),
    /already in your circle/,
  );
  assert.throws(
    () =>
      createAlbum(data, {
        title: "Our book",
        personId: "lily",
        newPersonName: "Eva",
      }),
    /or add someone/,
  );
  for (const cover of [
    "https://example.com/photo.jpg",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "data:image/jpeg;base64,",
    "data:image/jpeg;base64,AAAA=",
    "/images/unknown.jpg",
    "data:image/jpeg;base64," + "A".repeat(500000),
  ])
    assert.throws(
      () =>
        createAlbum(data, { title: "Our book", newPersonName: "Eva", cover }),
      /cover photo button/,
    );
  assert.equal(data.customPeople, undefined);
  assert.equal(data.customAlbums, undefined);
});

test("custom albums preserve participant and reply boundaries throughout simulated delivery", () => {
  let data = createAlbum(
    empty(),
    { personId: "lily", title: "Our garden" },
    "album-garden",
  );
  data = createAlbum(
    data,
    { personId: "lily", title: "Our sketches" },
    "album-sketches",
  );
  const input = {
    albumId: "album-garden",
    authorId: "alex",
    title: "A new leaf",
    text: "We can keep watching it grow.",
  };
  data = addContribution(data, input, now);
  data = {
    ...data,
    pages: advanceDelivery(
      advanceDelivery(data.pages, true, now),
      true,
      new Date(now.getTime() + 12_000),
    ),
  };
  const parent = data.pages[0];
  assert.equal(parent.status, "delivered");
  assert.throws(
    () => addContribution(data, { ...input, authorId: "maya" }),
    /participant/,
  );
  assert.throws(
    () =>
      addContribution(data, {
        ...input,
        albumId: "album-sketches",
        authorId: "lily",
        replyTo: parent.id,
      }),
    /other participant/,
  );
  const replied = addContribution(
    data,
    {
      ...input,
      authorId: "lily",
      text: "It has two leaves now!",
      replyTo: parent.id,
    },
    new Date(now.getTime() + 20_000),
  );
  const sent = advanceDelivery(
    replied.pages,
    true,
    new Date(now.getTime() + 20_000),
  );
  const delivered = advanceDelivery(
    sent,
    true,
    new Date(now.getTime() + 32_000),
  );
  assert.equal(delivered[0].status, "answered");
  assert.equal(
    getReplyNotifications({ ...replied, pages: delivered }, "alex")[0].authorId,
    "lily",
  );
  assert.equal(data.customAlbums?.length, 2);
});
const page = (extra: Partial<Contribution> = {}): Contribution => ({
  id: "original",
  albumId: "lily",
  authorId: "alex",
  title: "A moment",
  text: "Hello",
  createdAt: now.toISOString(),
  status: "recorded",
  ...extra,
});

test("a recorded page survives an interruption and resumes sending on reconnection", () => {
  const pages = [page()];
  assert.equal(advanceDelivery(pages, false, now), pages);
  const sent = advanceDelivery(pages, true, now);
  assert.equal(sent[0].status, "sent");
  assert.equal(sent[0].sentAt, now.toISOString());
  const interrupted = advanceDelivery(
    sent,
    false,
    new Date(now.getTime() + 60_000),
  );
  assert.equal(interrupted[0].status, "sent");
  const delivered = advanceDelivery(
    interrupted,
    true,
    new Date(now.getTime() + 60_000),
  );
  assert.equal(delivered[0].status, "delivered");
  assert.equal(
    pages[0].status,
    "recorded",
    "the reducer does not mutate its input",
  );
});

test("a page cannot skip the simulated transit delay or receive an invented reply", () => {
  const sent = advanceDelivery([page()], true, now);
  assert.equal(
    advanceDelivery(sent, true, new Date(now.getTime() + 11_999))[0].status,
    "sent",
  );
  const delivered = advanceDelivery(
    sent,
    true,
    new Date(now.getTime() + 12_000),
  );
  assert.equal(delivered[0].status, "delivered");
  assert.equal(
    advanceDelivery(delivered, true, new Date(now.getTime() + 86_400_000))[0]
      .status,
    "delivered",
  );
});

test("a parent is answered only after a real reply is delivered, and the result reaches its author", () => {
  const data = {
    ...empty(),
    pages: [page({ status: "delivered", deliveredAt: now.toISOString() })],
  };
  const withReply = addContribution(
    data,
    {
      albumId: "lily",
      authorId: "lily",
      title: "Back from Earth",
      text: "I saw it too!",
      replyTo: "original",
    },
    now,
  );
  assert.equal(withReply.pages[0].status, "delivered");
  assert.equal(getReplyNotifications(withReply, "alex").length, 0);
  const sent = advanceDelivery(withReply.pages, true, now);
  assert.equal(sent[0].status, "delivered");
  const delivered = advanceDelivery(
    sent,
    true,
    new Date(now.getTime() + 12_000),
  );
  assert.equal(delivered[0].status, "answered");
  assert.equal(
    delivered[0].answeredAt,
    new Date(now.getTime() + 12_000).toISOString(),
  );
  const received = { ...withReply, pages: delivered };
  const notifications = getReplyNotifications(received, "alex");
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].authorId, "lily");
  assert.equal(getReplyNotifications(received, "lily").length, 0);
  assert.equal(
    getReplyNotifications(
      { ...received, readReplyIds: [notifications[0].id] },
      "alex",
    ).length,
    0,
  );
});

test("same-author and cross-album replies cannot mark a page answered", () => {
  const parent = page({ status: "delivered" });
  const invalid = [
    parent,
    page({ id: "self", replyTo: parent.id, status: "delivered" }),
    page({
      id: "cross",
      albumId: "sam",
      authorId: "sam",
      replyTo: parent.id,
      status: "delivered",
    }),
  ];
  assert.equal(advanceDelivery(invalid, true, now)[0].status, "delivered");
  assert.throws(
    () =>
      addContribution(
        { ...empty(), pages: [parent] },
        {
          albumId: "lily",
          authorId: "alex",
          title: "Self",
          text: "Text",
          replyTo: parent.id,
        },
        now,
      ),
    /other participant/,
  );
});

test("new pages are always recorded, validate their album, and sort chronologically", () => {
  const data = {
    ...empty(),
    pages: [page({ createdAt: "2026-11-15T12:00:00Z" })],
  };
  const next = addContribution(
    data,
    {
      albumId: "lily",
      authorId: "alex",
      title: "  Hello  ",
      text: "  From orbit  ",
    },
    now,
  );
  assert.equal(next.pages[0].title, "Hello");
  assert.equal(next.pages[0].text, "From orbit");
  assert.equal(next.pages[0].status, "recorded");
  assert.equal(data.pages.length, 1);
  assert.throws(
    () =>
      addContribution(empty(), {
        albumId: "lily",
        authorId: "maya",
        title: "",
        text: "Hello",
      }),
    /participant/,
  );
  assert.throws(
    () =>
      addContribution(empty(), {
        albumId: "lily",
        authorId: "alex",
        title: "",
        text: "  ",
      }),
    /few words/,
  );
});

test("publishing preserves a design independently from subsequent draft edits", () => {
  const design: PageDesign = {
    layout: "classic",
    tape: "linen",
    photoTilt: 2,
    stickers: [
      { id: "moon-1", kind: "moon", x: 80, y: 20, rotation: -15, scale: 1 },
    ],
  };
  const next = addContribution(
    empty(),
    {
      albumId: "lily",
      authorId: "alex",
      title: "Under the same moon",
      text: "Thinking of you.",
      design,
    },
    now,
  );
  assert.deepEqual(next.pages[0].design, design);
  design.stickers[0].x = 10;
  design.stickers.push({
    id: "star-1",
    kind: "star",
    x: 25,
    y: 30,
    rotation: 0,
    scale: 1,
  });
  design.tape = "midnight";
  assert.equal(next.pages[0].design!.stickers[0].x, 80);
  assert.equal(next.pages[0].design!.stickers.length, 1);
  assert.equal(next.pages[0].design!.tape, "linen");
});

test("publishing rejects non-finite and malformed design coordinates before creating a page", () => {
  const data = empty();
  assert.throws(
    () =>
      addContribution(data, {
        albumId: "lily",
        authorId: "alex",
        title: "Hello",
        text: "A moment",
        design: {
          layout: "classic",
          tape: "sage",
          photoTilt: 0,
          stickers: [
            {
              id: "star",
              kind: "star",
              x: Number.NaN,
              y: 25,
              rotation: 0,
              scale: 1,
            },
          ],
        },
      }),
    /page design could not be saved/,
  );
  assert.equal(data.pages.length, 0);
});

test("weekly check-in keys use Monday in UTC, including a year boundary", () => {
  assert.equal(weekKey(new Date("2027-01-01T00:00:00Z")), "2026-12-28");
  assert.equal(weekKey(new Date("2027-01-03T23:59:59Z")), "2026-12-28");
  assert.equal(weekKey(new Date("2027-01-04T00:00:00Z")), "2027-01-04");
  assert.equal(weekKey(new Date("2026-11-15T23:00:00-03:00")), "2026-11-16");
});

test("dates always include day, month and year, in UTC", () => {
  assert.equal(formatDate("2026-11-14T23:30:00-03:00"), "15 November 2026");
  assert.equal(formatDate("invalid"), "Date unavailable");
  assert.equal(getStatusLabel("answered"), "Answered");
});

test("crisis cues surface support in English and Portuguese without treating activity as a score", () => {
  for (const text of [
    "I don't want to be here anymore",
    "I want to die",
    "I’m thinking about suicide",
    "I might hurt myself",
    "I can't keep myself safe",
    "Não quero mais viver",
    "Eu quero me matar",
    "Estou pensando em suicídio",
    "Quero acabar com a minha vida",
  ])
    assert.equal(hasCrisisLanguage(text), true, text);
  for (const text of [
    "Let's kill time with a story",
    "I miss home",
    "I sent no messages this week",
    "The plant is still here.",
  ])
    assert.equal(hasCrisisLanguage(text), false, text);
});

test("the initial albums contain chronological pages, an incoming result, and no fabricated transit state", () => {
  const data = createInitialData(now);
  assert.equal(data.pages.length, 6 + 4 + 5 + 6 + 6 + 4 + 4);
  assert.deepEqual(data.readReplyIds, []);
  assert.deepEqual(
    new Set(getReplyNotifications(data, "alex").map((page) => page.id)),
    new Set([
      "sam-4",
      "sam-5",
      "maya-3",
      "june-3",
      "june-5",
      "lily-5",
      "lily-4",
      "gui-3",
      "gui-5",
      "rosa-3",
      "theo-3",
    ]),
  );
  assert.ok(
    data.pages.every(
      (page) => page.status === "answered" || page.status === "delivered",
    ),
  );
  assert.ok(
    data.pages
      .filter((page) => page.authorId === "alex")
      .every((page) => page.replyTo),
  );
  assert.deepEqual(
    data.pages.map((p) => p.createdAt),
    [...data.pages.map((p) => p.createdAt)].sort(),
  );
});

test("the four revised albums tell complete alternating stories with distinct approved photographs", () => {
  const data = createInitialData(now);
  const expected = [
    [
      "sam",
      6,
      "The midnight supper club",
      "/images/stories/sam-supper.jpg",
      "/images/stories/sam-menu.jpg",
      "/images/stories/alex-space-meal.jpg",
    ],
    [
      "maya",
      4,
      "The lighthouse mystery",
      "/images/stories/maya-lighthouse.jpg",
      "/images/stories/maya-capsule.jpg",
    ],
    [
      "june",
      5,
      "One night at the picture house",
      "/images/stories/june-cinema.jpg",
      "/images/stories/june-film.jpg",
    ],
    [
      "lily",
      6,
      "The firefly expedition",
      "/images/stories/lily-expedition.jpg",
      "/images/stories/lily-lanterns.jpg",
    ],
  ] as const;
  for (const [albumId, count, title, ...photos] of expected) {
    const album = getAlbums(data).find((item) => item.id === albumId)!;
    assert.equal(album.title, title);
    assert.equal(album.cover, photos[0]);
    const pages = data.pages.filter((page) => page.albumId === albumId);
    assert.equal(pages.length, count);
    assert.equal(pages[0].authorId, albumId);
    assert.deepEqual(
      new Set(pages.flatMap((page) => (page.photo ? [page.photo] : []))),
      new Set(photos),
    );
    assert.ok(pages.filter((page) => page.authorId === "alex").length >= 2);
    for (let index = 1; index < pages.length; index++) {
      assert.equal(pages[index].replyTo, pages[index - 1].id);
      assert.notEqual(pages[index].authorId, pages[index - 1].authorId);
      assert.equal(pages[index - 1].status, "answered");
      assert.equal(pages[index - 1].answeredAt, pages[index].deliveredAt);
      assert.ok(
        Date.parse(pages[index].createdAt) >
          Date.parse(pages[index - 1].createdAt),
      );
    }
    assert.equal(pages.at(-1)!.status, "delivered");
  }
});

test("the photo allowlist accepts the nine story assets while retaining historical local photos", () => {
  for (const name of [
    "sam-supper",
    "sam-menu",
    "alex-space-meal",
    "maya-lighthouse",
    "maya-capsule",
    "june-cinema",
    "june-film",
    "lily-expedition",
    "lily-lanterns",
  ])
    assert.equal(isLocalPhoto(`/images/stories/${name}.jpg`), true);
  for (const path of [
    "/images/sam.jpg",
    "/images/lily.jpg",
    "/images/maya.jpg",
    "/images/june.jpg",
  ])
    assert.equal(isLocalPhoto(path), true);
  for (const path of [
    "/images/stories/unknown.jpg",
    "/images/stories/sam-supper.png",
    "/images/stories/sam-supper.jpg?tracking=1",
    "/images/stories/../sam.jpg",
    "https://example.com/images/stories/sam-supper.jpg",
  ])
    assert.equal(isLocalPhoto(path), false);
});

test("three new authored albums contain complete chronological exchanges with exact reply results", () => {
  const data = createInitialData(now);
  assert.equal(getAlbums(data).length, 7);
  for (const [albumId, count] of [
    ["gui", 6],
    ["rosa", 4],
    ["theo", 4],
  ] as const) {
    const pages = data.pages.filter((page) => page.albumId === albumId);
    assert.equal(pages.length, count);
    assert.equal(pages[0].authorId, albumId);
    assert.equal(pages.at(-1)!.authorId, "alex");
    for (let index = 1; index < pages.length; index++) {
      assert.equal(pages[index].replyTo, pages[index - 1].id);
      assert.notEqual(pages[index].authorId, pages[index - 1].authorId);
      assert.equal(pages[index - 1].status, "answered");
      assert.equal(pages[index - 1].answeredAt, pages[index].deliveredAt);
      assert.ok(
        Date.parse(pages[index].createdAt) >
          Date.parse(pages[index - 1].createdAt),
      );
    }
  }
  const gui = getPeople(data).find((person) => person.id === "gui")!;
  assert.match(gui.role, /Son.*10/);
  assert.match(
    data.pages.find((page) => page.id === "gui-1")!.text,
    /school.*rocket olympiad/,
  );
});

import { clonePageDesign, isPageDesign, type PageDesign } from "./scrapbook";
export type { PageDesign, PageSticker, StickerKind } from "./scrapbook";

/** Local demonstration data and transport. No timer ever invents a human reply. */
export type Person = {
  id: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  color: string;
};

export type Album = {
  id: string;
  personId: string;
  title: string;
  subtitle: string;
  cover: string;
  accent: string;
};

export type ContributionStatus = "recorded" | "sent" | "delivered" | "answered";
export type Contribution = {
  id: string;
  albumId: string;
  authorId: string;
  title: string;
  text: string;
  photo?: string;
  design?: PageDesign;
  createdAt: string;
  status: ContributionStatus;
  sentAt?: string;
  deliveredAt?: string;
  answeredAt?: string;
  replyTo?: string;
};

export type Draft = {
  title: string;
  text: string;
  photo?: string;
  design?: PageDesign;
  replyTo?: string;
};
export type CheckIn = {
  id: string;
  profileId: string;
  week: string;
  createdAt: string;
  connection: number;
  loneliness: number;
  support: number;
  note: string;
};
export type AppData = {
  version: 1;
  customAlbums?: Album[];
  customPeople?: Person[];
  demoStoriesVersion?: 1;
  classicStoriesVersion?: 1;
  pages: Contribution[];
  drafts: Record<string, Draft>;
  checkIns: CheckIn[];
  readReplyIds: string[];
};

export const PEOPLE: Person[] = [
  {
    id: "alex",
    name: "Alex",
    role: "Astronaut",
    location: "On the way to Mars",
    initials: "AL",
    color: "sage",
  },
  {
    id: "lily",
    name: "Lily",
    role: "Daughter",
    location: "Home on Earth",
    initials: "LI",
    color: "amber",
  },
  {
    id: "sam",
    name: "Sam",
    role: "Partner",
    location: "Home on Earth",
    initials: "SA",
    color: "sage",
  },
  {
    id: "maya",
    name: "Maya",
    role: "Friend",
    location: "Home on Earth",
    initials: "MA",
    color: "terracotta",
  },
  {
    id: "june",
    name: "June",
    role: "Mom & caregiver",
    location: "Home on Earth",
    initials: "JU",
    color: "blue",
  },
  {
    id: "gui",
    name: "Gui",
    role: "Son · Age 10",
    location: "Home on Earth",
    initials: "GU",
    color: "blue",
  },
  {
    id: "rosa",
    name: "Rosa",
    role: "Grandmother",
    location: "Home on Earth",
    initials: "RO",
    color: "terracotta",
  },
  {
    id: "theo",
    name: "Theo",
    role: "Friend",
    location: "Home on Earth",
    initials: "TH",
    color: "sage",
  },
];

export const ALBUMS: Album[] = [
  {
    id: "lily",
    personId: "lily",
    title: "The firefly expedition",
    subtitle: "With Lily · Daughter",
    cover: "/images/stories/lily-expedition.jpg",
    accent: "amber",
  },
  {
    id: "sam",
    personId: "sam",
    title: "The midnight supper club",
    subtitle: "With Sam · Partner",
    cover: "/images/stories/sam-supper.jpg",
    accent: "sage",
  },
  {
    id: "maya",
    personId: "maya",
    title: "The lighthouse mystery",
    subtitle: "With Maya · Friend",
    cover: "/images/stories/maya-lighthouse.jpg",
    accent: "terracotta",
  },
  {
    id: "june",
    personId: "june",
    title: "One night at the picture house",
    subtitle: "With June · Mom & caregiver",
    cover: "/images/stories/june-cinema.jpg",
    accent: "blue",
  },
  {
    id: "gui",
    personId: "gui",
    title: "Mission: schoolyard stars",
    subtitle: "With Gui · Son · Age 10",
    cover: "/images/gui.jpg",
    accent: "blue",
  },
  {
    id: "rosa",
    personId: "rosa",
    title: "A recipe for coming home",
    subtitle: "With Rosa · Grandmother",
    cover: "/images/rosa.jpg",
    accent: "terracotta",
  },
  {
    id: "theo",
    personId: "theo",
    title: "The song we never finished",
    subtitle: "With Theo · Friend",
    cover: "/images/theo.jpg",
    accent: "sage",
  },
];

export const MAX_CUSTOM_ALBUMS = 48;
export const MAX_ALBUM_TITLE_LENGTH = 70;
export const MAX_CUSTOM_PEOPLE = 48;
export const MAX_PERSON_NAME_LENGTH = 60;
export const DEFAULT_ALBUM_COVER = "/images/blank-album.jpg";
const colors = ["sage", "amber", "terracotta", "blue"];

const customAlbumId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^album-[A-Za-z0-9][A-Za-z0-9-]{0,85}$/.test(value);
const albumTitle = (value: unknown): value is string =>
  typeof value === "string" &&
  value === value.trim() &&
  value.length > 0 &&
  value.length <= MAX_ALBUM_TITLE_LENGTH &&
  !/[\u0000-\u001f\u007f]/.test(value);

const personName = (value: unknown): value is string =>
  typeof value === "string" &&
  value === value.trim() &&
  value.length > 0 &&
  value.length <= MAX_PERSON_NAME_LENGTH &&
  !/[\u0000-\u001f\u007f]/.test(value);
const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase();

/** Covers and page photos stay local: allow bundled JPEGs or a bounded re-encoded upload. */
export function isLocalPhoto(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length < 500000 &&
    ((/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    ) &&
      value.length > 23) ||
      /^\/images\/(lily|sam|maya|june|gui|rosa|theo|blank-album)\.jpg$/.test(
        value,
      ) ||
      /^\/images\/stories\/(sam-supper|sam-menu|alex-space-meal|maya-lighthouse|maya-capsule|june-cinema|june-film|lily-expedition|lily-lanterns)\.jpg$/.test(
        value,
      ))
  );
}

export function isCustomPerson(value: unknown): value is Person {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    /^person-[A-Za-z0-9][A-Za-z0-9-]{0,85}$/.test(record.id) &&
    personName(record.name) &&
    record.initials === initialsFor(record.name) &&
    record.role === "Loved one" &&
    record.location === "Home on Earth" &&
    colors.includes(record.color as string)
  );
}

export function getPeople(data: Pick<AppData, "customPeople">): Person[] {
  return [...PEOPLE, ...(data.customPeople ?? [])];
}

/** Validate custom books against their actual participant, including a newly added loved one. */
export function isCustomAlbum(
  value: unknown,
  people: Person[] = PEOPLE,
): value is Album {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const companion = people.find(
    (item) => item.id === record.personId && item.id !== "alex",
  );
  return (
    !!companion &&
    customAlbumId(record.id) &&
    albumTitle(record.title) &&
    isLocalPhoto(record.cover) &&
    record.accent === companion.color &&
    record.subtitle === `With ${companion.name} · ${companion.role}`
  );
}

export function getAlbums(data: Pick<AppData, "customAlbums">): Album[] {
  return [...ALBUMS, ...(data.customAlbums ?? [])];
}

/** Add an empty shared album and, optionally, its new local-demo participant atomically. */
export function createAlbum(
  data: AppData,
  input: {
    title: string;
    personId?: string;
    newPersonName?: string;
    cover?: string;
  },
  id = `album-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
): AppData {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!albumTitle(title))
    throw new Error(
      `Give this album a name between 1 and ${MAX_ALBUM_TITLE_LENGTH} characters.`,
    );
  if (!customAlbumId(id) || getAlbums(data).some((item) => item.id === id))
    throw new Error("This album could not be added. Please try again.");
  if ((data.customAlbums?.length ?? 0) >= MAX_CUSTOM_ALBUMS)
    throw new Error(
      `Your bookshelf can hold up to ${MAX_CUSTOM_ALBUMS} added albums.`,
    );
  const people = getPeople(data);
  let companion = people.find(
    (item) => item.id === input.personId && item.id !== "alex",
  );
  let customPeople = data.customPeople;
  if (input.newPersonName !== undefined) {
    if (input.personId) throw new Error("Choose a person or add someone new.");
    const name =
      typeof input.newPersonName === "string" ? input.newPersonName.trim() : "";
    if (!personName(name))
      throw new Error(
        `Enter a name between 1 and ${MAX_PERSON_NAME_LENGTH} characters.`,
      );
    if (
      people.some(
        (item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      throw new Error(
        "Someone with this name is already in your circle. Choose them from the list.",
      );
    if ((customPeople?.length ?? 0) >= MAX_CUSTOM_PEOPLE)
      throw new Error("Your circle can hold up to 48 added people.");
    const personId = `person-${id.slice(6)}`;
    if (people.some((item) => item.id === personId))
      throw new Error("This person could not be added. Please try again.");
    companion = {
      id: personId,
      name,
      initials: initialsFor(name),
      role: "Loved one",
      location: "Home on Earth",
      color: colors[(customPeople?.length ?? 0) % colors.length],
    };
    customPeople = [...(customPeople ?? []), companion];
  }
  if (!companion)
    throw new Error(
      "Choose someone from your existing circle or add a new person.",
    );
  const template = ALBUMS.find((item) => item.personId === companion!.id);
  const cover = input.cover ?? template?.cover ?? DEFAULT_ALBUM_COVER;
  if (!isLocalPhoto(cover))
    throw new Error(
      "Choose a JPEG, PNG, or WebP photo using the cover photo button.",
    );
  const album: Album = {
    id,
    title,
    personId: companion.id,
    subtitle: `With ${companion.name} · ${companion.role}`,
    cover,
    accent: companion.color,
  };
  return {
    ...data,
    ...(customPeople ? { customPeople } : {}),
    customAlbums: [...(data.customAlbums ?? []), album],
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Dates are expressed in UTC so a page keeps its calendar date in every location. */
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormatter.format(date);
}

/** A week is identified by the ISO date of its Monday, in UTC. */
export function weekKey(date: Date): string {
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function getStatusLabel(status: ContributionStatus): string {
  return {
    recorded: "Recorded",
    sent: "Sent",
    delivered: "Delivered",
    answered: "Answered",
  }[status];
}

function chronological(pages: Contribution[]): Contribution[] {
  return [...pages].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}

/**
 * Explicitly simulated transport: recorded -> sent -> delivered, with interruptions.
 * Answered requires an actual delivered reply from the other participant.
 * Returning the original array when unchanged avoids unnecessary browser writes.
 */
export function advanceDelivery(
  pages: Contribution[],
  online: boolean,
  now: Date,
  delayMs = 12_000,
): Contribution[] {
  if (!online) return pages;
  const timestamp = now.toISOString();
  let changed = false;
  let next = pages.map((page): Contribution => {
    if (page.status === "recorded") {
      changed = true;
      return { ...page, status: "sent", sentAt: timestamp };
    }
    if (page.status === "sent") {
      if (!page.sentAt) {
        changed = true;
        return { ...page, sentAt: timestamp };
      }
      if (now.getTime() - Date.parse(page.sentAt) >= Math.max(0, delayMs)) {
        changed = true;
        return { ...page, status: "delivered", deliveredAt: timestamp };
      }
    }
    return page;
  });
  const answeredBy = new Map<string, string>();
  for (const reply of next) {
    if (
      !reply.replyTo ||
      (reply.status !== "delivered" && reply.status !== "answered")
    )
      continue;
    const parent = next.find((page) => page.id === reply.replyTo);
    if (
      !parent ||
      parent.albumId !== reply.albumId ||
      parent.authorId === reply.authorId
    )
      continue;
    if (parent.status !== "delivered" && parent.status !== "answered") continue;
    const deliveredAt = reply.deliveredAt ?? timestamp;
    const previous = answeredBy.get(parent.id);
    if (!previous || Date.parse(deliveredAt) < Date.parse(previous))
      answeredBy.set(parent.id, deliveredAt);
  }
  next = next.map((page): Contribution => {
    const answeredAt = answeredBy.get(page.id);
    if (!answeredAt || page.status === "answered") return page;
    changed = true;
    return { ...page, status: "answered", answeredAt };
  });
  return changed ? next : pages;
}

export type NewContribution = Pick<
  Contribution,
  "albumId" | "authorId" | "title" | "text" | "photo" | "replyTo" | "design"
>;

export function addContribution(
  data: AppData,
  input: NewContribution,
  now = new Date(),
): AppData {
  const album = getAlbums(data).find((item) => item.id === input.albumId);
  if (
    !album ||
    !getPeople(data).some((person) => person.id === input.authorId) ||
    (input.authorId !== "alex" && input.authorId !== album.personId)
  ) {
    throw new Error("This person is not a participant in this album.");
  }
  if (!input.text.trim() && !input.photo)
    throw new Error("Add a few words or a photo to your page.");
  if (input.design !== undefined && !isPageDesign(input.design))
    throw new Error(
      "This page design could not be saved. Please adjust its decorations.",
    );
  if (input.replyTo) {
    const parent = data.pages.find((page) => page.id === input.replyTo);
    if (
      !parent ||
      parent.albumId !== input.albumId ||
      parent.authorId === input.authorId ||
      (parent.status !== "delivered" && parent.status !== "answered")
    ) {
      throw new Error(
        "A reply must refer to a delivered page from the other participant.",
      );
    }
  }
  const page: Contribution = {
    ...input,
    ...(input.design ? { design: clonePageDesign(input.design) } : {}),
    id:
      globalThis.crypto?.randomUUID?.() ??
      `page-${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    title: input.title.trim() || "A little moment",
    text: input.text.trim(),
    createdAt: now.toISOString(),
    status: "recorded",
  };
  return { ...data, pages: chronological([...data.pages, page]) };
}

/** The result of one's own page is the other person's delivered response. */
export function getReplyNotifications(
  data: AppData,
  profileId: string,
): Contribution[] {
  return chronological(
    data.pages.filter((reply) => {
      if (
        !reply.replyTo ||
        reply.authorId === profileId ||
        data.readReplyIds.includes(reply.id)
      )
        return false;
      if (reply.status !== "delivered" && reply.status !== "answered")
        return false;
      const parent = data.pages.find((page) => page.id === reply.replyTo);
      return parent?.authorId === profileId && parent.albumId === reply.albumId;
    }),
  );
}

/**
 * Conservative phrase matching for a nonblocking support panel, never a diagnosis.
 * It cannot establish intent, reliably understand negation, or replace human support.
 */
export function hasCrisisLanguage(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
  const patterns = [
    /\b(kill|hurt|harm)\s+myself\b/,
    /\b(end|take)\s+my\s+(own\s+)?life\b/,
    /\b(want|wish|ready|planning|plan|going)\s+to\s+die\b/,
    /\bi\s+wish\s+i\s+(was|were)\s+dead\b/,
    /\b(don't|do not|dont)\s+want\s+to\s+(live|be alive|wake up|be here)\b/,
    /\b(can't|cannot|cant)\s+(go on|keep myself safe)\b/,
    /\b(suicidal|suicide|self[- ]harm)\b/,
    /\b(quero|vou|planejo|penso em)\s+(me\s+)?(matar|morrer|suicidar)\b/,
    /\b(acabar|terminar)\s+com\s+(a\s+)?minha\s+vida\b/,
    /\bnao\s+quero\s+(mais\s+)?(viver|estar aqui|acordar)\b/,
    /\b(me\s+(machucar|ferir)|suicidio|suicida|automutilacao)\b/,
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

/** Authored example chapters, not replies fabricated by the delivery simulator. */
export function createNewStoryPages(now: Date): Contribution[] {
  const at = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  const page = (
    id: string,
    albumId: string,
    authorId: string,
    hoursAgo: number,
    title: string,
    text: string,
    extra: Partial<Contribution> = {},
  ): Contribution => ({
    id,
    albumId,
    authorId,
    title,
    text,
    createdAt: at(hoursAgo),
    status: "delivered",
    sentAt: at(hoursAgo - 0.05),
    deliveredAt: at(hoursAgo - 0.25),
    ...extra,
  });
  const decoration = (
    kind: "rocket" | "flower" | "moon",
    tape: PageDesign["tape"],
  ): PageDesign => ({
    layout: "classic",
    tape,
    photoTilt: -2,
    stickers: [
      { id: `${kind}-keepsake`, kind, x: 85, y: 81, rotation: -9, scale: 0.9 },
    ],
  });
  const pages = [
    page(
      "gui-1",
      "gui",
      "gui",
      336,
      "Dad, will you be my engineer?",
      "Our school is entering a rocket olympiad! Ms. Morgan says we can start with little paper rockets and straws. I drew mine with three blue fins. You know how real rockets work. Could we make a team, even with you all the way up there?",
      { photo: "/images/gui.jpg", design: decoration("rocket", "midnight") },
    ),
    page(
      "gui-2",
      "gui",
      "alex",
      312,
      "Team Gui, reporting for duty",
      "Absolutely, son. First engineering tip: draw before you build. Make the fins the same size and space them evenly; that helps a rocket fly straight. Have your teacher check the model and use the school's launch area. Send your sketch when you can. I have a page in my notebook just for our team.",
      { replyTo: "gui-1", design: decoration("rocket", "linen") },
    ),
    page(
      "rosa-1",
      "rosa",
      "rosa",
      300,
      "The flour fingerprint",
      "I found your little handprint in my old recipe book. You were supposed to be helping with the bread; mostly you were covering the kitchen in flour. This morning I made that loaf again. The first slice is still the cook's reward. I wish I could tuck one into this album.",
      { photo: "/images/rosa.jpg", design: decoration("flower", "linen") },
    ),
    page(
      "theo-1",
      "theo",
      "theo",
      288,
      "Found: one unfinished song",
      "I opened the guitar case and found our café napkin, with half a song written beside a coffee ring. Remember? We never agreed on the last line. I played the first few chords tonight. The house sounded a little more like our old apartment.",
      { photo: "/images/theo.jpg", design: decoration("moon", "sage") },
    ),
    page(
      "gui-3",
      "gui",
      "gui",
      264,
      "It flew sideways. Very confidently.",
      "We tried it at school today. Mine made a big left turn! I wrote down three tries like you do in your notebook. Ms. Morgan noticed one fin was bent. I wanted to start over, but I thought you might want to see the wonky version too.",
      { replyTo: "gui-2", design: decoration("rocket", "sage") },
    ),
    page(
      "rosa-2",
      "rosa",
      "alex",
      252,
      "A kitchen, carried with me",
      "I remember the warm tea towel over the dough. I copied your recipe into my mission notebook, including the bit that says 'until it feels right.' What does right feel like? Give me the words you would use if I were standing beside you, stealing the first slice.",
      { replyTo: "rosa-1", design: decoration("flower", "sage") },
    ),
    page(
      "theo-2",
      "theo",
      "alex",
      228,
      "Keep the coffee ring",
      "I remember us trying to rhyme 'Saturday' with everything in the room. What if the last line is 'leave a little light for me'? I tapped the old rhythm against my sleeping bag tonight. Send the next verse as words. I can hear your terrible guitar face from here.",
      { replyTo: "theo-1", design: decoration("moon", "midnight") },
    ),
    page(
      "gui-4",
      "gui",
      "alex",
      216,
      "The wonky version belongs here",
      "Keep that page, Gui. Engineers learn from the flights that surprise them. Try one change at a time: straighten that fin, then repeat the same teacher-approved test. Compare your notes. A careful question matters more than the longest flight. I'm proud you showed me the part that didn't work.",
      { replyTo: "gui-3", design: decoration("rocket", "linen") },
    ),
    page(
      "rosa-3",
      "rosa",
      "rosa",
      180,
      "Soft as your cheek used to be",
      "There. That is the answer. Soft, a little springy, never stiff. I told the dough you were asking after it. Your grandfather would have said a good recipe is just a way to get everyone back to the table. I wrote your name beside mine on this one.",
      { replyTo: "rosa-2", design: decoration("flower", "linen") },
    ),
    page(
      "theo-3",
      "theo",
      "theo",
      156,
      "A little light for you",
      "That is the line. I put it after 'the kettle sings, the evening settles.' Played it for Sam on the porch; even the neighbor's dog listened. The guitar face remains excellent, thank you. I left a blank verse with your name above it. Our song can take the long way home.",
      { replyTo: "theo-2", design: decoration("moon", "linen") },
    ),
    page(
      "gui-5",
      "gui",
      "gui",
      120,
      "Two names on the team card",
      "It flew straight! We took our notebook to the school olympiad and explained the bent fin. I put 'Gui + Dad' on our team card. My favorite bit was telling everyone that you helped me from space. I kept the first wonky rocket. It's next to my bed now.",
      {
        replyTo: "gui-4",
        photo: "/images/gui.jpg",
        design: decoration("rocket", "midnight"),
      },
    ),
    page(
      "rosa-4",
      "rosa",
      "alex",
      108,
      "Both our names",
      "I added the same two names to my copy. Today the cabin smelled like warm bread for one small second, although I think it was only the memory. Keep the flour fingerprint. When I come home, I want to make a new one beside it.",
      { replyTo: "rosa-3", design: decoration("flower", "sage") },
    ),
    page(
      "theo-4",
      "theo",
      "alex",
      84,
      "My verse, from the quiet shift",
      "'Past the window, past the blue / an ordinary night with you.' There is my verse. Slightly unfair that the dog heard our reunion before I did. Keep the porch performance in the album. I like knowing there is still a place for my part, even when it arrives later.",
      { replyTo: "theo-3", design: decoration("moon", "sage") },
    ),
    page(
      "gui-6",
      "gui",
      "alex",
      60,
      "My favorite flight was yours",
      "I read your page twice before my shift. You asked a question, tried something, and learned from it. That's my kind of rocket engineer. I wrote 'Gui + Dad' on our notebook up here too. Tell me where the next drawing takes us. Being on your team is the best part of my day.",
      { replyTo: "gui-5", design: decoration("rocket", "linen") },
    ),
  ];
  return chronological(advanceDelivery(pages, true, now));
}

/** Add the new authored albums once, without replacing any existing browser records. */
export function upgradeDemoStories(data: AppData): AppData {
  if (data.demoStoriesVersion === 1) return data;
  const june = data.pages.find(
    (page) => page.id === "june-1" && page.albumId === "june",
  );
  const anchor = june
    ? new Date(Date.parse(june.createdAt) + 240 * 3_600_000)
    : new Date(
        data.pages.length
          ? data.pages.reduce(
              (latest, page) => Math.max(latest, Date.parse(page.createdAt)),
              0,
            )
          : "2026-11-15T12:00:00Z",
      );
  const existing = new Map(data.pages.map((page) => [page.id, page]));
  const seeds = createNewStoryPages(anchor);
  const mappedIds = new Map<string, string>();
  const reservedIds = new Set(existing.keys());
  for (const seed of seeds) {
    const prior = existing.get(seed.id);
    let id = seed.id;
    if (
      prior &&
      (prior.albumId !== seed.albumId ||
        prior.authorId !== seed.authorId ||
        !["delivered", "answered"].includes(prior.status))
    ) {
      let suffix = 1;
      do {
        id = `demo-${seed.id}-${suffix++}`;
      } while (reservedIds.has(id));
    }
    mappedIds.set(seed.id, id);
    reservedIds.add(id);
  }
  const additions = seeds
    .filter((seed) => !existing.has(mappedIds.get(seed.id)!))
    .map((seed) => ({
      ...seed,
      id: mappedIds.get(seed.id)!,
      ...(seed.replyTo ? { replyTo: mappedIds.get(seed.replyTo)! } : {}),
    }));
  return {
    ...data,
    demoStoriesVersion: 1,
    pages: chronological([...data.pages, ...additions]),
  };
}

/** Exact previous authored signatures, retained only to recognize untouched local examples. */
function createOriginalStoryPages(now: Date): Contribution[] {
  const at = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  const seed = (
    id: string,
    albumId: string,
    authorId: string,
    hoursAgo: number,
    title: string,
    text: string,
    extra: Partial<Contribution> = {},
  ): Contribution => ({
    id,
    albumId,
    authorId,
    title,
    text,
    createdAt: at(hoursAgo),
    status: "delivered",
    sentAt: at(hoursAgo - 0.05),
    deliveredAt: at(hoursAgo - 0.25),
    ...extra,
  });
  const pages = [
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
  return chronological(pages);
}

/** Revised, explicitly authored examples for the four original people in Alex's circle. */
export function createClassicStoryPages(now: Date): Contribution[] {
  const at = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  const seed = (
    id: string,
    albumId: string,
    authorId: string,
    hoursAgo: number,
    title: string,
    text: string,
    extra: Partial<Contribution> = {},
  ): Contribution => ({
    id,
    albumId,
    authorId,
    title,
    text,
    createdAt: at(hoursAgo),
    status: "delivered",
    sentAt: at(hoursAgo - 0.05),
    deliveredAt: at(hoursAgo - 0.25),
    ...extra,
  });
  const design = (
    kind: "star" | "moon" | "stamp" | "sparkles",
    tape: PageDesign["tape"] = "linen",
  ): PageDesign => ({
    layout: "classic",
    tape,
    photoTilt: -2,
    stickers: [
      {
        id: `${kind}-keepsake`,
        kind,
        x: 85,
        y: 83,
        rotation: -10,
        scale: 0.85,
      },
    ],
  });
  const pages = [
    seed(
      "june-1",
      "june",
      "june",
      240,
      "The picture house gets one more night",
      "The neighborhood has permission to bring the old cinema back for one evening. We have a borrowed projector, twelve volunteers, and a popcorn machine with opinions. Behind the ticket booth I found a tin of our home movies. Will you help me choose the program? Your name is going on the little marquee.",
      { photo: "/images/stories/june-cinema.jpg", design: design("stamp") },
    ),
    seed(
      "sam-1",
      "sam",
      "sam",
      216,
      "Table for two, one in orbit",
      "I turned the rooftop table into a restaurant. Candles, mismatched plates, and a cardboard sign: Mission Control Supper Club. Your chair has the good view. Tonight's challenge: invent a dish using bread, an orange, and whatever spice you miss most. Send the menu when your corner of the universe permits.",
      {
        photo: "/images/stories/sam-supper.jpg",
        design: design("star", "sage"),
      },
    ),
    seed(
      "lily-1",
      "lily",
      "lily",
      204,
      "Expedition headquarters is under a blanket",
      "Dad! Mom helped me build a field station in the backyard. It has a blanket roof, a torch, and a sign that says SMALL EXPLORERS ONLY. We are looking for fireflies tonight. I made you a paper expedition badge. Can you help us invent a constellation that belongs to our team?",
      {
        photo: "/images/stories/lily-expedition.jpg",
        design: design("sparkles", "sage"),
      },
    ),
    seed(
      "sam-2",
      "sam",
      "alex",
      192,
      "The chef is requesting cinnamon",
      "Toast the bread, add orange slices, then a little cinnamon. That is my best impression of a chef working from a flight manual. Call it Sunrise on the Flight Deck. I drew an absurdly tiny restaurant logo in my notebook. Please save the cardboard sign. I want to eat beneath it when I'm home.",
      {
        replyTo: "sam-1",
        photo: "/images/stories/alex-space-meal.jpg",
        design: design("star"),
      },
    ),
    seed(
      "lily-2",
      "lily",
      "alex",
      168,
      "A map for the smallest explorers",
      "Badge accepted, Expedition Captain Lily. Try three bright dots in a triangle, with one little dot following behind. It could be a boat, a fox, or something only you can see. Watch the fireflies with Mom and sketch their paths. I'll keep a page open for your discoveries after my quiet shift.",
      { replyTo: "lily-1", design: design("moon") },
    ),
    seed(
      "maya-1",
      "maya",
      "maya",
      120,
      "A postcard with our names on it",
      "The lighthouse volunteer found a sealed tin in the community time-capsule display. Our names are on the lid. There is a postcard too: 20–8–5 / 2–5–14–3–8. Remember our old code? I'm following the public heritage path tomorrow. You were always better at the clues. Want to be my very distant detective?",
      {
        photo: "/images/stories/maya-lighthouse.jpg",
        design: design("stamp", "midnight"),
      },
    ),
    seed(
      "maya-2",
      "maya",
      "alex",
      108,
      "A equals one. And I remember the bench.",
      "It says THE BENCH. We used to number the alphabet on the backs of our notebooks. The blue bench by the public lookout is where your kite escaped and I insisted it was a weather experiment. Open the tin there. I have a strong suspicion our teenage selves are about to embarrass us.",
      { replyTo: "maya-1", design: design("stamp") },
    ),
    seed(
      "sam-4",
      "sam",
      "sam",
      96,
      "Opening night was slightly smoky",
      "Sunrise on the Flight Deck is unexpectedly excellent. The first toast became a very small meteorite, but the second deserved a proper plate. I set your notebook logo beside the candle and read your page out loud. The neighbors now want reservations. We may have accidentally started a restaurant with a chef in space.",
      { replyTo: "sam-2", design: design("star", "sage") },
    ),
    seed(
      "lily-5",
      "lily",
      "lily",
      96,
      "One blink. Then another!",
      "At first we only found the neighbor's porch light. Then a tiny green blink flew past the beans! Mom and I counted three before they disappeared into the leaves. I drew the triangle like you said. Mine looks like a little boat carrying one very brave firefly. What should we call it?",
      { replyTo: "lily-2", design: design("sparkles") },
    ),
    seed(
      "maya-3",
      "maya",
      "maya",
      84,
      "Adventure number four came true",
      "Inside: the kite photograph, the lucky blue button from your old jacket, and our list of future adventures. Number four says 'one of us goes to space; the other keeps the snacks.' I laughed so loudly that a tourist asked about the exhibit. I told her my co-detective was currently a little beyond the lighthouse.",
      {
        replyTo: "maya-2",
        photo: "/images/stories/maya-capsule.jpg",
        design: design("stamp", "sage"),
      },
    ),
    seed(
      "lily-3",
      "lily",
      "alex",
      72,
      "Meet the Tiny Navigator",
      "The Tiny Navigator: a small boat that follows one brave blink home. Put its name on our expedition map. I made the same four-dot drawing beside my window. When your lanterns go up, imagine mine here too. Your next mission is important: decide what snack a firefly captain would pack.",
      { replyTo: "lily-5", design: design("moon", "midnight") },
    ),
    seed(
      "maya-4",
      "maya",
      "alex",
      60,
      "Add a fifth adventure",
      "Please put 'keep showing up for each other' beneath number four. We underestimated how much that one would matter. I copied the kite photo from memory: mostly sky, two terrible haircuts. Keep that lucky button in the album. When I'm back, the next clue can lead directly to the snack shop.",
      { replyTo: "maya-3", design: design("stamp") },
    ),
    seed(
      "sam-3",
      "sam",
      "alex",
      48,
      "A second course, from the quiet shift",
      "The restaurant needs a dessert. My vote: orange peel curled into a tiny moon beside the last square of chocolate. And one rule for the menu: every dish gets a name that makes the other person laugh. I'm sending a five-star review in advance. One star for each thing I miss about sharing a table with you.",
      { replyTo: "sam-4", design: design("star", "midnight") },
    ),
    seed(
      "june-2",
      "june",
      "alex",
      36,
      "Put the bicycle before the stars",
      "Start with the summer bicycle race, then the clip where everyone waves from the garden. Let the home movies come before the big space film. The best part of a picture house is recognizing someone you love on the screen. I wrote a short welcome for you to read. Tell them I'm in the back row, in spirit.",
      { replyTo: "june-1", design: design("stamp", "sage") },
    ),
    seed(
      "sam-5",
      "sam",
      "sam",
      24,
      "The menu now has your handwriting",
      "Dessert is officially called One Small Bite for Mankind. I copied your welcome logo and tucked both our menus into the album. The restaurant stayed open until the candle gave up. Your empty chair didn't feel quite so empty tonight. Next service: breakfast, with a very unreasonable reservation time for an astronaut.",
      {
        replyTo: "sam-3",
        photo: "/images/stories/sam-menu.jpg",
        design: design("star"),
      },
    ),
    seed(
      "june-3",
      "june",
      "june",
      24,
      "The astronaut in the tin was eleven",
      "One more reel was hiding underneath. You, in a cardboard space helmet, walking backward across the garden while the dog carries your flag. The label says ALEX'S MOON TEST. I had forgotten your very serious countdown. Do we dare show the neighborhood the commander's first mission?",
      {
        replyTo: "june-2",
        photo: "/images/stories/june-film.jpg",
        design: design("stamp"),
      },
    ),
    seed(
      "sam-6",
      "sam",
      "alex",
      12,
      "A reservation under both our names",
      "Five stars, and a special award for the meteorite toast. I stuck a paper copy of the menu inside my locker. The place where I keep the mission checklist now also has a restaurant reservation. Make it for two, Sam. Any morning with you will do.",
      { replyTo: "sam-5", design: design("star", "sage") },
    ),
    seed(
      "june-4",
      "june",
      "alex",
      12,
      "The dog was clearly mission commander",
      "Show it. Leave the countdown in, especially the part where I forget seven. End with the garden waving, then a card that says 'For everyone who kept the lights on.' You gave me a first audience long before there was a real launch. I like thinking I can still help fill a room with laughter from here.",
      { replyTo: "june-3", design: design("stamp", "midnight") },
    ),
    seed(
      "lily-4",
      "lily",
      "lily",
      6,
      "Our constellation has landed in the garden",
      "We hung the lanterns like the Tiny Navigator! Mom helped with the high one. Then a real firefly blinked right beside our little boat, as if it knew the story. I left your badge on the second cushion. The captain's snack is three raisins and a biscuit crumb. I saved you the crumb.",
      {
        replyTo: "lily-3",
        photo: "/images/stories/lily-lanterns.jpg",
        design: design("sparkles", "sage"),
      },
    ),
    seed(
      "june-5",
      "june",
      "june",
      2,
      "We laughed right through the countdown",
      "Every seat was full. The popcorn machine behaved, the children cheered for the dog, and the whole room shouted the missing seven. I read your welcome before the lights went down. For one lovely evening, the old picture house felt like our biggest living room. Your name stayed on the marquee until closing.",
      { replyTo: "june-4", design: design("stamp", "sage") },
    ),
    seed(
      "lily-6",
      "lily",
      "alex",
      1,
      "I can see our boat from here",
      "I put the Tiny Navigator on my locker, right beside our team badge. You found the fireflies; I helped name the boat. That makes it a real expedition together. Keep my cushion in headquarters, Captain. I'll bring the next biscuit, and you can tell me which way our brave little light should travel.",
      { replyTo: "lily-4", design: design("moon") },
    ),
  ];
  return chronological(advanceDelivery(pages, true, now));
}

const sameAuthoredContent = (page: Contribution, reference: Contribution) =>
  page.id === reference.id &&
  page.albumId === reference.albumId &&
  page.authorId === reference.authorId &&
  page.title === reference.title &&
  page.text === reference.text &&
  page.photo === reference.photo &&
  JSON.stringify(page.design) === JSON.stringify(reference.design) &&
  page.replyTo === reference.replyTo;

/** Add the new sample photo only to the unchanged, previously photo-free reply. */
export function upgradeSamReplyPhoto(data: AppData): AppData {
  const prior = data.pages.find((page) => page.id === "sam-2");
  if (!prior || prior.photo) return data;
  const reference = createClassicStoryPages(
    new Date("2026-11-15T12:00:00Z"),
  ).find((page) => page.id === "sam-2")!;
  if (!sameAuthoredContent(prior, { ...reference, photo: undefined }))
    return data;
  return {
    ...data,
    pages: data.pages.map((page) =>
      page === prior ? { ...page, photo: reference.photo } : page,
    ),
  };
}

/** Refresh only complete, untouched original examples; personalized albums remain intact. */
export function upgradeClassicStories(data: AppData): AppData {
  if (data.classicStoriesVersion === 1) return data;
  const referenceTime = new Date("2026-11-15T12:00:00Z");
  const original = createOriginalStoryPages(referenceTime);
  const priorById = new Map(data.pages.map((page) => [page.id, page]));
  const eligibleAlbums = new Set(
    ["sam", "maya", "june", "lily"].filter((albumId) =>
      original
        .filter((page) => page.albumId === albumId)
        .every((reference) => {
          const page = priorById.get(reference.id);
          return (
            !!page &&
            sameAuthoredContent(page, reference) &&
            ["delivered", "answered"].includes(page.status)
          );
        }),
    ),
  );
  const trustedAnchor = original.find((page) =>
    eligibleAlbums.has(page.albumId),
  );
  const anchor = trustedAnchor
    ? new Date(
        Date.parse(priorById.get(trustedAnchor.id)!.createdAt) +
          referenceTime.getTime() -
          Date.parse(trustedAnchor.createdAt),
      )
    : referenceTime;
  const revised = createClassicStoryPages(anchor);
  const revisedById = new Map(revised.map((page) => [page.id, page]));
  const originalIds = new Set(original.map((page) => page.id));
  const additions = revised.filter(
    (page) => eligibleAlbums.has(page.albumId) && !originalIds.has(page.id),
  );
  const ids = new Set(data.pages.map((page) => page.id));
  const mappedIds = new Map<string, string>();
  for (const page of additions) {
    let id = page.id;
    if (ids.has(id)) {
      let suffix = 1;
      do {
        id = `classic-${page.id}-${suffix++}`;
      } while (ids.has(id));
    }
    ids.add(id);
    mappedIds.set(page.id, id);
  }
  const added = additions.map((page) => ({
    ...page,
    id: mappedIds.get(page.id)!,
    ...(page.replyTo
      ? { replyTo: mappedIds.get(page.replyTo) ?? page.replyTo }
      : {}),
  }));
  const newlyLinkedIds: string[] = [];
  const pages = data.pages.map((prior) => {
    if (!eligibleAlbums.has(prior.albumId) || !originalIds.has(prior.id))
      return prior;
    const updated = revisedById.get(prior.id)!;
    const replyTo =
      prior.replyTo ??
      (updated.replyTo
        ? (mappedIds.get(updated.replyTo) ?? updated.replyTo)
        : undefined);
    if (!prior.replyTo && replyTo) newlyLinkedIds.push(prior.id);
    const { photo: _oldPhoto, design: _oldDesign, ...history } = prior;
    return {
      ...history,
      title: updated.title,
      text: updated.text,
      ...(updated.photo ? { photo: updated.photo } : {}),
      ...(updated.design ? { design: updated.design } : {}),
      ...(replyTo ? { replyTo } : {}),
    };
  });
  const combined = [...pages, ...added];
  const introducedReplyIds = new Set([
    ...newlyLinkedIds,
    ...added.map((page) => page.id),
  ]);
  const answeredBy = new Map<string, string>();
  for (const reply of combined) {
    if (
      !introducedReplyIds.has(reply.id) ||
      !reply.replyTo ||
      !reply.deliveredAt ||
      !["delivered", "answered"].includes(reply.status)
    )
      continue;
    const parent = priorById.get(reply.replyTo);
    if (
      !parent ||
      !eligibleAlbums.has(parent.albumId) ||
      !originalIds.has(parent.id) ||
      parent.albumId !== reply.albumId ||
      parent.authorId === reply.authorId
    )
      continue;
    const previous = answeredBy.get(parent.id);
    if (!previous || Date.parse(reply.deliveredAt) < Date.parse(previous))
      answeredBy.set(parent.id, reply.deliveredAt);
  }
  // Newly introduced, already delivered authored replies also have results offline.
  // Earlier Answered records keep their historical timestamp exactly; no transport advances here.
  const reconciled = combined.map((page): Contribution => {
    const answeredAt = answeredBy.get(page.id);
    return answeredAt && page.status === "delivered"
      ? { ...page, status: "answered", answeredAt }
      : page;
  });
  // These are old, authored sample chapters, not newly delivered personal messages.
  const historicalReplies = [
    ...newlyLinkedIds,
    ...added.filter((page) => page.replyTo).map((page) => page.id),
  ];
  const readReplyIds = [
    ...data.readReplyIds,
    ...historicalReplies.filter((id) => !data.readReplyIds.includes(id)),
  ];
  return {
    ...data,
    classicStoriesVersion: 1,
    pages: chronological(reconciled),
    readReplyIds,
  };
}

export function createInitialData(now = new Date()): AppData {
  return {
    version: 1,
    demoStoriesVersion: 1,
    classicStoriesVersion: 1,
    pages: chronological([
      ...createClassicStoryPages(now),
      ...createNewStoryPages(now),
    ]),
    drafts: {},
    checkIns: [],
    readReplyIds: [],
  };
}

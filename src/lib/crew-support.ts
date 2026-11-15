import {
  SUPPORT_STEPS,
  type SituationId,
  type StepId,
} from "./crew-support-content";

/** Separate from family albums: this module performs no browser or network writes. */
export const CREW_STORAGE_KEY = "still-here:crew-support:v1";
export const CREW_MEMBERS = [
  { id: "alex", name: "Alex" },
  { id: "jordan", name: "Jordan" },
] as const;
export type CrewId = (typeof CREW_MEMBERS)[number]["id"];
export type Feeling = "better" | "same" | "worse" | null;
export type Escalation = "medical" | "emergency" | null;
export type PlanEntry = { id: string; text: string; shared: boolean };
export type SupportPlan = {
  ownerId: CrewId;
  strategies: PlanEntry[];
  avoid: PlanEntry[];
  contacts: PlanEntry[];
  updatedAt: string;
};
export type SharedSupportPlan = {
  ownerId: CrewId;
  strategies: string[];
  avoid: string[];
  contacts: string[];
  updatedAt: string;
};
export type MedicalConfig = {
  lead: string;
  channel: string;
  backup: string;
  instructions: string;
};
export type SupportEvent = { stepId: StepId; response: string };
export type SupportSummary = {
  id: string;
  ownerId: CrewId;
  crewmateId: CrewId;
  createdAt: string;
  situation: SituationId;
  observations: string;
  actions: string;
  nextSteps: string;
  feeling: Feeling;
  events: SupportEvent[];
};
export type CrewData = {
  version: 1;
  plans: Record<CrewId, SupportPlan>;
  medical: MedicalConfig;
  summaries: SupportSummary[];
};

export const MAX_PLAN_ENTRIES = 8;
export const MAX_PLAN_ENTRY_LENGTH = 300;
export const MAX_SUPPORT_SUMMARIES = 30;
export const MAX_SUPPORT_EVENTS = 100;
export const MAX_SUPPORT_NOTE_LENGTH = 2000;

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: string[]) =>
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
const text = (
  value: unknown,
  limit: number,
  required = false,
): value is string =>
  typeof value === "string" &&
  value.length <= limit &&
  (!required || value.trim().length > 0) &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const identifier = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(value);
const date = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length < 40 &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const unique = (values: string[]) => new Set(values).size === values.length;
export const isCrewId = (value: unknown): value is CrewId =>
  CREW_MEMBERS.some((member) => member.id === value);
const isSituation = (value: unknown): value is SituationId =>
  ["anxiety", "overload", "conflict", "unsure"].includes(value as string);
const isStep = (value: unknown): value is StepId =>
  typeof value === "string" &&
  Object.prototype.hasOwnProperty.call(SUPPORT_STEPS, value);
const isFeeling = (value: unknown): value is Feeling =>
  value === null || ["better", "same", "worse"].includes(value as string);

function invalid(): never {
  throw new Error(
    "Saved crew support data could not be read. The original browser data has not been changed.",
  );
}

const isPlanEntry = (value: unknown): value is PlanEntry =>
  object(value) &&
  keys(value, ["id", "text", "shared"]) &&
  identifier(value.id) &&
  text(value.text, MAX_PLAN_ENTRY_LENGTH, true) &&
  typeof value.shared === "boolean";

export function isSupportPlan(value: unknown): value is SupportPlan {
  if (
    !object(value) ||
    !keys(value, ["ownerId", "strategies", "avoid", "contacts", "updatedAt"]) ||
    !isCrewId(value.ownerId) ||
    !date(value.updatedAt)
  )
    return false;
  const categories = [value.strategies, value.avoid, value.contacts];
  if (
    !categories.every(
      (entries) =>
        Array.isArray(entries) &&
        entries.length <= MAX_PLAN_ENTRIES &&
        entries.every(isPlanEntry),
    )
  )
    return false;
  return unique((categories as PlanEntry[][]).flat().map((entry) => entry.id));
}

export function isMedicalConfig(value: unknown): value is MedicalConfig {
  return (
    object(value) &&
    keys(value, ["lead", "channel", "backup", "instructions"]) &&
    text(value.lead, 200, true) &&
    text(value.channel, 300, true) &&
    text(value.backup, 300, true) &&
    text(value.instructions, 1500, true)
  );
}

const isEvent = (value: unknown): value is SupportEvent =>
  object(value) &&
  keys(value, ["stepId", "response"]) &&
  isStep(value.stepId) &&
  text(value.response, 300, true);

function isSummary(value: unknown): value is SupportSummary {
  return (
    object(value) &&
    keys(value, [
      "id",
      "ownerId",
      "crewmateId",
      "createdAt",
      "situation",
      "observations",
      "actions",
      "nextSteps",
      "feeling",
      "events",
    ]) &&
    identifier(value.id) &&
    isCrewId(value.ownerId) &&
    isCrewId(value.crewmateId) &&
    value.ownerId !== value.crewmateId &&
    date(value.createdAt) &&
    isSituation(value.situation) &&
    [value.observations, value.actions, value.nextSteps].every((note) =>
      text(note, MAX_SUPPORT_NOTE_LENGTH),
    ) &&
    isFeeling(value.feeling) &&
    Array.isArray(value.events) &&
    value.events.length <= MAX_SUPPORT_EVENTS &&
    value.events.every(isEvent)
  );
}

const clonePlan = (plan: SupportPlan): SupportPlan => ({
  ownerId: plan.ownerId,
  strategies: plan.strategies.map((entry) => ({ ...entry })),
  avoid: plan.avoid.map((entry) => ({ ...entry })),
  contacts: plan.contacts.map((entry) => ({ ...entry })),
  updatedAt: plan.updatedAt,
});
const cloneSummary = (summary: SupportSummary): SupportSummary => ({
  ...summary,
  events: summary.events.map((event) => ({ ...event })),
});

/** Fictional, pre-mission example preferences; sharing switches are explicit. */
export function createCrewData(
  now = new Date("2026-11-15T12:00:00Z"),
): CrewData {
  const updatedAt = now.toISOString();
  return {
    version: 1,
    plans: {
      alex: {
        ownerId: "alex",
        strategies: [
          {
            id: "alex-quiet",
            text: "Offer quiet company and let me choose when to talk.",
            shared: true,
          },
          {
            id: "alex-choice",
            text: "Ask whether I would like a short break, when duties allow.",
            shared: true,
          },
          {
            id: "alex-private",
            text: "Private rehearsal reminder",
            shared: false,
          },
        ],
        avoid: [
          {
            id: "alex-touch",
            text: "Please ask before touching me.",
            shared: true,
          },
          {
            id: "alex-memories",
            text: "Some memories are for my own reflection.",
            shared: false,
          },
        ],
        contacts: [
          {
            id: "alex-medical",
            text: "Designated onboard medical lead through the approved channel.",
            shared: true,
          },
          {
            id: "alex-personal",
            text: "Personal contact details are kept outside this shared plan.",
            shared: false,
          },
        ],
        updatedAt,
      },
      jordan: {
        ownerId: "jordan",
        strategies: [
          {
            id: "jordan-question",
            text: "One question at a time, with a little space to answer.",
            shared: true,
          },
          {
            id: "jordan-private",
            text: "Private rehearsal reminder",
            shared: false,
          },
        ],
        avoid: [
          {
            id: "jordan-crowd",
            text: "Please avoid a crowd or repeated questions.",
            shared: true,
          },
          {
            id: "jordan-reflection",
            text: "My personal reflection stays private.",
            shared: false,
          },
        ],
        contacts: [
          {
            id: "jordan-crewmate",
            text: "Ask which trusted crewmate I would like nearby.",
            shared: true,
          },
          {
            id: "jordan-contact",
            text: "I keep personal contact details in my private notebook.",
            shared: false,
          },
        ],
        updatedAt,
      },
    },
    medical: {
      lead: "Designated onboard medical lead",
      channel: "Use your mission-approved onboard medical channel.",
      backup:
        "Follow the onboard emergency checklist and notify the designated backup.",
      instructions:
        "For immediate danger, activate onboard emergency procedures now. Do not wait for Earth or an album reply.",
    },
    summaries: [],
  };
}

/** Deliberately constructs a projection: no unshared entry, ID, or extra field escapes. */
export function getSharedPlan(plan: SupportPlan): SharedSupportPlan {
  if (!isSupportPlan(plan))
    throw new Error("This support plan could not be opened.");
  return {
    ownerId: plan.ownerId,
    strategies: plan.strategies
      .filter((entry) => entry.shared)
      .map((entry) => entry.text),
    avoid: plan.avoid
      .filter((entry) => entry.shared)
      .map((entry) => entry.text),
    contacts: plan.contacts
      .filter((entry) => entry.shared)
      .map((entry) => entry.text),
    updatedAt: plan.updatedAt,
  };
}

/** Demo ownership boundaries are not authentication or a browser-storage security boundary. */
export function updateSupportPlan(
  data: CrewData,
  actorId: CrewId,
  plan: SupportPlan,
): CrewData {
  if (!isCrewId(actorId) || !isSupportPlan(plan) || plan.ownerId !== actorId)
    throw new Error("You can edit only your own support plan.");
  return { ...data, plans: { ...data.plans, [actorId]: clonePlan(plan) } };
}

export function updateMedicalConfig(
  data: CrewData,
  config: MedicalConfig,
): CrewData {
  if (!isMedicalConfig(config))
    throw new Error(
      "Complete each medical support field within its character limit.",
    );
  return { ...data, medical: { ...config } };
}

export function getPrivateSummaries(
  data: CrewData,
  actorId: CrewId,
): SupportSummary[] {
  if (!isCrewId(actorId))
    throw new Error("Choose a demonstration crew profile.");
  return data.summaries
    .filter((summary) => summary.ownerId === actorId)
    .map(cloneSummary);
}

/** Called only after a person explicitly reviews and saves a private summary. */
export function addSupportSummary(
  data: CrewData,
  actorId: CrewId,
  input: Omit<SupportSummary, "id" | "createdAt">,
  now = new Date(),
  id = `support-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
): CrewData {
  const summary = { ...input, id, createdAt: now.toISOString() };
  if (!isCrewId(actorId) || !isSummary(summary) || summary.ownerId !== actorId)
    throw new Error(
      "This private summary could not be saved for this crew profile.",
    );
  if (data.summaries.length >= MAX_SUPPORT_SUMMARIES)
    throw new Error("This device can hold up to 30 private support summaries.");
  if (data.summaries.some((existing) => existing.id === id))
    throw new Error("This summary is already saved.");
  return { ...data, summaries: [...data.summaries, cloneSummary(summary)] };
}

/** No repair-by-deletion: invalid or mixed family data is rejected before any UI persistence. */
export function parseCrewData(raw: string): CrewData {
  const value: unknown = JSON.parse(raw);
  if (
    !object(value) ||
    !keys(value, ["version", "plans", "medical", "summaries"]) ||
    value.version !== 1 ||
    !object(value.plans) ||
    !keys(value.plans, ["alex", "jordan"]) ||
    !isSupportPlan(value.plans.alex) ||
    value.plans.alex.ownerId !== "alex" ||
    !isSupportPlan(value.plans.jordan) ||
    value.plans.jordan.ownerId !== "jordan" ||
    !isMedicalConfig(value.medical) ||
    !Array.isArray(value.summaries) ||
    value.summaries.length > MAX_SUPPORT_SUMMARIES ||
    !value.summaries.every(isSummary) ||
    !unique(value.summaries.map((summary) => summary.id))
  )
    invalid();
  return {
    version: 1,
    plans: {
      alex: clonePlan(value.plans.alex),
      jordan: clonePlan(value.plans.jordan),
    },
    medical: { ...value.medical },
    summaries: value.summaries.map(cloneSummary),
  };
}

/** Route only to predefined content; no diagnosis, free-form conduct, or health clearance. */
export function nextSupportStep(
  currentStep: StepId,
  choiceId: string,
  situation: SituationId,
): StepId | "review" {
  if (!isStep(currentStep) || !isSituation(situation))
    throw new Error("Choose one of the available support situations.");
  const choice = SUPPORT_STEPS[currentStep].choices.find(
    (item) => item.id === choiceId,
  );
  if (!choice)
    throw new Error("Choose an available response before continuing.");
  const target = choice.next === "path" ? situation : choice.next;
  if (target !== "review" && !isStep(target))
    throw new Error("This support step is not available.");
  return target;
}

/** A later feeling report cannot cancel an already identified need for medical help. */
export function guardSupportDestination(
  next: StepId | "review",
  escalation: Escalation,
): StepId | "review" {
  if (next !== "review" && !isStep(next))
    throw new Error("This support step is not available.");
  if (
    escalation !== null &&
    escalation !== "medical" &&
    escalation !== "emergency"
  )
    throw new Error("This medical support state is not available.");
  if (next === "review") return next;
  if (escalation === "emergency") return "emergency";
  if (escalation === "medical" && next !== "emergency") return "medical";
  return next;
}

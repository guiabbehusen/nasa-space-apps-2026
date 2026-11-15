import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORT_STEPS, type SituationId } from "./crew-support-content";
import {
  CREW_STORAGE_KEY,
  MAX_SUPPORT_SUMMARIES,
  addSupportSummary,
  createCrewData,
  getPrivateSummaries,
  getSharedPlan,
  guardSupportDestination,
  isSupportPlan,
  nextSupportStep,
  parseCrewData,
  updateMedicalConfig,
  updateSupportPlan,
  type CrewData,
  type SupportSummary,
} from "./crew-support";

const now = new Date("2026-11-15T12:00:00Z");
const parse = (data: unknown) => parseCrewData(JSON.stringify(data));
const input = (): Omit<SupportSummary, "id" | "createdAt"> => ({
  ownerId: "alex",
  crewmateId: "jordan",
  situation: "anxiety",
  observations: "They asked for quiet company.",
  actions: "Offered to remain nearby; they accepted.",
  nextSteps: "Ask which support contact they want.",
  feeling: "same",
  events: [{ stepId: "consent", response: "They accept help" }],
});

test("all four situations begin with safety and require permission before their authored action", () => {
  for (const situation of [
    "anxiety",
    "overload",
    "conflict",
    "unsure",
  ] as SituationId[]) {
    assert.equal(nextSupportStep("safety", "no-danger", situation), "consent");
    assert.equal(nextSupportStep("consent", "accepted", situation), "listen");
    assert.equal(nextSupportStep("listen", "continue", situation), situation);
  }
  assert.throws(() => nextSupportStep("safety", "continue", "anxiety"));
  assert.throws(() => nextSupportStep("listen", "invented", "anxiety"));
});

test("physical danger, uncertainty, and inability to respond route to help rather than a psychological assumption", () => {
  assert.equal(nextSupportStep("safety", "danger", "anxiety"), "emergency");
  assert.equal(nextSupportStep("safety", "unsure", "overload"), "medical");
  assert.equal(nextSupportStep("consent", "unable", "conflict"), "medical");
  assert.equal(nextSupportStep("conflict", "danger", "conflict"), "emergency");
  assert.equal(nextSupportStep("medical", "urgent", "unsure"), "emergency");
});

test("declined help has an ending and access to medical support, never a forced routine path", () => {
  assert.equal(nextSupportStep("consent", "declined", "anxiety"), "refused");
  assert.equal(nextSupportStep("listen", "stop", "overload"), "refused");
  assert.equal(nextSupportStep("unsure", "space", "unsure"), "refused");
  assert.deepEqual(
    new Set(SUPPORT_STEPS.refused.choices.map((choice) => choice.next)),
    new Set(["review", "medical"]),
  );
  assert.equal(nextSupportStep("refused", "end", "conflict"), "review");
});

test("feeling better closes only a routine conversation and cannot bypass a medical escalation", () => {
  const routineFinish = nextSupportStep("check", "better", "anxiety");
  assert.equal(routineFinish, "finish");
  assert.equal(nextSupportStep("check", "same", "anxiety"), "medical");
  assert.equal(nextSupportStep("check", "worse", "anxiety"), "medical");
  assert.equal(guardSupportDestination(routineFinish, null), "finish");
  assert.equal(guardSupportDestination(routineFinish, "medical"), "medical");
  assert.equal(
    guardSupportDestination(routineFinish, "emergency"),
    "emergency",
  );
  assert.equal(guardSupportDestination("consent", "medical"), "medical");
  assert.equal(guardSupportDestination("medical", "emergency"), "emergency");
  assert.equal(guardSupportDestination("emergency", "medical"), "emergency");
  assert.equal(guardSupportDestination("review", "emergency"), "review");
});

test("the shared plan is a new authorized projection with no private text or identifiers", () => {
  const data = createCrewData(now);
  const shared = getSharedPlan(data.plans.alex);
  const encoded = JSON.stringify(shared);
  assert.ok(shared.strategies.includes(data.plans.alex.strategies[0].text));
  for (const entries of [
    data.plans.alex.strategies,
    data.plans.alex.avoid,
    data.plans.alex.contacts,
  ]) {
    for (const entry of entries) {
      assert.ok(!encoded.includes(entry.id));
      if (!entry.shared) assert.ok(!encoded.includes(entry.text));
    }
  }
  assert.ok(!encoded.includes("Private rehearsal reminder"));
  shared.strategies.push("A helper cannot mutate the stored plan.");
  assert.equal(data.plans.alex.strategies.length, 3);
  data.plans.alex.strategies[0].shared = false;
  assert.ok(
    !getSharedPlan(data.plans.alex).strategies.includes(
      data.plans.alex.strategies[0].text,
    ),
  );
});

test("a demo profile can update only its own plan and stores a detached validated copy", () => {
  const original = createCrewData(now);
  const candidate = structuredClone(original.plans.alex);
  candidate.strategies[0].text = "Ask before offering company.";
  assert.throws(
    () => updateSupportPlan(original, "jordan", candidate),
    /own support plan/,
  );
  const updated = updateSupportPlan(original, "alex", candidate);
  candidate.strategies[0].text = "Changed after saving";
  assert.equal(
    updated.plans.alex.strategies[0].text,
    "Ask before offering company.",
  );
  assert.notEqual(
    original.plans.alex.strategies[0].text,
    updated.plans.alex.strategies[0].text,
  );
  const duplicate = structuredClone(updated.plans.alex);
  duplicate.contacts[0].id = duplicate.strategies[0].id;
  assert.equal(isSupportPlan(duplicate), false);
  assert.throws(() => updateSupportPlan(updated, "alex", duplicate));
});

test("only an explicit reviewed save creates a summary, owned and readable by its author", () => {
  const original = createCrewData(now);
  assert.deepEqual(original.summaries, []);
  const candidate = input();
  assert.throws(() =>
    addSupportSummary(original, "jordan", candidate, now, "support-test"),
  );
  const saved = addSupportSummary(
    original,
    "alex",
    candidate,
    now,
    "support-test",
  );
  candidate.events[0].response = "Changed after saving";
  assert.equal(original.summaries.length, 0);
  assert.equal(getPrivateSummaries(saved, "alex").length, 1);
  assert.deepEqual(getPrivateSummaries(saved, "jordan"), []);
  assert.equal(saved.summaries[0].events[0].response, "They accept help");
  const visible = getPrivateSummaries(saved, "alex");
  visible[0].observations = "Changed outside the store";
  assert.notEqual(saved.summaries[0].observations, visible[0].observations);
  assert.throws(
    () => addSupportSummary(saved, "alex", input(), now, "support-test"),
    /already saved/,
  );
});

test("bounded summaries reject excess notes, unknown steps, and exhaustion without dropping older records", () => {
  const data = createCrewData(now);
  assert.throws(() =>
    addSupportSummary(
      data,
      "alex",
      { ...input(), observations: "x".repeat(2001) },
      now,
    ),
  );
  assert.throws(() =>
    addSupportSummary(
      data,
      "alex",
      {
        ...input(),
        events: [{ stepId: "invented" as "safety", response: "Invalid" }],
      },
      now,
    ),
  );
  let full = data;
  for (let index = 0; index < MAX_SUPPORT_SUMMARIES; index++)
    full = addSupportSummary(full, "alex", input(), now, `support-${index}`);
  assert.equal(full.summaries.length, MAX_SUPPORT_SUMMARIES);
  assert.throws(
    () => addSupportSummary(full, "alex", input(), now, "support-overflow"),
    /up to 30/,
  );
  assert.equal(full.summaries[0].id, "support-0");
});

test("crew snapshots round-trip independently, including configured onboard instructions", () => {
  const base = createCrewData(now);
  const configured = updateMedicalConfig(base, {
    lead: "Mission-approved medical role",
    channel: "Mission-approved channel from the operations briefing",
    backup: "Designated backup from the onboard checklist",
    instructions: "Use the approved emergency procedure for this mission.",
  });
  const saved = addSupportSummary(
    configured,
    "alex",
    input(),
    now,
    "support-roundtrip",
  );
  assert.deepEqual(parse(saved), saved);
  assert.equal(base.medical.lead, "Designated onboard medical lead");
  assert.throws(() => updateMedicalConfig(base, { ...base.medical, lead: "" }));
  assert.throws(() =>
    updateMedicalConfig(base, {
      ...base.medical,
      instructions: "x".repeat(1501),
    }),
  );
  assert.notEqual(CREW_STORAGE_KEY, "still-here:albums:v1");
  const family = {
    version: 1,
    pages: [],
    drafts: {},
    checkIns: [],
    readReplyIds: [],
  };
  const raw = JSON.stringify(family);
  assert.throws(() => parseCrewData(raw));
  assert.equal(raw, JSON.stringify(family));
});

test("invalid snapshots are rejected as a whole, including unauthorized metadata and duplicate IDs", () => {
  const valid = addSupportSummary(
    createCrewData(now),
    "alex",
    input(),
    now,
    "support-validated",
  );
  const badCases: ((data: CrewData) => void)[] = [
    (data) => {
      data.plans.alex.ownerId = "jordan";
    },
    (data) => {
      data.plans.alex.strategies[0].shared = "yes" as unknown as boolean;
    },
    (data) => {
      data.plans.alex.strategies[0].text = "x".repeat(301);
    },
    (data) => {
      data.plans.alex.strategies[0].text = " ";
    },
    (data) => {
      data.summaries.push(structuredClone(data.summaries[0]));
    },
    (data) => {
      data.summaries[0].events[0].stepId = "not-a-step" as "safety";
    },
    (data) => {
      data.summaries[0].crewmateId = data.summaries[0].ownerId;
    },
    (data) => {
      data.summaries[0].feeling = "cleared" as "better";
    },
    (data) => {
      (data.plans.alex as unknown as Record<string, unknown>).privateDiagnosis =
        "Unexpected field";
    },
  ];
  for (const mutate of badCases) {
    const broken = structuredClone(valid);
    mutate(broken);
    assert.throws(() => parse(broken));
  }
  assert.deepEqual(parse(valid), valid);
});

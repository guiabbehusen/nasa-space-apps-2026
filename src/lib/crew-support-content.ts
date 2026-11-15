/**
 * Authored demonstration paths, adapted from the sources below.
 * Pending clinical and mission-specific review; never a diagnostic or treatment engine.
 */
export type SituationId = "anxiety" | "overload" | "conflict" | "unsure";
export type SupportStepId =
  | "safety"
  | "consent"
  | "listen"
  | SituationId
  | "connect"
  | "check"
  | "refused"
  | "medical"
  | "emergency"
  | "finish";

/** Short alias for callers that treat the authored paths as a state graph. */
export type StepId = SupportStepId;

export type SupportReference = {
  title: string;
  url: string;
  section: string;
};
export type SupportChoice = {
  id: string;
  label: string;
  next: SupportStepId | "path" | "review";
};
export type SupportStep = {
  id: SupportStepId;
  title: string;
  action: string;
  say: string;
  why: string;
  references: SupportReference[];
  choices: SupportChoice[];
};

const WHO_URL = "https://www.who.int/publications/i/item/9789241548205";
const PFA_URL =
  "https://www.ptsd.va.gov/disaster_events/for_providers/PFA/PFA_V2.pdf";
const VA_EARLY_URL =
  "https://www.ptsd.va.gov/disaster_events/for_providers/early_intervention_tx.asp";

const who = (section: string): SupportReference => ({
  title: "WHO · Psychological First Aid: Guide for Field Workers (2011)",
  url: WHO_URL,
  section,
});
const pfa = (section: string): SupportReference => ({
  title: "NCTSN / National Center for PTSD · Field Operations Guide (2006)",
  url: PFA_URL,
  section,
});
const early = (section: string): SupportReference => ({
  title:
    "National Center for PTSD · Early Interventions Following Disaster Events",
  url: VA_EARLY_URL,
  section,
});

export const SUPPORT_CONTENT_VERSION = "2026-11-15-demo-1";
export const SUPPORT_CONTENT_NOTICE =
  "Demonstration only · Pending clinical and mission-specific review. Fixed guidance, not diagnosis, treatment, or medical clearance.";

export const SITUATIONS: {
  id: SituationId;
  title: string;
  description: string;
}[] = [
  {
    id: "anxiety",
    title: "Anxiety or agitation",
    description: "Offer calm, practical company.",
  },
  {
    id: "overload",
    title: "Emotional overload",
    description: "Make room for one manageable choice.",
  },
  {
    id: "conflict",
    title: "Crew conflict",
    description: "Support space and a neutral next contact.",
  },
  {
    id: "unsure",
    title: "Not sure",
    description: "Start by asking what they need.",
  },
];

export const SUPPORT_STEPS: Record<SupportStepId, SupportStep> = {
  safety: {
    id: "safety",
    title: "First, check safety",
    action:
      "Check for serious physical symptoms, such as chest pain, breathing difficulty, collapse, seizure, sudden confusion or weakness, or immediate risk of self-harm or harm to others.",
    say: "Do you need urgent medical help?",
    why: "Physical concerns take priority; a psychological cause cannot be assumed.",
    references: [
      who("Sections 1.3 and 3.3 · printed pp. 5 and 18–20"),
      pfa("Safety and Comfort · printed pp. 27–29"),
    ],
    choices: [
      {
        id: "danger",
        label: "A serious symptom or immediate danger",
        next: "emergency",
      },
      {
        id: "unsure",
        label: "I’m unsure about symptoms or safety",
        next: "medical",
      },
      {
        id: "no-danger",
        label: "No immediate concern noticed",
        next: "consent",
      },
    ],
  },
  consent: {
    id: "consent",
    title: "Ask before helping",
    action: "Ask permission before offering help.",
    say: "Would you like me to stay?",
    why: "Support should preserve choice and personal space.",
    references: [pfa("Contact and Engagement · printed pp. 23–25")],
    choices: [
      { id: "accepted", label: "They accept help", next: "listen" },
      { id: "declined", label: "They decline help", next: "refused" },
      {
        id: "unable",
        label: "They cannot respond or I’m concerned",
        next: "medical",
      },
    ],
  },
  listen: {
    id: "listen",
    title: "Let them set the pace",
    action: "Listen without requesting details they do not want to share.",
    say: "What would help most right now?",
    why: "Their immediate needs guide practical help.",
    references: [who("Sections 1.2 and 3.3 · printed pp. 3 and 21–22")],
    choices: [
      { id: "continue", label: "They want to continue", next: "path" },
      { id: "stop", label: "They want to stop", next: "refused" },
      {
        id: "concern",
        label: "A physical or safety concern has appeared",
        next: "medical",
      },
    ],
  },
  anxiety: {
    id: "anxiety",
    title: "Offer a quieter moment",
    action: "Offer a quieter safe spot, if wanted and operationally possible.",
    say: "Would less noise feel more comfortable?",
    why: "Reducing avoidable stimulation can make supportive contact easier.",
    references: [pfa("Stabilization · printed pp. 49–51")],
    choices: [
      { id: "accepted", label: "They welcome this", next: "connect" },
      { id: "declined", label: "They want no further help", next: "refused" },
      {
        id: "concern",
        label: "Concern remains or is increasing",
        next: "medical",
      },
    ],
  },
  overload: {
    id: "overload",
    title: "One manageable thing",
    action: "Offer to reduce one noncritical demand, with their agreement.",
    say: "Shall we take one thing at a time?",
    why: "Small practical choices can reduce competing demands.",
    references: [who("Link · printed pp. 24–25")],
    choices: [
      {
        id: "accepted",
        label: "They choose one small action",
        next: "connect",
      },
      { id: "declined", label: "They want no further help", next: "refused" },
      {
        id: "concern",
        label: "Concern remains or is increasing",
        next: "medical",
      },
    ],
  },
  conflict: {
    id: "conflict",
    title: "Make space for a pause",
    action: "Offer a pause and access to a neutral, agreed support person.",
    say: "Would some space or another crewmate help?",
    why: "Chosen support protects agency; this script does not mediate disputes.",
    references: [
      who("Respect safety, dignity and rights · printed pp. 7–9"),
      early(
        "Psychological First Aid · safety, practical assistance and social support",
      ),
    ],
    choices: [
      {
        id: "accepted",
        label: "They agree to a pause or contact",
        next: "connect",
      },
      { id: "declined", label: "They want no further help", next: "refused" },
      {
        id: "danger",
        label: "There is a threat or immediate danger",
        next: "emergency",
      },
    ],
  },
  unsure: {
    id: "unsure",
    title: "You do not need a label",
    action:
      "Offer quiet company without naming or interpreting their experience.",
    say: "Would you prefer company or some space?",
    why: "Labels are unnecessary for listening and practical assistance.",
    references: [
      who("What PFA is and is not · printed pp. 3–4"),
      early(
        "Psychological First Aid · supportive rather than therapeutic focus",
      ),
    ],
    choices: [
      {
        id: "company",
        label: "They choose company or practical help",
        next: "connect",
      },
      { id: "space", label: "They choose space", next: "refused" },
      {
        id: "concern",
        label: "I’m still concerned or unsure",
        next: "medical",
      },
    ],
  },
  connect: {
    id: "connect",
    title: "Connect with chosen support",
    action: "Offer a support contact they choose from their authorized plan.",
    say: "Who would you like beside you?",
    why: "Chosen support can continue beyond this conversation.",
    references: [who("Link · printed pp. 24–28")],
    choices: [
      { id: "chosen", label: "A next contact is agreed", next: "check" },
      {
        id: "declined",
        label: "They do not want further help",
        next: "refused",
      },
      { id: "medical", label: "They want medical support", next: "medical" },
    ],
  },
  check: {
    id: "check",
    title: "Ask, without interpreting",
    action:
      "Ask how things feel; record their words without interpreting them.",
    say: "Better, about the same, or worse?",
    why: "A feeling change is not a diagnosis or medical clearance.",
    references: [
      pfa("Core Actions and Stabilization · printed pp. 19 and 49–51"),
      early("Immediate actions · evidence limitations and stepped support"),
    ],
    choices: [
      { id: "better", label: "Feeling better", next: "finish" },
      { id: "same", label: "About the same", next: "medical" },
      { id: "worse", label: "Feeling worse", next: "medical" },
    ],
  },
  refused: {
    id: "refused",
    title: "Respect their choice",
    action:
      "Respect the refusal. Remain available; new safety concerns need medical support.",
    say: "I respect that. You can ask later.",
    why: "Declining support does not remove future access to help.",
    references: [
      who("Who is PFA for? and ethical guidance · printed pp. 4 and 8–9"),
    ],
    choices: [
      { id: "end", label: "End this guide", next: "review" },
      {
        id: "concern",
        label: "A safety concern has appeared",
        next: "medical",
      },
    ],
  },
  medical: {
    id: "medical",
    title: "Bring in medical support",
    action:
      "Use Get Medical Support to contact the designated onboard medical lead.",
    say: "I would like us to get medical advice.",
    why: "Uncertainty or persisting concerns exceed a peer-support script.",
    references: [
      pfa("Safety and Comfort; Stabilization · printed pp. 28 and 51"),
    ],
    choices: [
      {
        id: "urgent",
        label: "A serious symptom or immediate danger",
        next: "emergency",
      },
      { id: "end", label: "End this guide", next: "review" },
    ],
  },
  emergency: {
    id: "emergency",
    title: "Use the emergency channel now",
    action:
      "Activate the approved onboard emergency protocol now. Stay nearby only if safe; do not wait for Earth.",
    say: "I’m getting urgent help now.",
    why: "Immediate physical danger requires emergency support, not routine psychological guidance.",
    references: [
      who("Immediate advanced support · printed p. 5"),
      pfa("Safety and Comfort · printed pp. 27–29"),
    ],
    choices: [{ id: "end", label: "End this guide", next: "review" }],
  },
  finish: {
    id: "finish",
    title: "Close with their choice",
    action:
      "Agree a next contact, if wanted. Review private notes before saving.",
    say: "What would you like to happen next?",
    why: "This closes a conversation, not a medical assessment.",
    references: [
      who("Link · printed pp. 24–28"),
      pfa("Confidentiality · printed pp. 24–25"),
    ],
    choices: [
      { id: "review", label: "Prepare a private summary", next: "review" },
    ],
  },
};

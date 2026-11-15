"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HandHeart,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  Plus,
  ShieldPlus,
  Sparkles,
  Trash2,
  Users,
  Wind,
} from "lucide-react";
import {
  SUPPORT_CONTENT_NOTICE,
  SUPPORT_CONTENT_VERSION,
  SUPPORT_STEPS,
  SITUATIONS,
  type SituationId,
  type SupportStepId,
} from "@/lib/crew-support-content";
import {
  CREW_MEMBERS,
  CREW_STORAGE_KEY,
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
  type CrewId,
  type Escalation,
  type Feeling,
  type MedicalConfig,
  type SupportEvent,
  type SupportPlan,
  type SupportSummary,
} from "@/lib/crew-support";
import { formatDate, hasCrisisLanguage } from "@/lib/model";
import CrewOffline from "./CrewOffline";
import "./crew-support.css";

type Panel =
  | "landing"
  | "guide"
  | "plan"
  | "config"
  | "medical"
  | "end"
  | "review"
  | "summaries";
type Props = { headingRef: RefObject<HTMLHeadingElement | null> };
const feelingLabels = {
  better: "Feeling better",
  same: "About the same",
  worse: "Feeling worse",
};
const categoryNames = {
  strategies: "Strategies that help",
  avoid: "Approaches to avoid",
  contacts: "Support contacts",
};
const situationIcons = {
  anxiety: Wind,
  overload: Sparkles,
  conflict: Users,
  unsure: MessageCircle,
};
const crewName = (id: CrewId) =>
  CREW_MEMBERS.find((person) => person.id === id)!.name;

function SharedPlan({ plan, title }: { plan: SupportPlan; title: string }) {
  const shared = getSharedPlan(plan);
  return (
    <details className="crew-shared-plan">
      <summary>
        <LockKeyhole size={16} />
        {title}
      </summary>
      <p>
        Only entries authorized by {crewName(shared.ownerId)} appear here. Ask
        before using a strategy or contacting someone.
      </p>
      {(Object.keys(categoryNames) as (keyof typeof categoryNames)[]).map(
        (key) => (
          <section key={key}>
            <h3>{categoryNames[key]}</h3>
            {shared[key].length ? (
              <ul>
                {shared[key].map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            ) : (
              <p>No information shared.</p>
            )}
          </section>
        ),
      )}
    </details>
  );
}

function PlanEditor({
  plan,
  onSave,
}: {
  plan: SupportPlan;
  onSave: (plan: SupportPlan) => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(plan));
  const [message, setMessage] = useState("");
  return (
    <form
      className="crew-plan-editor"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          onSave({ ...draft, updatedAt: new Date().toISOString() });
          setMessage("Your plan and sharing choices are saved on this device.");
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "This plan could not be saved.",
          );
        }
      }}
    >
      <p className="crew-intro">
        Prepare this while you feel ready. Choose each entry you authorize a
        crewmate to see.
      </p>
      <p className="crew-privacy">
        <LockKeyhole size={16} />
        Sharing is off for every new entry. Unchecked entries stay out of the
        crewmate view.
      </p>
      {(Object.keys(categoryNames) as (keyof typeof categoryNames)[]).map(
        (key) => (
          <fieldset className="crew-plan-category" key={key}>
            <legend>{categoryNames[key]}</legend>
            {draft[key].map((entry, index) => (
              <div className="crew-plan-entry" key={entry.id}>
                <label htmlFor={entry.id}>
                  {categoryNames[key]} · {index + 1}
                </label>
                <textarea
                  id={entry.id}
                  value={entry.text}
                  maxLength={300}
                  required
                  rows={2}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      [key]: draft[key].map((item) =>
                        item.id === entry.id
                          ? { ...item, text: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
                <div className="crew-entry-controls">
                  <label>
                    <input
                      type="checkbox"
                      checked={entry.shared}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          [key]: draft[key].map((item) =>
                            item.id === entry.id
                              ? { ...item, shared: event.target.checked }
                              : item,
                          ),
                        })
                      }
                    />
                    Share this entry with a crewmate
                  </label>
                  <button
                    type="button"
                    className="crew-icon-button"
                    aria-label={`Remove ${categoryNames[key].toLowerCase()} entry ${index + 1}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        [key]: draft[key].filter(
                          (item) => item.id !== entry.id,
                        ),
                      })
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
            <button
              className="crew-text-button"
              type="button"
              disabled={draft[key].length >= 8}
              onClick={() =>
                setDraft({
                  ...draft,
                  [key]: [
                    ...draft[key],
                    { id: crypto.randomUUID(), text: "", shared: false },
                  ],
                })
              }
            >
              <Plus size={16} />
              Add entry
            </button>
          </fieldset>
        ),
      )}
      {isSupportPlan(draft) ? (
        <SharedPlan plan={draft} title="Preview the authorized view" />
      ) : (
        <p className="crew-small">
          Complete or remove blank entries to preview the authorized view.
        </p>
      )}
      <div className="crew-form-footer">
        <button className="primary-button" type="submit">
          <Check size={17} />
          Save my support plan
        </button>
        <p role="status">{message}</p>
      </div>
    </form>
  );
}

function MedicalInstructions({ config }: { config: MedicalConfig }) {
  return (
    <div className="crew-medical-instructions">
      <p>
        <strong>{config.lead}</strong>
      </p>
      <dl>
        <dt>Onboard channel</dt>
        <dd>{config.channel}</dd>
        <dt>Backup</dt>
        <dd>{config.backup}</dd>
        <dt>Mission instructions</dt>
        <dd>{config.instructions}</dd>
      </dl>
      <p className="crew-small">
        Instructions only. This app does not place a call or send an alert.
      </p>
    </div>
  );
}

function MedicalEditor({
  config,
  onSave,
}: {
  config: MedicalConfig;
  onSave: (config: MedicalConfig) => void;
}) {
  const [draft, setDraft] = useState(config);
  const [message, setMessage] = useState("");
  const fields = [
    { key: "lead", label: "Designated onboard medical lead", max: 200 },
    { key: "channel", label: "Onboard contact channel", max: 300 },
    { key: "backup", label: "Backup contact or procedure", max: 300 },
    {
      key: "instructions",
      label: "Mission-approved activation instructions",
      max: 1500,
    },
  ] as const;
  return (
    <form
      className="crew-config-form"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          onSave(draft);
          setMessage("Contact instructions saved on this device.");
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "These instructions could not be saved.",
          );
        }
      }}
    >
      <p className="crew-intro">
        Replace these demonstration placeholders with instructions approved for
        your mission. This form does not validate clinical or operational
        suitability.
      </p>
      {fields.map(({ key, label, max }) => (
        <label className="crew-field" key={key}>
          {label}
          <textarea
            rows={key === "instructions" ? 4 : 2}
            required
            maxLength={max}
            value={draft[key]}
            onChange={(event) =>
              setDraft({ ...draft, [key]: event.target.value })
            }
          />
        </label>
      ))}
      <button className="primary-button" type="submit">
        <Check size={17} />
        Save contact instructions
      </button>
      <p role="status">{message}</p>
    </form>
  );
}

export default function CrewSupport({ headingRef }: Props) {
  const [data, setData] = useState<CrewData>(() => createCrewData());
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [panel, setPanel] = useState<Panel>("landing");
  const [actor, setActor] = useState<CrewId>("alex");
  const [target, setTarget] = useState<CrewId>("jordan");
  const [situation, setSituation] = useState<SituationId | null>(null);
  const [step, setStep] = useState<SupportStepId>("safety");
  const [history, setHistory] = useState<SupportStepId[]>([]);
  const [choice, setChoice] = useState("");
  const [events, setEvents] = useState<SupportEvent[]>([]);
  const [feeling, setFeeling] = useState<Feeling>(null);
  const [escalation, setEscalation] = useState<Escalation>(null);
  const [active, setActive] = useState(false);
  const [observations, setObservations] = useState("");
  const [actions, setActions] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [notice, setNotice] = useState("");
  const [openedSummary, setOpenedSummary] = useState<string | null>(null);
  const lastStored = useRef<string | null>(null);
  const blocked = useRef(false);
  const beforeMedical = useRef<Panel>("landing");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CREW_STORAGE_KEY);
      lastStored.current = raw;
      if (raw) setData(parseCrewData(raw));
    } catch {
      blocked.current = true;
      setStorageError(
        "Saved support data could not be read. The original is untouched. Guides remain available; changes cannot be saved in this session.",
      );
    }
    setReady(true);
    const changed = (event: StorageEvent) => {
      if (
        (event.key === CREW_STORAGE_KEY || event.key === null) &&
        event.newValue !== lastStored.current
      ) {
        blocked.current = true;
        setStorageError(
          "Another tab changed support data. Your notes remain here; reload after keeping any unsaved words. Work in one tab to save changes.",
        );
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    headingRef.current?.focus({ preventScroll: true });
  }, [panel, step, actor, headingRef]);

  const persist = (next: CrewData) => {
    if (!ready || blocked.current)
      throw new Error(
        "Saving is unavailable. Your original support data has not been replaced.",
      );
    try {
      if (localStorage.getItem(CREW_STORAGE_KEY) !== lastStored.current)
        throw new Error(
          "Support data changed in another tab. Keep your unsaved words and reload.",
        );
      const raw = JSON.stringify(next);
      parseCrewData(raw);
      localStorage.setItem(CREW_STORAGE_KEY, raw);
      lastStored.current = raw;
      setData(next);
      setStorageError("");
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("another tab")
          ? error.message
          : "Browser storage is full or unavailable. These changes have not been saved; keep your unsaved words before leaving.";
      setStorageError(message);
      throw new Error(message);
    }
  };
  const record = (stepId: SupportStepId, response: string) =>
    setEvents((previous) => [...previous, { stepId, response }].slice(-80));
  const goToStep = (next: SupportStepId, response?: string) => {
    if (response) record(step, response);
    if (next === "emergency") setEscalation("emergency");
    else if (next === "medical" && escalation !== "emergency")
      setEscalation("medical");
    setHistory((previous) => [...previous, step]);
    setStep(next);
    setChoice("");
    setPanel("guide");
  };
  const start = () => {
    if (!situation) return;
    setActive(true);
    setStep("safety");
    setHistory([]);
    setChoice("");
    setEvents([]);
    setFeeling(null);
    setEscalation(null);
    setObservations("");
    setActions("");
    setNextSteps("");
    setNotice("");
    setPanel("guide");
  };
  const continueGuide = () => {
    if (!choice || !situation) return;
    const response = SUPPORT_STEPS[step].choices.find(
      (item) => item.id === choice,
    )!;
    const next = guardSupportDestination(
      nextSupportStep(step, choice, situation),
      escalation,
    );
    if (next === "review") {
      record(step, response.label);
      setPanel("end");
    } else goToStep(next, response.label);
  };
  const reportFeeling = (value: Exclude<Feeling, null>) => {
    setFeeling(value);
    setNotice(
      value === "better"
        ? "Their report is noted. Feeling better is not a diagnosis or medical clearance."
        : value === "same"
          ? "Their report is noted without interpretation."
          : "Pause routine guidance and use onboard medical support.",
    );
    if (value === "worse")
      goToStep(
        escalation === "emergency" ? "emergency" : "medical",
        "Reported feeling worse",
      );
    else if (step === "check" && panel === "guide") setChoice(value);
  };
  const openMedical = () => {
    if (panel !== "medical") beforeMedical.current = panel;
    if (active)
      record(step, "Viewed medical contact instructions; no automatic contact");
    setPanel("medical");
  };
  const leaveWithoutSaving = () => {
    setActive(false);
    setPanel("landing");
    setNotice("Support ended. No summary was saved or sent.");
  };
  const currentStep = SUPPORT_STEPS[step];
  const lockedToMedical =
    escalation !== null && step !== "medical" && step !== "emergency";
  const summaries = getPrivateSummaries(data, actor);
  const selectedSummary = summaries.find((item) => item.id === openedSummary);
  const title =
    panel === "guide"
      ? currentStep.title
      : panel === "plan"
        ? "My Support Plan"
        : panel === "config"
          ? "Medical contact instructions"
          : panel === "medical"
            ? "Get Medical Support"
            : panel === "end"
              ? "End support, your way"
              : panel === "review"
                ? "Review a private summary"
                : panel === "summaries"
                  ? "My private summaries"
                  : "Support a Crewmate";

  return (
    <section className="crew-support" aria-labelledby="crew-title">
      <div className="crew-toolbar">
        <span className="crew-wordmark">
          <HandHeart size={20} />
          Still Here · Crew support
        </span>
        <div>
          <button
            className="crew-medical-button"
            type="button"
            onClick={openMedical}
          >
            <ShieldPlus size={19} />
            Get Medical Support
          </button>
          {active && (
            <button
              type="button"
              className="crew-end-button"
              onClick={() => setPanel("end")}
            >
              End support
            </button>
          )}
        </div>
      </div>
      <div className="crew-paper">
        <div className="crew-heading">
          {panel !== "landing" && (
            <button
              className="crew-back"
              type="button"
              onClick={() => {
                if (panel === "guide") {
                  if (!history.length) {
                    setPanel("end");
                    return;
                  }
                  setStep(
                    guardSupportDestination(
                      history[history.length - 1],
                      escalation,
                    ) as SupportStepId,
                  );
                  setHistory(history.slice(0, -1));
                  setChoice("");
                } else if (panel === "medical") setPanel(beforeMedical.current);
                else if (panel === "review") setPanel("end");
                else if (panel === "end") setPanel("guide");
                else setPanel("landing");
              }}
            >
              <ArrowLeft size={17} />
              Back
            </button>
          )}
          <h1 id="crew-title" ref={headingRef} tabIndex={-1}>
            {title}
          </h1>
          <p className="crew-demo-notice">{SUPPORT_CONTENT_NOTICE}</p>
        </div>
        {storageError && (
          <p className="crew-warning" role="alert">
            {storageError}
          </p>
        )}
        {escalation && active && (
          <p className="crew-escalation" role="alert">
            <ShieldPlus size={20} />
            {escalation === "emergency"
              ? "Use the onboard emergency protocol now. Do not wait for Earth or continue routine peer guidance."
              : "Medical support remains the next step. A better feeling report does not clear this concern."}
          </p>
        )}

        {panel === "landing" && (
          <>
            <p className="crew-intro">
              Offer a crewmate calm, practical support, one step at a time.
              Check safety first and let them choose whether to accept help.
            </p>
            <div className="crew-context-row">
              <label>
                Demo crew profile
                <select
                  value={actor}
                  onChange={(event) => {
                    const id = event.target.value as CrewId;
                    setActor(id);
                    setTarget(id === "alex" ? "jordan" : "alex");
                    setOpenedSummary(null);
                  }}
                >
                  {CREW_MEMBERS.map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="crew-label">Supporting</span>
                <strong>{crewName(target)}</strong>
                <small>Fictional crew · not the family circle</small>
              </div>
            </div>
            <fieldset className="crew-situations">
              <legend>What kind of support might help?</legend>
              <div>
                {SITUATIONS.map((item) => {
                  const Icon = situationIcons[item.id];
                  return (
                    <label
                      key={item.id}
                      className={
                        situation === item.id
                          ? "crew-situation selected"
                          : "crew-situation"
                      }
                    >
                      <input
                        type="radio"
                        name="support-situation"
                        value={item.id}
                        checked={situation === item.id}
                        onChange={() => setSituation(item.id)}
                      />
                      <Icon size={25} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <span className="crew-selection-mark" aria-hidden="true">
                        {situation === item.id && <Check size={15} />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <button
              className="primary-button crew-start"
              type="button"
              disabled={!situation || !ready}
              onClick={start}
            >
              Start guided support
              <ArrowRight size={18} />
            </button>
            <p className="crew-small">
              Responses stay in this session until you review and save a
              summary. Nothing is sent automatically.
            </p>
            <div className="crew-tools-grid">
              <button type="button" onClick={() => setPanel("plan")}>
                <LockKeyhole size={23} />
                <span>
                  <strong>My Support Plan</strong>
                  <small>Prepare your preferences and sharing choices.</small>
                </span>
                <ArrowRight size={18} />
              </button>
              <button type="button" onClick={() => setPanel("summaries")}>
                <MessageCircle size={23} />
                <span>
                  <strong>My private summaries</strong>
                  <small>Separate from your family albums.</small>
                </span>
                <ArrowRight size={18} />
              </button>
              <button type="button" onClick={() => setPanel("config")}>
                <ShieldPlus size={23} />
                <span>
                  <strong>Medical contact setup</strong>
                  <small>Configure the onboard lead and channel.</small>
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
            <CrewOffline busy={active} />
            <details className="crew-evidence">
              <summary>Sources, purpose & privacy</summary>
              <p>
                These fixed demonstration paths adapt psychological first aid
                principles for design review. They are not a medical protocol,
                diagnosis, prescription, or AI-generated treatment. Clinical and
                mission-specific review is still required.
              </p>
              <p>
                NASA-STD-3001 Volume 1 addresses mission-tailored medical
                capabilities and private support. BMed-103 identifies research
                needs under communication delays and increasing autonomy. These
                motivate this design; they do not establish Still Here’s
                effectiveness or NASA approval.
              </p>
              <ul>
                <li>
                  <a
                    href="https://www.who.int/publications/i/item/9789241548205"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WHO · Psychological First Aid (2011)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.ptsd.va.gov/disaster_events/for_providers/PFA/PFA_V2.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    NCTSN / National Center for PTSD · PFA guide (2006)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nasa.gov/reference/3-0-health-and-medical-care/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    NASA-STD-3001 · Volume 1, section 3
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nasa.gov/reference/6-0-medical-operations/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    NASA-STD-3001 · Volume 1, section 6
                  </a>
                </li>
                <li>
                  <a
                    href="https://humanresearchroadmap.nasa.gov/Gaps/gap.aspx?i=702"
                    target="_blank"
                    rel="noreferrer"
                  >
                    NASA HRR · BMed-103
                  </a>
                </li>
              </ul>
              <p>
                Plans and summaries are stored only in this browser, under a
                separate key. Sharing filters control what this interface shows.
                Demo profiles are not secure accounts: someone with access to
                this browser can inspect its storage. Use fictional data for
                evaluation.
              </p>
              <small>
                Content version {SUPPORT_CONTENT_VERSION}. Source links require
                a connection; the guidance and rationales are bundled offline.
              </small>
            </details>
          </>
        )}

        {panel === "plan" && (
          <PlanEditor
            key={actor}
            plan={data.plans[actor]}
            onSave={(plan) => persist(updateSupportPlan(data, actor, plan))}
          />
        )}
        {panel === "config" && (
          <MedicalEditor
            config={data.medical}
            onSave={(config) => persist(updateMedicalConfig(data, config))}
          />
        )}
        {panel === "medical" && (
          <>
            <p className="crew-intro">
              Use the designated onboard route. If there is immediate danger or
              a serious physical symptom, activate emergency procedures now; do
              not assume a psychological cause.
            </p>
            <MedicalInstructions config={data.medical} />
            <button
              className="secondary-button"
              type="button"
              onClick={() => setPanel(beforeMedical.current)}
            >
              <ArrowLeft size={17} />
              {active ? "Back to support" : "Back to overview"}
            </button>
          </>
        )}

        {panel === "guide" && (
          <>
            <p className="crew-path-label">
              With {crewName(target)} ·{" "}
              {SITUATIONS.find((item) => item.id === situation)?.title}
            </p>
            <div className="crew-action">
              <span className="crew-label">One practical action</span>
              <p>{currentStep.action}</p>
            </div>
            <div className="crew-say">
              <MessageCircle size={22} />
              <div>
                <span className="crew-label">You could say</span>
                <blockquote>“{currentStep.say}”</blockquote>
              </div>
            </div>
            {(step === "medical" || step === "emergency") && (
              <MedicalInstructions config={data.medical} />
            )}
            {step === "safety" && (
              <p className="crew-small">
                This is a brief observation, not a medical assessment or
                clearance. Harm to self or others and unsafe surroundings also
                need urgent support.
              </p>
            )}
            <details className="crew-why" key={step}>
              <summary>Why this step?</summary>
              <p>{currentStep.why}</p>
              <p className="crew-small">
                Adapted demonstration guidance; these sources do not validate
                this spaceflight application.
              </p>
              <ul>
                {currentStep.references.map((source) => (
                  <li key={source.url + source.section}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                    <span>{source.section}</span>
                  </li>
                ))}
              </ul>
            </details>
            {step !== "safety" && (
              <SharedPlan
                plan={data.plans[target]}
                title={`${crewName(target)}’s authorized support plan`}
              />
            )}
            {lockedToMedical ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => goToStep(escalation!)}
              >
                Continue to medical support
                <ArrowRight size={17} />
              </button>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  continueGuide();
                }}
              >
                <fieldset className="crew-responses">
                  <legend>Choose the response you observed</legend>
                  {currentStep.choices.map((item) => (
                    <label
                      key={item.id}
                      className={choice === item.id ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="support-response"
                        checked={choice === item.id}
                        onChange={() => {
                          if (step === "check" && item.id === "worse") {
                            reportFeeling("worse");
                            return;
                          }
                          setChoice(item.id);
                          if (step === "check") setFeeling(item.id as Feeling);
                        }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="crew-guide-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={!choice}
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>
                  <button
                    className="crew-text-button"
                    type="button"
                    onClick={() => setPanel("end")}
                  >
                    End support
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {active && ["guide", "medical"].includes(panel) && (
          <fieldset className="crew-feeling">
            <legend>How do they say they are feeling?</legend>
            <div>
              {(["better", "same", "worse"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={feeling === value}
                  onClick={() => reportFeeling(value)}
                >
                  {feelingLabels[value]}
                </button>
              ))}
            </div>
            <p className="crew-small">
              A personal report, never a diagnosis or medical clearance.
            </p>
          </fieldset>
        )}

        {panel === "end" && (
          <div className="crew-ending">
            <HeartHandshake size={38} />
            <p className="crew-intro">
              You can stop here. If wanted, prepare a private record of what you
              observed and actually did.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setPanel("review")}
            >
              Prepare a private summary
              <ArrowRight size={18} />
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={leaveWithoutSaving}
            >
              End without saving
            </button>
            <p className="crew-small">
              No summary or message is created automatically.
            </p>
          </div>
        )}

        {panel === "review" && (
          <form
            className="crew-summary-form"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                if (!situation) return;
                const input: Omit<SupportSummary, "id" | "createdAt"> = {
                  ownerId: actor,
                  crewmateId: target,
                  situation,
                  observations: observations.trim(),
                  actions: actions.trim(),
                  nextSteps: nextSteps.trim(),
                  feeling,
                  events,
                };
                persist(addSupportSummary(data, actor, input));
                setActive(false);
                setOpenedSummary(null);
                setPanel("summaries");
                setNotice(
                  "Private summary saved on this device. Nothing was sent or added to family albums.",
                );
              } catch (error) {
                setNotice(
                  error instanceof Error
                    ? error.message
                    : "The summary could not be saved.",
                );
              }
            }}
          >
            <p className="crew-intro">
              Review what belongs in this record. Guidance viewed and selected
              responses are not proof that an action occurred.
            </p>
            <p className="crew-summary-meta">
              For {crewName(actor)} only · Supporting {crewName(target)} ·{" "}
              {feeling ? feelingLabels[feeling] : "No feeling report recorded"}
            </p>
            <details className="crew-session-log">
              <summary>Review guidance and responses</summary>
              {events.length ? (
                <ol>
                  {events.map((item, index) => (
                    <li key={index}>
                      <strong>{SUPPORT_STEPS[item.stepId].title}</strong>
                      <span>{item.response}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No responses recorded.</p>
              )}
            </details>
            <label className="crew-field">
              Observations
              <textarea
                rows={3}
                maxLength={2000}
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                placeholder="Only what you saw or what they chose to tell you."
              />
            </label>
            <label className="crew-field">
              Actions actually taken
              <textarea
                rows={3}
                maxLength={2000}
                value={actions}
                onChange={(event) => setActions(event.target.value)}
                placeholder="Describe what you did. Do not infer a diagnosis."
              />
            </label>
            <label className="crew-field">
              Agreed next steps
              <textarea
                rows={3}
                maxLength={2000}
                value={nextSteps}
                onChange={(event) => setNextSteps(event.target.value)}
                placeholder="A chosen contact or follow-up, if agreed."
              />
            </label>
            {hasCrisisLanguage(
              observations + " " + actions + " " + nextSteps,
            ) && (
              <p className="crew-warning" role="alert">
                If these words describe an immediate safety concern, use Get
                Medical Support now. You can keep editing.
              </p>
            )}
            <p className="crew-privacy">
              <LockKeyhole size={17} />
              Saved only for this demo profile in this browser. It is not
              encrypted or a medical record system.
            </p>
            <div className="crew-guide-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={!ready}
              >
                <Check size={17} />
                Save private summary
              </button>
              <button
                className="crew-text-button"
                type="button"
                onClick={leaveWithoutSaving}
              >
                End without saving
              </button>
            </div>
          </form>
        )}

        {panel === "summaries" && (
          <div className="crew-summaries">
            <p className="crew-intro">
              Only summaries belonging to {crewName(actor)} are shown. These
              records never appear in family albums and are never sent
              automatically.
            </p>
            {summaries.length ? (
              <div className="crew-summary-list">
                {[...summaries].reverse().map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={openedSummary === item.id}
                    onClick={() => setOpenedSummary(item.id)}
                  >
                    <span>
                      <strong>Support for {crewName(item.crewmateId)}</strong>
                      <small>
                        {formatDate(item.createdAt)} ·{" "}
                        {SITUATIONS.find((s) => s.id === item.situation)?.title}
                      </small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="crew-empty">
                <LockKeyhole size={30} />
                <p>No private summaries saved.</p>
              </div>
            )}
            {selectedSummary && (
              <article className="crew-saved-summary">
                <h2>Support for {crewName(selectedSummary.crewmateId)}</h2>
                {(["observations", "actions", "nextSteps"] as const).map(
                  (key) => (
                    <section key={key}>
                      <h3>
                        {key === "observations"
                          ? "Observations"
                          : key === "actions"
                            ? "Actions actually taken"
                            : "Agreed next steps"}
                      </h3>
                      <p>{selectedSummary[key] || "Not recorded."}</p>
                    </section>
                  ),
                )}
                <p>
                  {selectedSummary.feeling
                    ? feelingLabels[selectedSummary.feeling]
                    : "No feeling report recorded"}{" "}
                  · Not medical clearance.
                </p>
              </article>
            )}
          </div>
        )}
        {notice && (
          <p className="crew-status" role="status">
            {notice}
          </p>
        )}
      </div>
    </section>
  );
}

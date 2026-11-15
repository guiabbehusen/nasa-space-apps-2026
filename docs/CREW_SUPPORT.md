# Support a Crewmate: demonstration design

Support a Crewmate explores an offline-capable peer-support interaction for long missions. It is **demonstration content pending clinical and mission-specific review**. It does not diagnose, prescribe, assess fitness for duty, establish medical clearance, or replace trained personnel and approved onboard procedures. NASA sources provide design context; they do not endorse Still Here or establish its effectiveness.

## Authored paths and interaction

The bookshelf and navigation open the same dedicated feature. Its four entry choices are **Anxiety or agitation**, **Emotional overload**, **Crew conflict**, and **Not sure**. Every new session starts with safety, regardless of the selected situation. Each guidance screen contains one practical action, suggested speech, response choices, and **Why this step?** with a bundled rationale and source section.

`src/lib/crew-support-content.ts` holds the versioned, authored graph. `src/lib/crew-support.ts` validates inputs and resolves only its declared destinations; `src/components/CrewSupport.tsx` renders it. There is no model inference, free-form generation, clinical scoring, or interpretation of written notes. Choosing a situation does not assign a diagnosis. The crew-conflict branch is a product adaptation, not a mediation protocol.

The main route is safety → permission → listening → selected situation → chosen support → feeling check → closure or medical support. Refusal, medical concerns, and emergency conditions have explicit branches. **Back**, **Continue**, and **End support** let the helper control the interaction. End support is available without completing the route or saving a record.

## Safety, consent, and escalation

Safety comes before routine support. Serious physical symptoms or immediate danger lead to the emergency instructions; uncertainty leads to medical support. The screen explicitly avoids assuming a psychological cause. A report that no concern was noticed is an observation, not a medical assessment.

Permission is requested before assistance. Declining help leads to a respectful closing option; inability to respond or a safety concern leads to medical support. Suggested actions depend on willingness and operational feasibility. The app does not instruct a helper to interrupt critical operations, force disclosure, or administer treatment.

**Get Medical Support** remains available throughout the feature. It displays configurable fields for the designated onboard medical lead, channel, backup, and approved instructions. The supplied values are placeholders to replace before any operational evaluation. Viewing them does not place a call, notify anyone, or confirm that help has been contacted. Emergency guidance directs the helper to the onboard protocol without waiting for Earth communication.

**Feeling better**, **About the same**, and **Feeling worse** record the person's report. Feeling worse redirects to medical support. At the authored check step, an unchanged report also leads to medical support. Once a medical or emergency concern has been raised, navigation and a later better report cannot clear it. Improvement is never interpreted as diagnosis, readiness, or medical clearance.

## Source mapping

The manuals were consulted before authoring the paths. Page numbers below are **printed page numbers**, not PDF viewer offsets. These are brief adaptations for review, not reproductions or astronaut-validated protocols.

| Authored node | Source section consulted                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `safety`      | WHO §§1.3, 3.3, pp. 5, 18–20; NCTSN/NCPTSD Safety and Comfort, pp. 27–29                     |
| `consent`     | NCTSN/NCPTSD Contact and Engagement, pp. 23–25                                               |
| `listen`      | WHO §§1.2, 3.3, pp. 3, 21–22                                                                 |
| `anxiety`     | NCTSN/NCPTSD Stabilization, pp. 49–51                                                        |
| `overload`    | WHO Link, pp. 24–25                                                                          |
| `conflict`    | WHO safety, dignity, and rights, pp. 7–9; VA early-intervention overview; product adaptation |
| `unsure`      | WHO PFA boundaries, pp. 3–4; VA early-intervention overview                                  |
| `connect`     | WHO Link, pp. 24–28                                                                          |
| `check`       | NCTSN/NCPTSD Core Actions and Stabilization, pp. 19, 49–51; VA evidence limitations          |
| `refused`     | WHO recipients and ethical guidance, pp. 4, 8–9                                              |
| `medical`     | NCTSN/NCPTSD Safety and Comfort and Stabilization, pp. 28, 51                                |
| `emergency`   | WHO advanced support, p. 5; NCTSN/NCPTSD Safety and Comfort, pp. 27–29                       |
| `finish`      | WHO Link, pp. 24–28; NCTSN/NCPTSD confidentiality, pp. 24–25                                 |

Primary references: [WHO guide (2011)](https://www.who.int/publications/i/item/9789241548205), [NCTSN/NCPTSD Field Operations Guide, 2nd edition (2006)](https://www.ptsd.va.gov/disaster_events/for_providers/PFA/PFA_V2.pdf), and [VA early-intervention overview](https://www.ptsd.va.gov/disaster_events/for_providers/early_intervention_tx.asp). [SOURCES.md](SOURCES.md) records access details and NASA context. These sources do not validate the app's buttons, routing, permission model, or summary design.

## My Support Plan and private records

Each fictional crewmember has a plan of helpful strategies, approaches to avoid, and support contacts. The intended astronaut prepares it while ready, ahead of a difficult moment. Entries have separate sharing choices; newly added entries begin private. Editing is limited to the selected demo owner's plan. The colleague view receives a projection containing only authorized text, rather than the complete plan object.

At closure, **Prepare a private summary** opens editable observations, actions actually taken, and next steps for review. The session log distinguishes viewed guidance and selected responses from actions that really occurred. Only **Save private summary** persists a record. Ending without saving creates no summary, and nothing is sent or added to a family album. Saved summaries are filtered to their demo owner.

Crew plans, medical settings, and summaries use the separate local-storage key `still-here:crew-support:v1`. They do not share the family-album data model. Loaded browser data is validated before use, and invalid data is preserved rather than silently replaced. Storage failure or conflicting changes in another tab produce a visible message instead of claiming a successful save.

This is local demo privacy, not authentication, access control against someone using the same browser, encryption, a clinical record system, or multi-device synchronization. The profile switch is for demonstration. Anyone with access to the browser or its developer tools can inspect its storage. Do not enter real sensitive medical data into this prototype.

## Offline scope

In a production build over HTTPS or localhost, use **Prepare offline support** while connected. Preparation verifies a complete version-matched app copy. Reload or activate it when prompted, then confirm **Offline support ready on this browser** before disconnecting. A first visit without prior preparation is not supported.

The service worker caches app assets, including the authored paths and rationales. It does not cache support-plan or summary data, external manuals, or reference websites. Local records remain in browser storage independently. Updates wait for explicit activation; the UI defers reloading during support. Clearing browser data, browser eviction, a new device, or an incompatible hosting configuration can remove availability. The production offline workflow must be rehearsed on the intended device; it is not an emergency communications system.

## Review required before operational use

Clinical and mission reviewers must approve wording, escalation thresholds, consent and confidentiality rules, and every fixed branch. Flight operations must supply the correct channels, fallback procedures, training assumptions, and constraints for the vehicle and mission. Human-factors and accessibility evaluation must include distraction, physical symptoms, refusal, communication loss, and emergency navigation.

Real deployment also requires identity and authorization, secure storage and retention, privacy governance, reviewed update/version procedures, and evidence from the intended population. NASA-STD-3001 and BMed-103 motivate attention to autonomy, privacy, and communication delays; they do not establish compliance, efficacy, or closure of a research gap for this demonstration.

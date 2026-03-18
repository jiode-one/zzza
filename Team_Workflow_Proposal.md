# Team Workflow Proposal
**Project:** Sliceza + Extensions (and future Jiode OSS tools)  
**Purpose:** Preserve “Me + You” speed while scaling to a small code team with clear direction, strong agency, and reviewable artifacts.

---

## Principles

### 1) Direction over micromanagement
- You (lead) set **intent + constraints + success criteria**.
- The code team chooses **implementation details**.
- We judge work by **artifacts** (diffs, screenshots, logs), not debate.

### 2) One Pivot Rule
We ship **one intentional direction change per day**.  
Not “no changes,” just **bounded** changes.

### 3) Agency Contract
If the spec doesn’t work in practice, the team is empowered to adapt responsibly—without stalling.

> **Agency Contract (copy/paste)**
>
> If you discover the spec doesn’t work in practice:
> 1) Don’t stall. Implement the closest working version.  
> 2) Leave a short “Spec delta” note in the PR description.  
> 3) Tag the lead on the decision point.  
> 4) We’ll choose the pivot in tomorrow’s alignment.

### 4) Artifacts > arguments
Every task should produce:
- a PR (or a patch)
- a short note explaining what changed
- a way to verify it (test plan + evidence)

---

## Daily Cadence

### Night-before (Lead, 10–20 min)
Create **1–3 tickets max** for tomorrow.

Each ticket has:
- Goal
- Acceptance Criteria
- Non-goals
- Constraints
- Test Plan
- Owner

### Morning alignment (15 min)
A tight ritual to prevent drift.

> **Morning Alignment Agenda**
>
> 1) Today’s North Star (1 sentence)  
> 2) The One Pivot Rule (what’s the pivot, if any?)  
> 3) Ticket titles + acceptance criteria (fast)  
> 4) Risks / unknowns (1–2 minutes)  
> 5) Agency Contract reminder  
> 6) Definition of Done (tests + evidence + PR)

### Midday checkpoint (async, 5–10 min)
Owner drops:
- What’s done
- What changed vs spec (Spec delta, if any)
- Blockers
- Screenshot/log if UI/CLI

### Evening review (Lead, 15–45 min)
- Review diffs
- Run the ticket test plan
- Merge, or return with crisp notes

---

## Ticket Template (copy/paste)

```md
# [Ticket] <Short title>

## Goal
<1–2 sentences>

## Acceptance Criteria
- [ ] ...
- [ ] ...

## Non-goals
- Not doing: ...

## Constraints
- Must keep: ...
- Prefer: ...
- Avoid: ...

## Test Plan
- Command(s):
  - `...`
- Expected:
  - ...
- Evidence:
  - Screenshot / output paste

## Notes
- Links / context:
  - ...
```

---

## PR Template (copy/paste)

```md
## Summary
<What changed + why>

## Ticket
- <link / name>

## Acceptance Criteria Checklist
- [ ] ...
- [ ] ...

## Test Evidence
- Commands run:
  - `...`
- Output / screenshot:
  - ...

## Spec Delta (if any)
- Intended:
- Shipped:
- Rationale:

## Risk / Rollback
- Risk:
- Rollback:
```

---

## Definition of Done (DoD)

A change is “done” when:
- [ ] It meets acceptance criteria
- [ ] It includes test evidence
- [ ] It doesn’t expand scope beyond the ticket
- [ ] It updates docs/changelog if user-facing
- [ ] It keeps “Widely Expected” behaviors unless explicitly changed

---

## Scope Control

**Default scope caps (pick one per ticket):**
- “Max 2 files touched”
- “Max 1 new command”
- “No new deps”
- “No UX changes; logic-only”
- “No refactors unless required for the feature”

---

## Release Rhythm (optional but recommended)

- **Small releases often** (Sliceza already benefits from this).
- Tie release notes to PRs:
  - Each PR includes a short changelog fragment.
  - A release PR rolls fragments into CHANGELOG + tags.

---

## Communication Rules (keeps it fast and kind)

- Assume competence.
- Ask for clarity once, then implement the closest working version.
- If you disagree with a design choice:
  - ship a working path
  - write a “Spec delta” note
  - propose the alternative in the PR

---

## Why this works

This mirrors the current “Lead + Copilot” loop:
- Plan → Implement → Test → Review → Merge
But makes it portable to:
- multiple devs
- multiple parallel tracks
- less emotional friction
- more predictable progress

**Net effect:** speed with coherence.

# SICU mobile form checks — 2026-11-03

Local preview: `http://127.0.0.1:8768/?test=touch-restore` (not a hosted release).
Viewport: 390 × 844, IAB browser tab 13, isolated test origin. No stored clinical/teaching record was edited.

## Results

- Compared `index.html` form controls to `origin/main:index.html` using an HTML parser: 61 original input/textarea/select field instances remain, with no field names added or removed.
- Checked all six tabs (Encounter, Vitals, Meds, Assessment, Presentation, Report). The visible tab panel switches correctly. Tail section on each panel reports `padding-bottom: 112px`; the sticky navigation footer measures 67px high. This gives 45px beyond the requested 96px clearance. The footer remains reachable at the bottom.
- Measured visible buttons across each tab after the style update: none were below 44px. The medication add/remove and copy controls now have a 46px minimum height; the sticky navigation buttons already have a 46px minimum.
- The form's source stores `window.scrollY` by tab before switching and restores the selected tab's saved value. The browser automation's scroll-and-switch measurements were inconsistent (the interaction layer itself scrolled the page and one evaluate call failed because its DOM proxy did not expose native methods). Therefore per-tab scroll restoration is source-verified but not conclusively browser-verified.
- `git diff --check` passes.

## Change

Raised the phone touch target for Add medication, medication-row Remove, Copy summary, and Copy report to 46px. No clinical content, calculations, authentication, cloud settings, or saved records changed.

## Publication state

This CSS adjustment is local and uncommitted. The earlier branch commit remains local. Push/PR publication was denied by the approval reviewer because the GitHub destination was not verified; no retry or alternate publication path was attempted. Firebase/auth/rules and deployment were not touched.

# SICU forms redesign plan

## Target

Follow Henry's 2026-11-03 Slack direction in `#development-daily`: replace the menu-shoved case form with a six-tab, full-screen flow. Preserve all existing form fields, report content, clinical wording, scenario logic, and simulator behavior. The prototype is the visual reference; it was not attached to the direction thread at the time this plan was prepared.

## Implementation sequence

1. **Create the flow shell:** full-height form, one native page scroll region, no room canvas, monitor, vitals strip, or room menu rendered while the form is open. Keep the simulator update loop running. Keep the one-line fictional-data notice and student-mode restrictions visible.
2. **Map all existing content into six state-driven tabs:** Encounter; Vitals; Meds; Assessment; Presentation; Report. Assessment contains the existing critical-care review, lab worksheet, equipment/monitoring, ECG, prehospital/transport/learning, and live assessment panel. Report retains the daily report and print/copy paths. Do not use URL hashes for tab changes.
3. **Navigation and scroll:** mark the selected tab clearly, keep the horizontal tab row usable on narrow screens, save/restore each tab's page scroll position, and add ordered Back/Next footer controls with at least 96 px of content clearance.
4. **Safe exit:** add header Close (×) and Back to room actions; both return to the running room without resetting simulation state. Handle Escape and browser Back/phone back by closing the form only. Remove the Hide form micro-button.
5. **Persistence:** preserve current device drafts and implement debounced save, tab-switch save, close save, offline queue, sync status, online retry, restore, and conflict handling. Do not migrate current local drafts automatically.
6. **Prototype review and verification:** compare against Doctorkali's prototype once shared; check 390 × 844 and narrow/landscape views, each tab, bottom fields, back/close return, no fixed overlap, online/offline behavior, and preservation of simulator state.
7. **Review delivery:** push this feature branch, open one PR, update an existing nonproduction preview only. No merge, production deploy, paid service, new auth provider, or security-rule change.

## Local checkpoint status (2026-11-03)

- **Implemented locally:** full-page form shell; six state-driven tabs with all existing worksheet sections grouped; mobile card treatment for vitals tables; close/back-to-room and browser Back/ Escape exits; local autosave plus save on tab change and close; one Documentation entry in the room menu. The tab row is horizontally scrollable; all other page content remains within the viewport width.
- **Browser verified on isolated loopback origin:** 390 × 844 portrait, 320 × 844 narrow portrait, and 844 × 390 landscape. The page remained the tested viewport width; 320 px overflow measurements were limited to off-screen tabs inside the intentional horizontal tab scroller. All six tabs activated and only their corresponding panel was visible; Assessment and Report panels appeared in their tabs. Close/back-to-room and browser Back returned to the room. No console errors were reported in the local preview. No 3D or clinical code was edited.
- **Not verified:** per-tab scroll restoration under manual touch scrolling; desktop behavior; online/offline cloud autosync; cloud conflict handling; native print output; comparison against Doctorkali's prototype. The Slack direction thread did not include the prototype attachment/link.
- **Current delivery state:** work remains local on `feature/sicu-full-forms-flow`; no push, PR, preview update, merge, or production deploy has occurred.
- **Remaining authorization blocker:** the requested Firestore student-draft path is a new persistent access surface. Exact change requiring per-action approval: allow verified Google-authenticated student accounts (scope not yet defined) to read/write only `students/{uid}/drafts/{patientId}`, together with the matching Firebase client auth/allowlist behavior and Firestore rule. Existing owner-only rules must remain unchanged until that approval is granted. Do not migrate existing local drafts without separate approval.

## Current architecture and blocked dependency

- `index.html` currently uses nine form tabs on mobile and shows all sections on desktop; the form sits in a separate fixed panel. Local drafts use `localStorage` keys `sicuCasePacketPatient1` and `sicuCasePacketPatient2`.
- The current `sicu-cloud-sync.js` has a client allowlist for `hwebservices80@gmail.com` and stores records at `users/{uid}/sicuCasePackets/patient-{n}`. Existing Firestore rules were previously confirmed to restrict the owner account and matching UID.
- The requested student auto-sync path (`students/{uid}/drafts/{patientId}`) would require an explicit change to the allowed-auth policy and Firestore rules so student accounts can write only their own verified-UID drafts. That expands persistent access. No code/config/rules change for that access is included until per-action approval identifies the allowed student-account scope and exact rule change.
- Existing local drafts remain untouched pending separate migration approval.
- The promised prototype is not present in the Slack direction thread. Implement only unambiguous functional requirements until it is provided; flag any conflict rather than guessing.

## Delivery gate

The branch may be reviewed in a nonproduction preview once the prototype is available and the approved persistence/access design is implemented and tested. Until then, keep work local and unmerged; do not publish a partial build as complete.

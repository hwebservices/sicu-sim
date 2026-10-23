# GI Bleed (Upper) — Treatment Algorithm

## DRAFT — clinical review required
Every number, dose, and threshold below is DRAFT until Henry (clinical reviewer) signs off. Written for close-ended, selectable treatment options with conditional branches.

---

## 1. Presentation snapshot (from the sim's admission set)

| Vital | Sim admission (t=0) | Sim deterioration (no treatment) |
|---|---|---|
| NIBP | 96/60 (MAP ≈ 72) | 90 sys at 30 min → 84 sys at 60 min |
| HR | 112 | 120 at 30 min → 128 at 60 min |
| SpO2 | 96% | — |
| RR | 20 | — |
| Temp | 36.9 °C | — |
| Glucose | 145 | — |

**Assessment cues:** melena (and/or hematemesis), tachycardic, borderline hypotensive trending down, BUN/Cr ratio > 30 suggests upper source. Sim target ranges: NIBP 90–120, HR 60–100.

**Working diagnosis:** acute upper GI bleed — ulcer vs. variceal until proven otherwise. Resuscitate first, scope within 24 h.

---

## 2. Decision tree (assess → decide → select)

### Checkpoint A — Resuscitate (first 15 min)
- **IF** hypotensive/tachycardic with active bleeding → THEN select:
  1. `Large-bore IV ×2 — crystalloid resuscitation` *(in sim: NS/LR 500 mL bolus)*
  2. `Type & crossmatch` *(not in sim — VERIFY: add as assessment action)*
  3. `Glasgow-Blatchford score` *(not in sim — VERIFY: risk stratification)*
- **Rule:** restore perfusion first; endoscopy comes after resuscitation.

### Checkpoint B — Transfuse restrictively (the key number)
- **IF** Hb < 7 g/dL → THEN select:
  1. `Blood transfusion (1 unit)` *(in sim: +10/+6 NIBP, −8 HR)* — target Hb 7–9
- **IF** Hb < 8 g/dL AND known cardiovascular disease → THEN select:
  1. `Blood transfusion (1 unit)` — target ≥ 10 in CAD/ischemic patients
- **IF** Hb ≥ 7 (no CAD) and stable → THEN select:
  1. `No transfusion — monitor` (restrictive strategy reduces mortality vs. liberal)
- **VERIFY:** the sim has no Hb field — transfusion decisions here are driven by vitals (NIBP/HR trend). Henry to confirm whether an Hb lab should be added or vitals suffice.

### Checkpoint C — Acid suppression (start immediately, do not delay endoscopy for it)
- **IF** upper GI bleed (non-variceal or unknown) → THEN select:
  1. `IV PPI: 80 mg bolus + 8 mg/h infusion × 72 h` *(not in sim — VERIFY: add as selectable medication)*
  2. `High-dose oral/IV PPI 40 mg BID` (acceptable alternative)
- Pre-endoscopy PPI downstages lesions and reduces need for intervention.

### Checkpoint D — Variceal branch (conditional)
This branch unlocks **IF** cirrhosis/portal hypertension suspected (stigmata of liver disease, known varices).
- **IF** variceal bleeding suspected → THEN select:
  1. `Octreotide 50 mcg IV bolus + 50 mcg/h infusion × 3–5 days` *(not in sim — VERIFY: add)*
  2. `Ceftriaxone 1 g IV daily (SBP prophylaxis in cirrhosis)` *(not in sim — VERIFY)*
  3. `Urgent endoscopy — band ligation` *(not in sim)*
- **Note:** octreotide/somatostatin is NOT for routine non-variceal bleeding — reserve for suspected varices.

### Checkpoint E — Endoscopy timing
- **IF** resuscitated → THEN select:
  1. `Endoscopy within 24 h` *(not in sim — VERIFY: add as definitive action)*
- **IF** unstable despite resuscitation → THEN select:
  1. `CT angiography to localize` *(not in sim)*
  2. `IR embolization / surgery if endoscopy fails` *(not in sim)*
- **Rule:** do NOT do routine urgent (< 12 h) endoscopy — early (≤ 24 h) after resuscitation is the target.

### Checkpoint F — Pre-endoscopy adjunct (conditional)
- **IF** endoscopy planned and stomach full of blood/clot → THEN select:
  1. `Erythromycin 250 mg IV 30–90 min pre-endoscopy` *(not in sim — evidence is mixed; VERIFY with Henry)*
  2. `Proceed without prokinetic`

### Conditional branch — Bradycardia (Henry's requested pattern)
Hidden unless HR < 60.
- **IF** HR < 60 AND (hypotension OR altered mentation OR signs of shock) → THEN select:
  1. `Atropine 1 mg IV` (repeat q3–5 min, max 3 mg) *(not in sim — VERIFY: add)*
  2. `Transcutaneous pacing` *(not in sim)*
  3. `Dopamine infusion 5–20 mcg/kg/min` *(not in sim)*
  4. `Epinephrine infusion 2–10 mcg/min` *(not in sim)*
- **IF** HR < 60 but perfusing → THEN select:
  1. `Monitor — reassess`

### Conditional branch — Massive ongoing bleed
- **IF** instability despite 4+ units → THEN select:
  1. `Activate massive transfusion protocol 1:1:1` *(not in sim)*
  2. `Balloon tamponade (Blakemore) as bridge if variceal and endoscopy unavailable` *(not in sim — VERIFY: high-risk, bridge only)*

---

## 3. Expected outcome (correct sequence)

- **0–30 min:** resuscitated, Hb checked, transfusion started if < 7, IV PPI running → HR easing from 112, NIBP stabilizing (sim: transfusion +10/+6, −8 HR per unit).
- **< 24 h:** endoscopy with clip/thermal therapy (ulcer) or band ligation (varices) → bleeding controlled.
- **72 h:** high-dose PPI course complete; Hb stable 7–9; no rebleed.
- Sim progress → **Improving** when NIBP 90–120 and HR 60–100.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Rebleeding** | Clot dislodged; inadequate endoscopic therapy | Repeat endoscopy; IR embolization; surgery |
| 2 | **Over-transfusion harm** | Liberal transfusion (Hb > 9 without indication) | Restrictive threshold — liberal transfusion worsens mortality |
| 3 | **Aspiration** | Hematemesis + altered mentation | Airway protection before endoscopy |
| 4 | **Variceal bleed missed as ulcer** | No octreotide/antibiotics in cirrhotic | Variceal branch: octreotide + ceftriaxone + banding |
| 5 | **TXA given** | Reflex from trauma protocols | Do NOT use TXA in GI bleeding (HALT-IT: no benefit) |

---

## 5. Best case / worst case

- **Best case:** resuscitated, restrictive transfusion, PPI started, endoscopy < 24 h with successful hemostasis → stable in 24 h, discharge in 2–4 days on oral PPI.
- **Worst case:** unrecognized variceal bleed, liberal transfusion, delayed endoscopy → sim's 60-min set (NIBP 84 sys, HR 128) → exsanguination or aspiration → death.

---

## 6. Source

ACG/ESGE upper GI bleed guidance: restrictive transfusion (Hb < 7 g/dL; < 8 with cardiovascular disease), IV PPI 80 mg bolus + 8 mg/h × 72 h (or 40 mg BID), octreotide 50 mcg bolus + 50 mcg/h for suspected variceal bleeding, ceftriaxone 1 g daily in cirrhosis, endoscopy within 24 h after resuscitation (not routine < 12 h), no TXA in GI bleeding, Glasgow-Blatchford risk stratification.

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| NS/LR 500 mL bolus | ✅ exist |
| Blood transfusion (1 unit) | ✅ exists |
| Norepinephrine infusion | ✅ exists (if MAP < 65) |
| IV PPI 80 mg + infusion | ❌ VERIFY: add |
| Octreotide (variceal branch) | ❌ VERIFY: add |
| Endoscopy < 24 h | ❌ VERIFY: add as definitive action |
| Glasgow-Blatchford / Hb lab | ❌ VERIFY: add (or vitals-only per Henry) |
| Atropine / pacing (bradycardia branch) | ❌ VERIFY: add |

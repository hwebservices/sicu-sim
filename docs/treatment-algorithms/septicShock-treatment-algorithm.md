# Post-op Septic Shock — Treatment Algorithm

## DRAFT — clinical review required
Every number, dose, and threshold below is DRAFT until Henry (clinical reviewer) signs off. Written for close-ended, selectable treatment options with conditional branches.

---

## 1. Presentation snapshot (from the sim's admission set)

| Vital | Sim admission (t=0) | Sim deterioration (no treatment) |
|---|---|---|
| Temp | 38.9 °C | 39.2 °C at 30 min |
| HR | 108 | 115 at 30 min → 122 at 60 min |
| NIBP | 92/58 (MAP ≈ 69) | 84/52 (MAP ≈ 63) at 60 min |
| RR | 22 | — |
| SpO2 | 94% | — |
| Glucose | baseline 142 (not in scenario set) | — |

**Assessment cues:** post-operative patient, fever spike, hypotensive, tachycardic, tachypneic. Distributive (vasodilatory) shock pattern: warm peripheries early, low diastolic pressure, widening pulse pressure. Sim target ranges: NIBP 90–120, HR 60–100, temp 36.5–37.5, SpO2 94–100.

**Working diagnosis:** septic shock = suspected infection + persistent hypotension requiring vasopressors to maintain MAP ≥ 65 mmHg AND lactate > 2 mmol/L despite fluids (Sepsis-3). This sim models vitals only — no lactate field yet.

---

## 2. Decision tree (assess → decide → select)

Checkpoints run in order. At each checkpoint the listed options are the ONLY selectable treatments (close-ended). Conditional branches unlock only when their IF is true.

### Checkpoint A — Confirm shock and source (first 5 min)
- **IF** MAP < 65 (or SBP < 90) + fever + suspected infection → THEN select:
  1. `Draw cultures + start broad-spectrum antibiotics` *(not in sim — VERIFY: add as selectable action)*
  2. `NS 500 mL bolus` *(in sim: +8/+5 NIBP, −4 HR; onset 10 min)*
  3. `LR 500 mL bolus` *(in sim, same effect)*
- **IF** MAP ≥ 65 but febrile/tachycardic → THEN select:
  1. `Draw cultures + start broad-spectrum antibiotics`
  2. `Monitor — reassess in 15 min`

**Rule (Surviving Sepsis Campaign):** antibiotics within **1 hour** of recognizing septic shock; 30 mL/kg crystalloid in first 3 h. In the sim, one 500 mL bolus ≈ 7 mL/kg for a 70 kg adult — expect ~4 boluses to reach 30 mL/kg. **VERIFY:** exact sim bolus count vs. 30 mL/kg target is a tuning question for Henry.

### Checkpoint B — Vasopressor decision (after fluids)
- **IF** MAP still < 65 after ~30 mL/kg crystalloids (or diastolic < 40 suggesting collapsed vascular tone) → THEN select:
  1. `Norepinephrine infusion` *(in sim: +18/+12 NIBP, +8 HR; onset 5 min, peak 15 min)*
  2. `Norepinephrine infusion` + `NS 500 mL bolus` (combined)
- **IF** MAP ≥ 65 on fluids alone → THEN select:
  1. `Hold vasopressor — continue monitoring`
- **IF** MAP < 65 on norepinephrine at high dose → THEN select (escalation, *not in sim* — VERIFY before adding):
  1. `Add vasopressin 0.03 units/min`
  2. `Add epinephrine infusion`
  3. `Reassess fluid responsiveness + consider dobutamine if cardiac dysfunction`

### Checkpoint C — Reassess perfusion (ongoing, every 15–30 min)
- **IF** HR > 100 and temp > 38.5 persisting → THEN select:
  1. `Vancomycin IV` *(in sim: temp −0.8, HR −6; onset 30 min — models source-control/antibiotic effect)*
  2. `Reassess — source control consult (surgery/IR)` *(not in sim)*
- **IF** SpO2 < 90 → THEN select:
  1. `FiO2 +10%` *(in sim: SpO2 +1.5)*
  2. `PEEP +2` *(in sim: SpO2 +1, RR −1)*
- **IF** signs of fluid overload (crackles, rising RR, SpO2 falling on fluids) → THEN select:
  1. `Stop fluids — reassess`
  2. `Norepinephrine infusion` (vasopressor instead of more volume)

### Conditional branch — Bradycardia (Henry's requested pattern)
This branch is **hidden unless** HR < 60.
- **IF** HR < 60 AND (hypotension OR altered mentation OR signs of shock) → THEN select:
  1. `Atropine 1 mg IV` (repeat q3–5 min, max 3 mg) *(not in sim — VERIFY: add)*
  2. `Transcutaneous pacing` *(not in sim)*
  3. `Dopamine infusion 5–20 mcg/kg/min` *(not in sim)*
  4. `Epinephrine infusion 2–10 mcg/min` *(not in sim)*
- **IF** HR < 60 but perfusing well (asymptomatic) → THEN select:
  1. `Monitor — reassess` (no treatment)

### Conditional branch — Tachycardia with hypotension refractory to fluids
- **IF** HR > 120 AND MAP < 65 after fluids + norepinephrine → THEN select:
  1. `Escalate vasopressor (vasopressin/epinephrine)` *(not in sim)*
  2. `Evaluate for occult source / second infection` *(not in sim)*

---

## 3. Expected outcome (correct sequence)

- **0–15 min:** cultures drawn, antibiotics in, first 500–1000 mL crystalloid → HR drifting down from 108, MAP holding ≥ 65.
- **15–60 min:** norepinephrine started if MAP < 65 despite fluids → NIBP returns to 90–120 range, HR < 100, temp trending down after antibiotics (sim: vancomycin temp −0.8, HR −6 over ~90 min).
- **1–6 h:** temp < 38, HR 80–95, MAP 70–85, urine output returning, mentation clearing. Sim progress indicator → **Improving** (all vitals in target ranges).
- Labs (not modeled in sim): lactate clearing ≥ 20% per 2 h, procalcitonin falling.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Fluid overload → pulmonary edema** | Aggressive fluids in a patient with poor cardiac reserve; RR rising, SpO2 falling, crackles | Stop fluids; `FiO2 +10%`; reassess (diuresis is *not in sim*) |
| 2 | **Refractory hypotension** | MAP < 65 despite fluids + norepinephrine | Add vasopressin 0.03 U/min or epinephrine; look for uncontrolled source |
| 3 | **Antibiotic delay → deterioration** | Sim models this: no vancomycin → temp 39.2, HR 115 at 30 min; NIBP 84/52 at 60 min | Antibiotics within 1 h — every hour of delay increases mortality |
| 4 | **Norepinephrine extravasation / arrhythmia** | High-dose or prolonged infusion | Central line; monitor rhythm (not modeled in sim) |
| 5 | **Secondary infection / C. diff** | Broad-spectrum antibiotics | De-escalate once cultures return (*not in sim*) |

---

## 5. Best case / worst case

- **Best case:** antibiotics < 1 h, 30 mL/kg fluids, norepinephrine only briefly → MAP ≥ 65 within 1 h, afebrile within 6–12 h, off pressors by 24–48 h, ICU stay 3–5 days, full recovery.
- **Worst case:** delayed antibiotics + inadequate fluids → MAP 63 and falling, HR 122+, multi-organ failure cascade (rising lactate → AKI → ARDS → DIC) → refractory shock → death. The sim's 60-min no-treatment set (84/52, HR 122) is the top of this slide.

---

## 6. Source

Surviving Sepsis Campaign guidelines (1-hour bundle: broad-spectrum antibiotics ≤ 1 h, 30 mL/kg crystalloids, norepinephrine first-line vasopressor, MAP target ≥ 65 mmHg; vasopressin 0.03 U/min as add-on).

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| NS / LR 500 mL bolus | ✅ exists |
| Norepinephrine infusion | ✅ exists |
| Vancomycin IV (models abx effect) | ✅ exists |
| FiO2 ±10%, PEEP ±2 | ✅ exist |
| Draw cultures / source control | ❌ VERIFY: add as selectable action |
| Vasopressin / epinephrine escalation | ❌ VERIFY: add as escalation options |
| Atropine / pacing (bradycardia branch) | ❌ VERIFY: add |

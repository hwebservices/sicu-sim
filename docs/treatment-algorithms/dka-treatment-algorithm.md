# DKA (Diabetic Ketoacidosis) — Treatment Algorithm

## DRAFT — clinical review required
Every number, dose, and threshold below is DRAFT until Henry (clinical reviewer) signs off. Written for close-ended, selectable treatment options with conditional branches.

---

## 1. Presentation snapshot (from the sim's admission set)

| Vital | Sim admission (t=0) | Sim deterioration (no treatment) |
|---|---|---|
| Glucose | **420 mg/dL** | 380 at 60 min → 340 at 120 min (fluids alone barely move it) |
| HR | 110 | — |
| RR | 24 (Kussmaul) | — |
| NIBP | 104/66 | — |
| SpO2 | 97% | — |
| Temp | 37.2 °C | — |

**Assessment cues:** hyperglycemic, Kussmaul breathing (deep, rapid), fruity/acetone breath, dehydrated, altered mentation possible. DKA triad: glucose > 250 + metabolic acidosis (pH < 7.3, HCO3 < 15) + ketonemia. Sim target ranges: glucose 100–180, HR 60–100.

**Note:** the sim models glucose only — no pH, bicarbonate, anion gap, or K+ fields. The algorithm below needs those labs; **VERIFY:** add K+ (and ideally pH/HCO3) to the sim's model, because the insulin decision is unsafe without K+.

---

## 2. Decision tree (assess → decide → select)

### Checkpoint A — ABCs + confirm DKA (first 10 min)
- **IF** glucose > 250 + Kussmaul + altered → THEN select:
  1. `Airway/breathing assessment — protect airway if obtunded` *(not in sim)*
  2. `Draw labs: VBG (pH, HCO3), BMP (K+, Na+, corrected), anion gap, β-hydroxybutyrate, ECG` *(not in sim — VERIFY: add as assessment action)*
  3. `NS 500 mL bolus` *(in sim: start volume resuscitation immediately)*

### Checkpoint B — Fluids first (always)
- **IF** any DKA confirmed → THEN select:
  1. `NS 500 mL bolus` *(in sim)* — first-hour goal 15–20 mL/kg (~1–1.5 L); repeat boluses
  2. `LR 500 mL bolus` *(in sim — balanced crystalloid is guideline-acceptable)*
- Typical deficit 6–9 L. In the sim this means multiple bolus selections. **VERIFY:** sim bolus-count tuning vs. real fluid targets.

### Checkpoint C — THE potassium gate (before ANY insulin) ⚠️
This is the single most dangerous step in DKA. The insulin option must be **locked** until K+ is known.

- **IF** K+ < 3.3 → THEN select (insulin LOCKED):
  1. `HOLD insulin — replace K+ aggressively until ≥ 3.3` *(not in sim)*
  2. `Continue fluids` *(in sim)*
- **IF** K+ 3.3–5.2 → THEN select:
  1. `Start insulin (see Checkpoint D)` + `Add 20–40 mEq K+ per liter IV fluids once urine output confirmed` *(K+ replacement not in sim — VERIFY: add)*
  2. `Continue fluids`
- **IF** K+ > 5.2 → THEN select:
  1. `Start insulin (see Checkpoint D)` — insulin drives K+ into cells; withhold K+ replacement until < 5.2
- Target K+ 4–5 throughout; recheck q2–4 h. **VERIFY:** sim needs a K+ vital for this gate to be playable.

### Checkpoint D — Insulin (only after Checkpoint C passes)
- **IF** K+ ≥ 3.3 AND moderate/severe DKA → THEN select:
  1. `Insulin infusion` *(in sim: glucose −35; onset 20 min, peak 60 min — models 0.1 U/kg/h)*
  2. `Insulin infusion` + `NS 500 mL bolus` (combined)
- **Rule:** target glucose fall 50–75 mg/dL/h. If glucose not falling ≥ 50 in the first hour, double the infusion rate hourly.
- **IF** glucose < 250 but DKA not resolved (pH < 7.3, AG still open) → THEN select:
  1. `Add dextrose to fluids — KEEP insulin running` *(critical: never stop insulin when glucose normalizes; ketoacidosis outlasts hyperglycemia — not in sim, VERIFY)*
- **IF** mild DKA, alert, stable → THEN select (alternative, *not in sim*):
  1. `Subcutaneous rapid-acting insulin q2–3 h + aggressive fluids`

### Checkpoint E — Bicarbonate (rare)
- **IF** pH < 6.9 → THEN select:
  1. `Sodium bicarbonate 100 mmol in 400 mL sterile water at 200 mL/h` *(not in sim)*
- **IF** pH ≥ 6.9 → THEN select:
  1. `No bicarbonate — fluids + insulin correct the acidosis`

### Checkpoint F — Find the trigger
- **IF** DKA confirmed → THEN select:
  1. `Search for precipitant: infection, missed insulin, MI, new meds` *(not in sim — VERIFY: add as assessment action)*
  2. `Vancomycin IV` *(in sim)* if infection suspected

### Conditional branch — Bradycardia (Henry's requested pattern)
Hidden unless HR < 60. (In DKA, think severe hypokalemia or calcium issues — check K+ first.)
- **IF** HR < 60 AND (hypotension OR altered mentation OR signs of shock) → THEN select:
  1. `Atropine 1 mg IV` (repeat q3–5 min, max 3 mg) *(not in sim — VERIFY: add)*
  2. `Transcutaneous pacing` *(not in sim)*
  3. `Check K+ / Ca2+ immediately — treat the cause` *(not in sim)*
- **IF** HR < 60 but perfusing → THEN select:
  1. `Monitor — reassess`

### Conditional branch — Hypotension
- **IF** MAP < 65 despite fluids → THEN select:
  1. `NS 500 mL bolus` *(in sim)* — DKA hypotension is volume-responsive first
  2. `Norepinephrine infusion` *(in sim)* if still hypotensive after volume repletion

---

## 3. Expected outcome (correct sequence)

- **0–1 h:** 1–1.5 L fluids in, K+ checked, insulin started (K+ permitting) → glucose falling 50–75 mg/dL/h (sim: 420 → ~380–350 over the first hour with insulin).
- **2–6 h:** glucose < 250 → dextrose added, insulin CONTINUED → anion gap closing, Kussmaul easing, mentation clearing.
- **Resolution (not modeled in sim):** pH > 7.3, HCO3 ≥ 18, AG ≤ 12, glucose < 200 → overlap subcutaneous basal insulin 2–4 h BEFORE stopping the drip (the commonest cause of recurrent DKA is stopping the drip without basal on board).
- Sim progress → **Improving** when glucose 100–180 and HR 60–100.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Fatal arrhythmia from hypokalemia** | Insulin started with K+ < 3.3 | NEVER start insulin below 3.3 — replace K+ first; this is the #1 killer in DKA management |
| 2 | **Cerebral edema** | Correcting osmolality > 3 mOsm/kg/h; bicarbonate use | Slow correction; avoid bicarb unless pH < 6.9 |
| 3 | **Recurrent DKA** | Stopping insulin drip without basal overlap | Basal insulin 2–4 h before drip stops |
| 4 | **Hypoglycemia** | Insulin continued after glucose < 250 without dextrose | Add dextrose, keep insulin running |
| 5 | **Fluid overload** | 6–9 L deficit replaced too fast in cardiac/renal disease | Slow the rate; monitor lungs (*not in sim*) |

---

## 5. Best case / worst case

- **Best case:** fluids + K+ gate + insulin within 1 h → glucose < 200 and AG closed in 12–24 h, transition to subcutaneous insulin, discharge in 2–3 days.
- **Worst case:** insulin given with K+ 2.8 → VF arrest; or missed precipitant (sepsis/MI) → the sim's slow untreated drift (420 → 340 over 2 h on fluids alone) continues into coma and death.

---

## 6. Source

ADA Standards of Care — DKA: 15–20 mL/kg/h isotonic fluids first hour; insulin 0.1 U/kg bolus + 0.1 U/kg/h infusion ONLY when K+ ≥ 3.3 mEq/L (hold and replace if < 3.3; 20–40 mEq/L replacement when 3.3–5.2; target K+ 4–5); bicarbonate only if pH < 6.9; add dextrose at glucose < 250 and continue insulin until pH > 7.3, HCO3 ≥ 18, AG ≤ 12.

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| NS/LR 500 mL bolus | ✅ exist |
| Insulin infusion | ✅ exists (glucose −35) |
| Norepinephrine infusion | ✅ exists |
| Vancomycin IV | ✅ exists |
| K+ lab + K+ replacement | ❌ VERIFY: add — the insulin gate needs it |
| pH / HCO3 / anion gap labs | ❌ VERIFY: add for resolution criteria |
| Dextrose add-on at glucose < 250 | ❌ VERIFY: add (keep-insulin rule) |
| Basal overlap before drip stop | ❌ VERIFY: add as transition action |
| Atropine / pacing (bradycardia branch) | ❌ VERIFY: add |

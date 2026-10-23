# Severe Pneumonia — Treatment Algorithm

## DRAFT — clinical review required
Every number, dose, and threshold below is DRAFT until Henry (clinical reviewer) signs off. Written for close-ended, selectable treatment options with conditional branches.

---

## 1. Presentation snapshot (from the sim's admission set)

| Vital | Sim admission (t=0) | Sim deterioration (no treatment) |
|---|---|---|
| SpO2 | 91% | 89% at 30 min → 86% at 60 min |
| RR | 26 | 30 at 60 min |
| Temp | 38.7 °C | 39.1 °C at 30 min |
| HR | 105 | — |
| NIBP | 108/68 | — |
| Glucose | 165 | — |

**Assessment cues:** febrile, tachypneic, hypoxemic, productive cough, focal crackles/consolidation on imaging (not modeled in sim). Severe community-acquired pneumonia (ICU-level: CURB-65 ≥ 3 or PSI class IV–V, or respiratory failure). Sim target ranges: SpO2 94–100, RR 12–20, temp 36.5–37.5.

**Working diagnosis:** severe CAP — empiric antibiotics cover typical + atypical organisms; oxygen and support while cultures guide de-escalation.

---

## 2. Decision tree (assess → decide → select)

### Checkpoint A — Antibiotics immediately (the mortality intervention)
- **IF** severe pneumonia suspected → THEN select:
  1. `Ceftriaxone 1–2 g IV daily + Azithromycin 500 mg IV daily` *(not in sim — the sim has Vancomycin IV only; VERIFY: add this combo as the pneumonia antibiotic option)*
  2. `Beta-lactam + respiratory fluoroquinolone (levofloxacin 750 mg daily)` (alternative)
- **Rule:** first dose as soon as possible — delays increase mortality. Draw blood cultures first, but do NOT delay antibiotics for them.

### Checkpoint B — Resistant-organism branches (conditional)
These unlock only when risk factors are present.

- **IF** MRSA risk (prior MRSA, necrotizing pneumonia, post-influenza) → THEN select:
  1. `Add vancomycin IV` *(in sim: temp −0.8, HR −6 — currently the sim's only antibiotic)*
  2. `Add linezolid` (alternative — *not in sim*)
- **IF** Pseudomonas risk (prior Pseudomonas, bronchiectasis, recent broad-spectrum antibiotics) → THEN select:
  1. `Antipseudomonal beta-lactam (piperacillin-tazobactam or cefepime) + ciprofloxacin or high-dose levofloxacin` *(not in sim — VERIFY)*
- **IF** no MRSA/Pseudomonas risk → THEN select:
  1. `Standard combo only — no broadening` (avoid unnecessary broad-spectrum)

### Checkpoint C — Oxygenation
- **IF** SpO2 < 92 → THEN select:
  1. `FiO2 +10%` *(in sim: SpO2 +1.5)*
  2. `PEEP +2` *(in sim: SpO2 +1, RR −1)*
- **IF** SpO2 92–94 → THEN select:
  1. `Monitor — target SpO2 92–96` (avoid hyperoxia)
- **IF** SpO2 < 90 despite FiO2/PEEP → THEN select:
  1. `Escalate: NIPPV / intubation assessment` *(not in sim — VERIFY)*

### Checkpoint D — Fluids and perfusion (conservative)
- **IF** hypotensive (MAP < 65) → THEN select:
  1. `NS 500 mL bolus` *(in sim)* — reassess; pneumonia lungs flood easily
  2. `Norepinephrine infusion` *(in sim)* if MAP < 65 after cautious fluids (septic shock overlap — see septicShock algorithm)
- **IF** normotensive → THEN select:
  1. `No routine fluids — monitor`

### Checkpoint E — What NOT to do (guardrails as selectable "avoid" options)
- **IF** considering steroids → THEN select:
  1. `No routine corticosteroids` (not recommended for CAP; consider only if refractory septic shock or COPD/asthma indication — *not in sim*)
- **IF** considering macrolide monotherapy with comorbidities → THEN select:
  1. `Do not use macrolide alone` (breakthrough bacteremia risk with resistant strains)

### Checkpoint F — Duration and de-escalation
- **IF** cultures return → THEN select:
  1. `De-escalate to narrowest effective antibiotic` *(not in sim — VERIFY)*
- **IF** clinically stable 48–72 h (afebrile, vitals normalizing) → THEN select:
  1. `Stop antibiotics — minimum 5 days total met` *(not in sim)*

### Conditional branch — Bradycardia (Henry's requested pattern)
Hidden unless HR < 60.
- **IF** HR < 60 AND (hypotension OR altered mentation OR signs of shock) → THEN select:
  1. `Atropine 1 mg IV` (repeat q3–5 min, max 3 mg) *(not in sim — VERIFY: add)*
  2. `Transcutaneous pacing` *(not in sim)*
  3. `Dopamine infusion 5–20 mcg/kg/min` *(not in sim)*
  4. `Epinephrine infusion 2–10 mcg/min` *(not in sim)*
- **IF** HR < 60 but perfusing → THEN select:
  1. `Monitor — reassess`

### Conditional branch — Septic overlap
- **IF** MAP < 65 + lactate > 2 despite fluids → THEN select:
  1. `Follow septicShock algorithm (norepinephrine, 30 mL/kg, 1-h antibiotics)` — severe pneumonia is the commonest cause of septic shock

---

## 3. Expected outcome (correct sequence)

- **0–1 h:** first antibiotic dose in → temp stops climbing (sim: 38.7 → not 39.1), HR easing.
- **6–24 h:** defervescence begins, SpO2 recovering with FiO2/PEEP support (sim: SpO2 back toward 94+), RR < 24.
- **48–72 h:** clinically stable → de-escalate, plan stop at ≥ 5 days.
- Sim progress → **Improving** when SpO2 94–100, RR 12–20, temp 36.5–37.5.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Respiratory failure** | Sim models it: SpO2 86, RR 30 at 60 min untreated | Escalate oxygen → NIPPV/intubation; ICU-level care |
| 2 | **Septic shock** | Pneumonia + MAP < 65, rising lactate | Switch to septicShock algorithm |
| 3 | **Wrong empiric coverage** | MRSA/Pseudomonas risk missed | Add vanco/linezolid or antipseudomonal per branch B |
| 4 | **Fluid overload** | Liberal fluids in infected lungs | Conservative fluids; reassess with each bolus |
| 5 | **C. diff / resistance** | Unnecessarily broad or prolonged antibiotics | De-escalate on cultures; stop at 5 days if stable |

---

## 5. Best case / worst case

- **Best case:** antibiotics within the hour, appropriate empiric combo → afebrile by 48–72 h, weaned off oxygen by day 3–4, 5-day course, full recovery.
- **Worst case:** delayed antibiotics, missed MRSA → sim's 60-min set (SpO2 86, RR 30) → intubation → ventilator-associated events → septic shock → death.

---

## 6. Source

ATS/IDSA community-acquired pneumonia guidelines: empiric beta-lactam (ceftriaxone 1–2 g IV daily) + macrolide (azithromycin 500 mg IV daily) OR beta-lactam + respiratory fluoroquinolone for severe/inpatient CAP; add MRSA (vancomycin/linezolid) or antipseudomonal coverage only with risk factors; first dose ASAP; minimum 5 days if stable 48–72 h; no routine corticosteroids.

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| FiO2 ±10%, PEEP ±2 | ✅ exist |
| NS/LR 500 mL bolus | ✅ exist |
| Norepinephrine infusion | ✅ exists |
| Vancomycin IV | ✅ exists (covers MRSA branch only) |
| Ceftriaxone + azithromycin (core pneumonia abx) | ❌ VERIFY: add — the sim's only antibiotic is vanco |
| Antipseudomonal options | ❌ VERIFY: add |
| De-escalation / stop at 5 days | ❌ VERIFY: add |
| NIPPV / intubation escalation | ❌ VERIFY: add |
| Atropine / pacing (bradycardia branch) | ❌ VERIFY: add |

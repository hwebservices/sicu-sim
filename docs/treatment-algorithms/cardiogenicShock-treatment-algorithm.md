# Cardiogenic Shock — Treatment Algorithm

## DRAFT — clinical review required
Every number, dose, and threshold below is DRAFT until Henry (clinical reviewer) signs off. Written for close-ended, selectable treatment options with conditional branches.

---

## 1. Presentation snapshot (from the sim's admission set)

| Vital | Sim admission (t=0) | Sim deterioration (no treatment) |
|---|---|---|
| NIBP | 82/50 (MAP ≈ 61) | 78 sys at 30 min |
| HR | 118 | 126 at 60 min |
| SpO2 | 90% | 88% at 60 min |
| RR | 24 | — |
| Temp | 36.8 °C | — |
| Glucose | 160 | — |

**Assessment cues:** pump failure, hypotensive, tachycardic, cool/mottled peripheries, pulmonary edema developing (SpO2 90 → 88, RR 24). Cardiogenic profile: LOW cardiac output + HIGH systemic vascular resistance (vs. septic shock's low SVR). Sim target ranges: NIBP 90–120, HR 60–100, SpO2 94–100.

**Working diagnosis:** cardiogenic shock = SBP < 90 (or MAP < 65) + signs of hypoperfusion + evidence of elevated filling pressures / low cardiac index, usually post-MI or acute decompensated heart failure.

---

## 2. Decision tree (assess → decide → select)

### Checkpoint A — Perfusion pressure first (first 10 min)
- **IF** MAP < 65 (sim: 82/50 → MAP ≈ 61) → THEN select:
  1. `Norepinephrine infusion` *(in sim: +18/+12 NIBP, +8 HR; onset 5 min)* — first-line vasopressor in cardiogenic shock (SOAP II: fewer arrhythmias than dopamine)
  2. `Norepinephrine infusion` + `12-lead ECG / troponin` *(not in sim — VERIFY: add as assessment action)*
- **IF** MAP ≥ 65 but signs of hypoperfusion (cool, oliguric, rising lactate) → THEN skip to Checkpoint C (inotrope), do NOT chase pressure with more vasopressor.

### Checkpoint B — Fluids: small and careful (NOT the sepsis playbook)
- **IF** no pulmonary edema AND hypotensive → THEN select:
  1. `NS 250 mL cautious bolus — reassess lungs` *(in sim: only 500 mL bolus exists — VERIFY: add 250 mL option or note)*
  2. `No fluids — start norepinephrine`
- **IF** pulmonary edema present (crackles, SpO2 falling, RR rising) → THEN select:
  1. `No fluids — norepinephrine instead`
- **Rule:** cardiogenic shock is a pump problem, not a tank problem. Large crystalloid boluses worsen pulmonary edema. The sim's +8/+5 per 500 mL bolus should NOT be the main fix here — and Henry should confirm the sim doesn't reward fluid-loading this diagnosis.

### Checkpoint C — Inotropy for low output (the second drug)
- **IF** hypoperfusion persists despite MAP ≥ 65 on norepinephrine (cold, oliguric, lactate rising, low ScvO2) → THEN select:
  1. `Dobutamine 2–3 mcg/kg/min, titrate to 10` *(not in sim — VERIFY: add; titrate to cardiac index/perfusion, NOT to MAP)*
  2. `Reassess — consider milrinone if dobutamine fails` *(not in sim)*
- **VERIFY:** ESC guidance lists inotropes as first-line with norepinephrine added for persistent hypotension; US practice (and this algorithm) leads with norepinephrine for MAP then adds dobutamine for flow. Henry to confirm which sequence the sim teaches.

### Checkpoint D — Fix the cause
- **IF** ACS suspected (ECG/troponin) → THEN select:
  1. `Emergent cath lab — PCI of culprit lesion` *(not in sim — SHOCK trial: early revascularization is the single biggest mortality intervention)*
- **IF** arrhythmia is the cause → THEN select the matching conditional branch (bradycardia below; tachyarrhythmia → cardioversion per ACLS — *not in sim*).
- **IF** mechanical cause (tamponade, acute MR, VSD) → THEN select:
  1. `Urgent echo + surgical/interventional consult` *(not in sim)*

### Checkpoint E — Oxygenation
- **IF** SpO2 < 92 with pulmonary edema → THEN select:
  1. `FiO2 +10%` *(in sim)*
  2. `PEEP +2` *(in sim — cautious: positive pressure helps edema but drops venous return)*
  3. `Sit upright / NIPPV` *(not in sim — VERIFY)*

### Conditional branch — Bradycardia (Henry's requested pattern)
Hidden unless HR < 60.
- **IF** HR < 60 AND (hypotension OR altered mentation OR signs of shock) → THEN select:
  1. `Atropine 1 mg IV` (repeat q3–5 min, max 3 mg) *(not in sim — VERIFY: add)*
  2. `Transcutaneous pacing` *(not in sim)*
  3. `Dopamine infusion 5–20 mcg/kg/min` *(not in sim — note: dopamine is acceptable here specifically for bradycardia/low arrhythmia risk)*
  4. `Epinephrine infusion 2–10 mcg/min` *(not in sim)*
- **IF** HR < 60 but perfusing → THEN select:
  1. `Monitor — reassess`

### Conditional branch — Tachycardia worsening on norepinephrine
- **IF** HR > 130 on norepinephrine → THEN select:
  1. `Add vasopressin 0.03–0.04 U/min (catecholamine-sparing)` *(not in sim)*
  2. `Reduce norepinephrine — prioritize inotropy` *(not in sim)*

---

## 3. Expected outcome (correct sequence)

- **0–30 min:** norepinephrine → MAP ≥ 65 (sim: 82/50 → ~100/62 range), peripheries warming.
- **30–120 min:** dobutamine added for persistent hypoperfusion → cardiac output rising, HR easing from 118, mentation clearing, urine output returning.
- **Hours:** culprit revascularization if ACS → the mortality intervention.
- Sim progress → **Improving** when NIBP 90–120, HR 60–100, SpO2 ≥ 94.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Pulmonary edema from fluids** | 500 mL+ boluses in pump failure; SpO2 falling, RR rising | Stop fluids; upright; diuresis/NIPPV (*not in sim*) |
| 2 | **Tachyarrhythmia on pressors/inotropes** | High-dose norepinephrine or dobutamine | Add vasopressin to spare catecholamines; correct K+/Mg2+ |
| 3 | **Worsening hypotension (sim models it: 78 sys at 30 min)** | No vasopressor started | Norepinephrine early — pressure first, then flow |
| 4 | **Missed ACS → no revascularization** | No ECG/troponin obtained | Cath lab activation — the one intervention that changes mortality |
| 5 | **Dopamine harm** | Dopamine chosen as first-line pressor | Avoid — higher arrhythmia/mortality than norepinephrine (SOAP II) |

---

## 5. Best case / worst case

- **Best case:** norepinephrine → MAP ≥ 65 in 30 min, dobutamine restores output, culprit PCI within 2 h → weaned off support in 24–72 h, EF recovering.
- **Worst case:** fluids instead of pressors → pulmonary edema + persistent hypotension (sim's 60-min set: HR 126, SpO2 88) → multi-organ failure → refractory shock → death or mechanical circulatory support (Impella/ECMO — *not in sim*).

---

## 6. Source

AHA/ACC + ESC cardiogenic shock guidance: norepinephrine first-line vasopressor (MAP ≥ 65; SOAP II), dobutamine 2–10 mcg/kg/min for persistent hypoperfusion titrated to perfusion (not MAP), cautious fluids, emergent revascularization for AMI-cardiogenic shock (SHOCK trial; CULPRIT-SHOCK: culprit-lesion-only PCI).

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| Norepinephrine infusion | ✅ exists |
| NS/LR 500 mL bolus | ✅ exists (VERIFY: add 250 mL cautious option) |
| FiO2 ±10%, PEEP ±2 | ✅ exist |
| Dobutamine infusion | ❌ VERIFY: add (key drug for this diagnosis) |
| Vasopressin add-on | ❌ VERIFY: add |
| Atropine / pacing (bradycardia branch) | ❌ VERIFY: add |
| Cath lab / revascularization | ❌ VERIFY: add as action |

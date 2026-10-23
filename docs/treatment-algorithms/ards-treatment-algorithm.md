# ARDS — Treatment Algorithm

## DRAFT — clinical review required
Every number, dose, and threshold below is DRAFT until Henry (clinical reviewer) signs off. Written for close-ended, selectable treatment options with conditional branches.

---

## 1. Presentation snapshot (from the sim's admission set)

| Vital | Sim admission (t=0) | Sim deterioration (no treatment) |
|---|---|---|
| SpO2 | 88% | 85% at 30 min → 83% at 60 min |
| RR | 28 | 32 at 60 min |
| HR | 104 | — |
| Temp | 37.6 °C | — |
| NIBP | 118/74 | — |
| Glucose | 142 | — |

**Assessment cues:** hypoxemic respiratory failure, tachypneic, accessory-muscle use, bilateral opacities on imaging (not modeled in sim). Berlin definition: acute onset, bilateral opacities, P/F ≤ 300 on PEEP ≥ 5, not fully explained by cardiac failure. Sim target ranges: SpO2 92–98, RR 12–20.

**Note:** current guidelines accept SpO2 88–95% (permissive) to avoid oxygen toxicity; the sim targets 92–98. **VERIFY:** whether the sim's SpO2 target band should be widened to match guideline practice.

---

## 2. Decision tree (assess → decide → select)

### Checkpoint A — Oxygenation first (first 10 min)
- **IF** SpO2 < 90 → THEN select:
  1. `FiO2 +10%` *(in sim: SpO2 +1.5; onset 3 min, persistent)*
  2. `PEEP +2` *(in sim: SpO2 +1, RR −1; onset 5 min, persistent)*
  3. `FiO2 +10%` + `PEEP +2` (combined)
- **IF** SpO2 90–92 → THEN select:
  1. `PEEP +2` (recruit without excess oxygen)
  2. `Monitor — reassess in 10 min`

### Checkpoint B — Lung-protective ventilation (the core of ARDS care)
- **IF** patient intubated/ventilated → THEN select:
  1. `Set tidal volume 6 mL/kg predicted body weight` *(not in sim — VERIFY: add as selectable vent preset)*
  2. `Keep plateau pressure < 30 cmH2O` *(not in sim)*
  3. `Higher PEEP strategy (10–15 cmH2O) for moderate/severe ARDS` *(partially in sim via PEEP +2 button)*
- **VERIFY:** the sim currently has a physical ventilator model but no live vent settings UI — these options need a home before they can be selectable.

### Checkpoint C — Refractory hypoxemia (P/F < 150 on FiO2 ≥ 0.6)
- **IF** SpO2 not improving despite FiO2/PEEP escalation → THEN select:
  1. `Prone positioning ≥ 16 h/day` *(not in sim — VERIFY: add as intervention)*
  2. `Neuromuscular blockade (cisatracurium) ≤ 48 h` *(not in sim — VERIFY)*
  3. `Recruitment maneuver` *(not in sim; guideline support is conditional — VERIFY)*
  4. `ECMO consult (refractory)` *(not in sim)*

### Checkpoint D — Fluids and cause
- **IF** hypotensive or signs of hypoperfusion → THEN select:
  1. `NS 500 mL bolus` *(in sim)* — then reassess; ARDS wants **conservative** fluids once perfusion is adequate
  2. `Norepinephrine infusion` *(in sim)* if MAP < 65 after conservative fluids
- **IF** euvolemic/perfusion adequate → THEN select:
  1. `Conservative fluid strategy — no routine bolus` (guideline: avoid worsening lung edema)
- Treat the trigger: `Vancomycin IV` *(in sim)* if sepsis/pneumonia is the ARDS trigger; search for and treat the underlying cause.

### Conditional branch — Bradycardia (Henry's requested pattern)
Hidden unless HR < 60.
- **IF** HR < 60 AND (hypotension OR altered mentation OR signs of shock) → THEN select:
  1. `Atropine 1 mg IV` (repeat q3–5 min, max 3 mg) *(not in sim — VERIFY: add)*
  2. `Transcutaneous pacing` *(not in sim)*
  3. `Dopamine infusion 5–20 mcg/kg/min` *(not in sim)*
  4. `Epinephrine infusion 2–10 mcg/min` *(not in sim)*
- **IF** HR < 60 but perfusing → THEN select:
  1. `Monitor — reassess`

### Conditional branch — Severe tachypnea / ventilator dyssynchrony
- **IF** RR > 30 despite PEEP/FiO2 → THEN select:
  1. `Propofol sedation` *(in sim: RR −3, HR −5; onset 3 min — models reduced work of breathing)*
  2. `Reassess vent synchrony — consider neuromuscular blockade` *(not in sim)*

---

## 3. Expected outcome (correct sequence)

- **0–30 min:** FiO2/PEEP titrated → SpO2 climbing from 88 toward 92–95, RR easing from 28.
- **1–6 h:** lung-protective ventilation (6 mL/kg PBW, Pplat < 30) + conservative fluids → SpO2 ≥ 92, RR 16–24, work of breathing visibly reduced.
- **24–72 h:** if P/F < 150 → proning ≥ 16 h/day; steady SpO2 92–96 on weaning FiO2.
- Sim progress → **Improving** when SpO2 in 92–98 and RR in 12–20.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Ventilator-induced lung injury** | Tidal volumes > 8 mL/kg PBW, Pplat ≥ 30 | Strict 6 mL/kg PBW; accept permissive hypercapnia (pH ≥ 7.15–7.20) |
| 2 | **Oxygen toxicity** | Prolonged FiO2 1.0 chasing SpO2 99–100 | Accept SpO2 88–95; wean FiO2 first, then PEEP |
| 3 | **Worsening hypoxemia despite escalation** | Sim models this: SpO2 83 at 60 min untreated | Prone; NM blockade ≤ 48 h; ECMO evaluation |
| 4 | **Hemodynamic collapse from high PEEP** | Excessive PEEP → ↓ venous return | Reduce PEEP; fluids/pressors to support MAP |
| 5 | **Barotrauma (pneumothorax)** | High pressures, dyssynchrony | Decompress (needle/tube thoracostomy — *not in sim*) |

---

## 5. Best case / worst case

- **Best case:** early lung-protective ventilation + proning → P/F rising by 48–72 h, extubation in 7–10 days, no fibrosis, full recovery.
- **Worst case:** delayed recognition, high tidal volumes, fluid overload → refractory hypoxemia (SpO2 in low 80s), multi-organ failure → ECMO or death. The sim's untreated 60-min set (SpO2 83, RR 32) is the entry to this path.

---

## 6. Source

ATS/ESICM/SCCM ARDS ventilation guidance + ARDSNet: tidal volume 6 mL/kg predicted body weight, plateau pressure < 30 cmH2O, higher PEEP for moderate/severe ARDS, prone ≥ 16 h/day when P/F < 150 on FiO2 ≥ 0.6, neuromuscular blockade ≤ 48 h early, conservative fluids, ECMO for refractory severe ARDS.

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| FiO2 ±10%, PEEP ±2 | ✅ exist (persistent) |
| Propofol sedation | ✅ exists |
| NS/LR bolus, Norepinephrine | ✅ exist |
| Vent preset 6 mL/kg PBW, Pplat < 30 | ❌ VERIFY: needs vent-settings UI |
| Prone positioning | ❌ VERIFY: add as intervention |
| Cisatracurium NM blockade | ❌ VERIFY: add |
| Atropine / pacing (bradycardia branch) | ❌ VERIFY: add |

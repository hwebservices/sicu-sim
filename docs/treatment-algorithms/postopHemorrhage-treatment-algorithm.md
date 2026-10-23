# Post-op Hemorrhage — Treatment Algorithm

## DRAFT — clinical review required
Every number, dose, and threshold below is DRAFT until Henry (clinical reviewer) signs off. Written for close-ended, selectable treatment options with conditional branches.

---

## 1. Presentation snapshot (from the sim's admission set)

| Vital | Sim admission (t=0) | Sim deterioration (no treatment) |
|---|---|---|
| NIBP | 88/54 (MAP ≈ 65) | 82 sys at 30 min → 78 sys at 60 min |
| HR | 122 | 130 at 30 min → 135 at 60 min |
| SpO2 | 95% | 93% at 60 min |
| RR | 22 | — |
| Temp | 36.4 °C | — |
| Glucose | 150 | — |

**Assessment cues:** post-operative bleeding, hypotensive, markedly tachycardic, narrow pulse pressure, cool peripheries, falling drain output or expanding wound hematoma. Hemorrhagic (hypovolemic) shock pattern. Sim target ranges: NIBP 90–120, HR 60–100, SpO2 94–100.

**Working diagnosis:** hemorrhagic shock from post-operative bleeding — blood loss exceeds the body's compensatory capacity; tachycardia + hypotension = decompensated.

---

## 2. Decision tree (assess → decide → select)

### Checkpoint A — Find the bleeding, get access (first 5 min)
- **IF** active post-op bleeding suspected → THEN select:
  1. `Inspect wound/drains — quantify blood loss` *(not in sim — VERIFY: add as assessment action)*
  2. `Large-bore IV access ×2` *(not in sim — VERIFY)*
  3. `Type & crossmatch — activate transfusion pathway` *(not in sim)*
- **Rule:** blood is the resuscitation fluid in hemorrhagic shock, not crystalloids. Cap crystalloids at ~1–1.5 L — more dilutes clotting factors and worsens coagulopathy.

### Checkpoint B — TXA early (the time-critical drug)
- **IF** within 3 hours of bleeding onset → THEN select:
  1. `Tranexamic acid 1 g IV over 10 min, then 1 g over 8 h` *(not in sim — VERIFY: add; CRASH-2 mortality benefit, ideally within 1 h)*
- **IF** beyond 3 hours → THEN select:
  1. `No TXA — outside the window (may increase harm)` *(guideline: no benefit, possible harm after 3 h)*

### Checkpoint C — Resuscitate with blood
- **IF** hypotensive + tachycardic + ongoing loss → THEN select:
  1. `Blood transfusion (1 unit)` *(in sim: +10/+6 NIBP, −8 HR; onset 15 min — the single most on-target sim button for this diagnosis)*
  2. `Blood transfusion (1 unit)` + `NS 500 mL bolus` *(in sim)* — limited crystalloid bridge only
- **IF** massive bleeding (≥ 4 units/h or ≥ 10 units/24 h anticipated) → THEN select:
  1. `Activate massive transfusion protocol — 1:1:1 (RBC : plasma : platelets)` *(not in sim — VERIFY: add as one selectable action)*
  2. `Give calcium (citrate in blood products chelates calcium)` *(not in sim — VERIFY)*
  3. `Warm the patient — blood/fluid warmers, blankets` *(not in sim)*

### Checkpoint D — Permissive hypotension (until bleeding controlled)
- **IF** bleeding NOT yet controlled AND no head injury → THEN select:
  1. `Accept SBP 80–90 / MAP ~50 — do NOT chase normal pressure` *(not in sim — VERIFY: this is a strategy, needs a UI home)*
  2. `Norepinephrine infusion` *(in sim)* — only if perfusion failing despite blood; vasopressors are NOT the primary fix for hemorrhage
- **IF** traumatic brain injury suspected → THEN select:
  1. `Higher target — MAP ≥ 80 to protect cerebral perfusion` *(VERIFY: exact MAP target for TBI is debated — flag for Henry)*

### Checkpoint E — Stop the bleeding (definitive)
- **IF** bleeding ongoing despite resuscitation → THEN select:
  1. `Return to OR — surgical hemorrhage control` *(not in sim — VERIFY: add as definitive action)*
  2. `Interventional radiology — embolization` *(not in sim)*
- **Rule:** no amount of transfusion replaces source control.

### Checkpoint F — Reassess
- **IF** NIBP ≥ 90 sys AND HR < 110 after blood → THEN select:
  1. `Monitor — reassess q15 min`
- **IF** still deteriorating after 2+ units → THEN select:
  1. `Escalate to MTP 1:1:1`
  2. `OR / IR for source control`

### Conditional branch — Bradycardia (Henry's requested pattern)
Hidden unless HR < 60. (Unusual in hemorrhage — think pre-arrest or neurogenic component.)
- **IF** HR < 60 AND (hypotension OR altered mentation OR signs of shock) → THEN select:
  1. `Atropine 1 mg IV` (repeat q3–5 min, max 3 mg) *(not in sim — VERIFY: add)*
  2. `Transcutaneous pacing` *(not in sim)*
  3. `Epinephrine infusion 2–10 mcg/min` *(not in sim)*
- **IF** HR < 60 but perfusing → THEN select:
  1. `Monitor — reassess`

---

## 3. Expected outcome (correct sequence)

- **0–15 min:** bleeding identified, TXA in (within window), first unit of blood running → HR easing from 122, NIBP stabilizing (sim: each unit +10/+6 sys/dia, −8 HR over ~30 min).
- **15–60 min:** ongoing transfusion matched to loss → NIBP 90–100 sys, HR < 110, mentation improving.
- **1–3 h:** source controlled (OR/IR) → bleeding stops → vitals normalize into sim targets.
- Sim progress → **Improving** when NIBP 90–120, HR 60–100, SpO2 ≥ 94.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Dilutional coagulopathy** | > 1.5 L crystalloids instead of blood | Switch to blood products; 1:1:1 ratio; give TXA early |
| 2 | **Lethal triad (hypothermia + acidosis + coagulopathy)** | Cold fluids, prolonged shock | Warm everything; correct acidosis with perfusion; calcium |
| 3 | **Hypocalcemia** | Multiple units (citrate) → weak contractility, arrhythmia | IV calcium with transfusion (*not in sim*) |
| 4 | **Transfusion reactions / TRALI / TACO** | Any transfusion | Stop transfusion; assess (A-B-C); supportive care |
| 5 | **Re-bleeding after "normal" pressure restored** | Over-resuscitation dislodging clot (why permissive hypotension matters) | Keep SBP 80–90 until source controlled |

---

## 5. Best case / worst case

- **Best case:** TXA < 1 h, early blood, source controlled in OR within 1–2 h → stable by 3–6 h, extubated next day, no coagulopathy.
- **Worst case:** crystalloids only, TXA missed, no source control → sim's 60-min set (NIBP 78 sys, HR 135, SpO2 93) → PEA arrest from exsanguination. In the sim, blood transfusion is the button that matches this diagnosis — fluids alone will not save this patient.

---

## 6. Source

ATLS / damage-control resuscitation: TXA 1 g IV over 10 min + 1 g over 8 h within 3 h (CRASH-2); limit crystalloids (≈1–1.5 L); blood products early with 1:1:1 RBC:plasma:platelets for massive transfusion; permissive hypotension SBP 80–90 (MAP ~50) without TBI; definitive hemorrhage control (surgery/IR).

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| Blood transfusion (1 unit) | ✅ exists — the core button for this diagnosis |
| NS/LR 500 mL bolus | ✅ exist (limited role here) |
| Norepinephrine infusion | ✅ exists (secondary role) |
| TXA 1 g | ❌ VERIFY: add (time-critical) |
| MTP 1:1:1 activation | ❌ VERIFY: add as one action |
| Return to OR / IR embolization | ❌ VERIFY: add as definitive actions |
| Calcium / warming | ❌ VERIFY: add |
| Atropine / pacing (bradycardia branch) | ❌ VERIFY: add |

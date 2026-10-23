# SICU Treatment Algorithms — Index

## DRAFT — clinical review required

Seven close-ended, conditional treatment algorithms for the sicu-sim diagnoses. Every file is DRAFT until Henry (clinical reviewer) signs off. Designed to become selectable in-sim options: each decision point offers 2–5 named treatments, and conditional branches (e.g. bradycardia) unlock only when their trigger is true.

| # | File | One-line summary |
|---|---|---|
| 1 | [septicShock-treatment-algorithm.md](septicShock-treatment-algorithm.md) | Post-op septic shock: 1-h antibiotics + 30 mL/kg crystalloids, norepinephrine when MAP < 65 despite fluids, vasopressin/epi escalation. |
| 2 | [ards-treatment-algorithm.md](ards-treatment-algorithm.md) | ARDS: FiO2/PEEP escalation, lung-protective ventilation (6 mL/kg PBW, Pplat < 30), prone ≥ 16 h/day when P/F < 150, conservative fluids. |
| 3 | [cardiogenicShock-treatment-algorithm.md](cardiogenicShock-treatment-algorithm.md) | Cardiogenic shock: norepinephrine for MAP ≥ 65, cautious fluids only, add dobutamine for persistent low output, emergent revascularization if ACS. |
| 4 | [dka-treatment-algorithm.md](dka-treatment-algorithm.md) | DKA: fluids first, insulin ONLY when K+ ≥ 3.3 (locked below), 0.1 U/kg/h, dextrose at glucose < 250 while continuing insulin, bicarb only if pH < 6.9. |
| 5 | [postopHemorrhage-treatment-algorithm.md](postopHemorrhage-treatment-algorithm.md) | Post-op hemorrhage: TXA 1 g within 3 h, blood over crystalloids, MTP 1:1:1 for massive bleeding, permissive hypotension, definitive source control. |
| 6 | [giBleed-treatment-algorithm.md](giBleed-treatment-algorithm.md) | Upper GI bleed: resuscitate, restrictive transfusion (Hb < 7; < 8 if CAD), IV PPI 80 mg + 8 mg/h, octreotide branch if variceal, endoscopy within 24 h. |
| 7 | [pneumonia-treatment-algorithm.md](pneumonia-treatment-algorithm.md) | Severe pneumonia: ceftriaxone + azithromycin ASAP, MRSA/Pseudomonas branches only with risk factors, oxygen, conservative fluids, 5-day minimum if stable. |

## Cross-cutting patterns (apply to all 7)

- **Bradycardia branch** (in every file): hidden unless HR < 60; symptomatic → Atropine 1 mg IV q3–5 min (max 3 mg) → transcutaneous pacing / dopamine 5–20 mcg/kg/min / epinephrine 2–10 mcg/min (ACLS).
- **MAP < 65 rule**: norepinephrine is the shared first-line vasopressor (except hemorrhage, where blood comes first).
- **Sim mapping**: each file ends with a table of which options already exist as sim buttons vs. which need VERIFY/add decisions.

## Open VERIFY items for Henry (across files)

1. Sim bolus tuning: one 500 mL bolus ≈ 7 mL/kg — how many boluses should 30 mL/kg (sepsis) or 1–1.5 L (DKA first hour) require in-sim?
2. Labs the sim doesn't model yet but algorithms need: K+ (DKA insulin gate — safety-critical), pH/HCO3/anion gap (DKA resolution), Hb (GI bleed transfusion threshold), lactate (shock).
3. New selectable interventions to add: atropine/pacing, dobutamine, vasopressin, TXA, IV PPI, octreotide, ceftriaxone+azithromycin, prone positioning, MTP 1:1:1, endoscopy, OR/IR source control, cultures.
4. ARDS SpO2 target band: sim uses 92–98; guidelines accept 88–95 — widen it?
5. Cardiogenic shock sequence: norepinephrine-first (US practice, used here) vs. inotrope-first (ESC) — confirm which the sim teaches.
6. DKA insulin in sim is one fixed button (glucose −35); real protocol titrates 0.1 U/kg/h and doubles hourly if glucose not falling — confirm the sim simplification.

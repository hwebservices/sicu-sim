# DKA (Diabetic Ketoacidosis) — Treatment Algorithm

## Educational reference — not clinically validated
Educational simulation only; not validated clinical guidance and not a substitute for clinician judgment. These are documentation-only pathways; the simulator does not execute their treatment choices or conditional branches.

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

**Assessment cues:** consider DKA with a history of diabetes or glucose ≥ 200 mg/dL together with ketosis (β-hydroxybutyrate ≥ 3 mmol/L or urine ketones ≥ 2+) and acidosis (pH < 7.3 or bicarbonate < 18 mmol/L). Euglycemic DKA, including SGLT2-associated presentations, is possible. The simulator models glucose and vital signs only; it does not model ketones, pH, bicarbonate, or potassium. Its glucose range is an illustrative scenario target, not a diagnostic or resolution criterion.

**Model limitation:** the simulator has no potassium, ketone, pH, or bicarbonate inputs. An unknown potassium blocks insulin selection in this pathway; the simulator’s Insulin button cannot represent a safe clinical insulin decision.

---

## 2. Decision tree (assess → decide → select)

### Checkpoint A — ABCs + confirm DKA (first 10 min)
- **IF** diabetes/history or glucose ≥ 200 mg/dL plus ketosis and acidosis are present → assess airway, breathing, circulation, obtain indicated laboratory studies and ECG, and evaluate for euglycemic/SGLT2-associated DKA. These diagnostic actions and required labs are not modeled in the simulator.

### Checkpoint B — Fluid resuscitation and reassessment
- Give isotonic crystalloid with frequent reassessment. For adults without cardiac or renal compromise, an initial rate of 500–1,000 mL/h for 2–4 h is a common approach; use smaller boluses and reassess more often when cardiac or renal vulnerability is present. NS and LR buttons exist in the simulator, but the model does not encode weight-based fluid dosing, volume status, or cardiorenal risk. Do not infer a fixed deficit or bolus count from this model.

### Checkpoint C — Potassium gate (before insulin)
An unknown potassium blocks insulin in this educational pathway. Check and monitor potassium during treatment, with appropriate replacement and renal/urine-output safeguards.

- **IF** K+ < 3.5 mmol/L → hold insulin and replace potassium with monitoring until K+ is > 3.5 mmol/L.
- **IF** K+ is > 3.5 mmol/L → insulin may proceed only under the selected protocol, with repeated potassium checks and replacement as indicated. Reapply the hold rule if K+ falls below 3.5 mmol/L during treatment.
- Target K+ 4–5 mmol/L.

Potassium, urine output, replacement, and insulin gating are not modeled in the simulator; its fixed Insulin button must not be interpreted as a clinically selectable DKA treatment.

### Checkpoint D — Insulin and dextrose
- Use a named, locally approved insulin protocol after the potassium gate is satisfied. The simulator’s fixed −35 mg/dL glucose effect does not represent a dose, titration schedule, or validated response.
- Do not double insulin hourly based on glucose alone. Check insulin delivery and biochemical response, then titrate under the named protocol.
- When glucose falls below 250 mg/dL while ketoacidosis is unresolved, add 5–10% dextrose and ordinarily reduce IV insulin to about 0.05 units/kg/h while continuing treatment of ketosis under that protocol. Eligible mild/moderate DKA subcutaneous protocols may use rapid-acting insulin every 1–2 h. These regimens are not modeled in the simulator.
- If actual hypoglycemia occurs, use the local hypoglycemia rescue and recheck protocol, then reassess insulin. This is separate from preventive dextrose added during ongoing DKA treatment.

### Checkpoint E — Bicarbonate (rare)
- **IF** pH < 7.0 → consider bicarbonate only under the selected protocol and clinical oversight. It is not modeled in the simulator.
- Otherwise, bicarbonate is not routine DKA therapy.

### Checkpoint F — Find the trigger
- **IF** DKA confirmed → THEN select:
  1. Assess for an underlying precipitant such as infection, missed insulin, myocardial infarction, or medication change; this assessment is not modeled.
  2. If infection is suspected, choose antimicrobial coverage by source, resistance risk, and local guidance. Vancomycin alone is not generic infection treatment or source control; the simulator does not model source-directed antimicrobial selection.

### Conditional branch — Bradycardia
This branch applies only when bradycardia is causing cardiopulmonary compromise; a rate below 60 alone is not a treatment trigger. Bradycardia is often defined as HR < 50 in this context. Assess airway, breathing, circulation, pulse, ECG, reversible causes, and whether the patient is in cardiac arrest. If symptomatic bradycardia persists despite atropine, escalate to transcutaneous pacing and/or an infusion per current ACLS and local protocol. If pulseless, follow the cardiac-arrest pathway. These actions are not modeled in the simulator.
### Conditional branch — Hypotension
- **IF** hypotension persists → reassess volume/perfusion and possible shock. Give further fluid only when appropriate after reassessment; escalate vasopressor support when indicated by the shock phenotype. The simulator does not model this assessment.

---

## 3. Expected outcome (correct sequence)

- **Early treatment:** fluid volume is reassessed for cardiac/renal risk; potassium is checked and insulin begins only when the potassium gate is satisfied. The fixed simulator trajectories are illustrative, not validated dose-response curves or recovery deadlines.
- As glucose falls below 250 mg/dL, dextrose and protocol-directed insulin adjustment support continued resolution; clinical and biochemical reassessment is required.
- **Resolution (not modeled):** β-hydroxybutyrate < 0.6 mmol/L plus pH ≥ 7.3 or bicarbonate ≥ 18 mmol/L; glucose < 200 mg/dL is desirable but not sufficient. Anion-gap closure alone is not a resolution criterion. Maintain basal-insulin overlap before stopping IV insulin per the selected protocol; hyperchloremic non-anion-gap acidosis can persist after ketoacidosis resolves.
- Sim progress → **Improving** when glucose 100–180 and HR 60–100.

---

## 4. Unexpected outcomes (with triggers)

| # | Complication | Trigger | Response |
|---|---|---|---|
| 1 | **Arrhythmia from hypokalemia** | Insulin started with K+ < 3.5 mmol/L or potassium falls during treatment | Hold insulin, replace and monitor potassium under protocol; reassess before restarting |
| 2 | **Neurologic deterioration** | New neurologic change during treatment | Urgently reassess and treat under the applicable emergency protocol; a universal DKA cerebral-edema osmolality threshold is not specified here |
| 3 | **Recurrent DKA** | Stopping insulin drip without basal overlap | Basal insulin 2–4 h before drip stops |
| 4 | **Hypoglycemia** | Low glucose during insulin therapy | Initiate local hypoglycemia rescue and recheck protocol; separately reassess insulin and ongoing ketoacidosis treatment |
| 5 | **Fluid overload** | Rapid fluid replacement in a patient with cardiac/renal vulnerability | Slow the rate; monitor lungs (*not in sim*) |

---

## 5. Best case / worst case

- **Best case:** timely reassessment, safe potassium-guided treatment, and biochemical resolution followed by appropriate basal overlap. Timelines and outcomes vary and are not predicted by the simulator.
- **Potential adverse course:** unrecognized DKA, unsafe insulin with hypokalemia, delayed precipitant treatment, or fluid overload may lead to serious complications. The simulator’s scripted untreated trajectory is illustrative and does not predict clinical deterioration.

---

## 6. Source

Sources: [ADA Standards of Care 2026](https://doi.org/10.2337/dc26-S016); [International Consensus Report on Hyperglycemic Crises](https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/); [JBDS DKA pathway](https://abcd.care/sites/default/files/site_uploads/JBDS_Guidelines_Current/JBDS_02_Single_page_pathway_March_2023.pdf). Follow a named local protocol; these educational notes do not replace it.

---

## Sim mapping (for the build)

| Algorithm option | Sim button today |
|---|---|
| NS/LR 500 mL bolus | ✅ exist |
| Insulin infusion | Exists as a fixed illustrative glucose delta; it is not a clinical insulin protocol |
| Norepinephrine infusion | ✅ exists |
| Vancomycin IV | ✅ exists |
| K+ lab + K+ replacement | Not modeled; the insulin gate cannot be applied in the simulator |
| pH / HCO3 / anion gap labs | Not modeled; biochemical resolution cannot be assessed in the simulator |
| Dextrose add-on at glucose < 250 | Not modeled; no dextrose or insulin-titration control |
| Basal overlap before drip stop | Not modeled; basal overlap is not represented |
| Atropine / pacing (bradycardia branch) | Not modeled |

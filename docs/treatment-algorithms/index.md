# SICU Treatment Pathways — Educational Documentation

These seven case documents are educational references, not validated clinical decision support. They are not executed by the simulator. The simulator's scripted scenarios, fixed intervention deltas, target bands, and progress labels are illustrative and do not predict patient outcomes. All physiology represented by fixed deltas or recovery timelines is a simplified model assumption.

| Case | Educational focus |
|---|---|
| [Septic shock](septicShock-treatment-algorithm.md) | Source-directed treatment, concurrent resuscitation/vasopressor decisions, perfusion reassessment |
| [ARDS](ards-treatment-algorithm.md) | Lung-protective ventilation, individualized oxygenation support, early proning when indicated |
| [Cardiogenic shock](cardiogenicShock-treatment-algorithm.md) | Phenotype-guided support, early shock-team and revascularization assessment |
| [DKA](dka-treatment-algorithm.md) | Diagnostic criteria, potassium safety gate, insulin/dextrose and biochemical resolution |
| [Post-operative hemorrhage](postopHemorrhage-treatment-algorithm.md) | Parallel resuscitation and source control, targeted hemostasis |
| [Upper GI bleeding](giBleed-treatment-algorithm.md) | Stability-appropriate transfusion decisions and endoscopic/source treatment |
| [Adult community-acquired pneumonia](pneumonia-treatment-algorithm.md) | Severity assessment, risk-directed coverage, reassessment and stability |

## Shared limits and unresolved design choices

- Bradycardia: treat when it causes cardiopulmonary compromise, typically with HR <50 in this context; a rate below 60 plus any shock is not sufficient. Assess ABCs, pulse, ECG, reversible causes, and cardiac arrest; escalate persistent symptomatic bradycardia after atropine under current ACLS/local protocol. This is not implemented in the simulator. Source: [AHA 2025 ACLS Bradycardia Algorithm](https://www.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Accessible/Algorithm-ACLS-Bradycardia-LngDscrp-Ed.pdf).
- PEEP changes require a defined respiratory support state and hemodynamic reassessment; those states are not represented.
- The simulator does not provide the diagnostic data or interventions needed to execute these pathways (including labs, imaging, procedures, antimicrobial selection, and source control). “Not modeled” statements describe these limits; no absent values or actions are inferred.
- Post-operative bleeding phenotype and operation-specific TXA/BP policy remain unspecified. A named variceal endoscopy timing standard remains to be selected. Local protocol versions for variable treatment decisions must be named by the responsible clinical owner before any operational protocol is asserted.
- The simulator is not clinically validated. Clinical content requires review by the responsible clinician before use beyond education.

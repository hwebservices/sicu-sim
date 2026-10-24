# Cardiogenic Shock — Educational Treatment Pathway

This is an educational reference, not validated clinical decision support. The simulator's scripted vital-sign case does not model cardiac output, perfusion, ECG, echocardiography, filling pressures, biomarkers, or revascularization.

## Case snapshot

The case starts at NIBP 82/50, HR 118, SpO₂ 90%, RR 24, temperature 36.8 °C, and glucose 160. Untreated scripted values worsen over 60 minutes. These values alone do not diagnose cardiogenic shock.

## Educational approach

- Obtain ECG and arrange early echocardiography, shock-team involvement, and catheterization/revascularization assessment in parallel when indicated.
- Emergency culprit-vessel revascularization should not wait for normalized hemodynamics when acute myocardial infarction is responsible.
- Select vasoactive and inotropic support for the patient's pressure, output, rhythm, and shock phenotype. Do not apply a universal norepinephrine-first versus inotrope-first rule; inotropes can worsen arrhythmias and require close monitoring.
- Avoid unassessed fluid loading. If non-invasive positive pressure/PEEP is used, monitor blood pressure, preload, and perfusion and reassess for failure or need for intubation.
- Escalate refractory shock promptly to a shock center for advanced support/mechanical circulatory support assessment.
- A heart rate threshold alone does not select vasopressin, norepinephrine reduction, or inotropy. Identify rhythm, cause, and instability.
- Treat symptomatic bradycardia only when it causes cardiopulmonary compromise; HR is often <50 in this context. Assess ABCs, pulse, ECG, reversible causes, and arrest; persistent symptoms after atropine require escalation under current ACLS/local protocol. These actions are not modeled.

## Model boundary

The simulator does not encode cardiac phenotype, hemodynamic monitoring, revascularization, or inotropes. The fixed pressor, fluid, and PEEP effects are illustrative; target-range progress does not establish restored cardiac output or perfusion.

## Sources

- [ACC cardiogenic shock consensus](https://www.jacc.org/doi/10.1016/j.jacc.2025.02.018)
- [AHA scientific statement](https://www.jacc.org/doi/10.1016/j.jacc.2024.11.009)
- [ESC heart failure guideline](https://academic.oup.com/eurheartj/article/42/36/3599/6358045)

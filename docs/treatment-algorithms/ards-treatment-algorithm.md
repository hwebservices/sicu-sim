# ARDS — Educational Treatment Pathway

This is an educational reference, not validated clinical decision support. The simulator runs a scripted vital-sign scenario; it does not execute this pathway or model ventilator settings, blood gases, imaging, or oxygenation ratios. All model responses are illustrative.

## Case snapshot

The scripted case starts with SpO₂ 88%, RR 28, HR 104, temperature 37.6 °C, NIBP 118/74 and glucose 142. Untreated scenario values worsen SpO₂ to 85% at 30 minutes and 83% with RR 32 at 60 minutes. These are scripted values, not a clinical prediction.

## Educational approach

- Confirm the syndrome and cause with clinical examination, imaging, oxygenation assessment, and evaluation for cardiac causes; these are not modeled.
- In invasively ventilated adults, use lung-protective tidal volume near 6 mL/kg predicted body weight, adjustable within 4–8 mL/kg, and limit plateau pressure to <30 cm H₂O. The simulator has no ventilator-setting control.
- Select a defined PEEP/FiO₂ strategy and reassess blood pressure, preload, and perfusion after changes. The simulator's PEEP buttons do not represent a complete ventilator protocol or support state.
- Do not use routine prolonged or brief lung-recruitment maneuvers. After stabilization and ventilator optimization, consider early prone positioning when P/F remains <150, for at least 16 hours; do not defer it for 24–72 hours. P/F and proning are not modeled.
- Neuromuscular blockade is not triggered by RR alone. Consider it only in an appropriately ventilated patient after optimization, for a defined indication, with adequate analgesia and sedation. The simulator cannot establish those conditions.
- Consider corticosteroids individually and VV-ECMO in selected refractory severe cases with specialist input.
- Reassess perfusion and fluid tolerance. Treat the underlying cause with source-directed care; vancomycin alone is not generic treatment for infection.

## Model boundary

FiO₂/PEEP button effects and the scripted SpO₂/RR changes are fixed illustrative deltas. “Improving” is only a simulator target-range label; it does not establish lung protection, disease resolution, or clinical recovery. The model does not represent gas exchange, ventilator injury, proning, or ECMO.

## Sources

- [ATS/ESICM/SCCM ARDS ventilation guidance](https://pmc.ncbi.nlm.nih.gov/articles/PMC10870893/)
- [ESICM ARDS guideline](https://link.springer.com/article/10.1007/s00134-023-07050-7)
- [SCCM neuromuscular blockade guideline](https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-for-the-administration-of-neuromuscular-blockade)

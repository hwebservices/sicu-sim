# Adult Community-Acquired Pneumonia — Educational Treatment Pathway

This is an educational reference, not validated clinical decision support. This pathway is for adult community-acquired pneumonia (CAP), not hospital-acquired or ventilator-associated pneumonia. The simulator does not model imaging, microbiology, oxygen delivery, or antimicrobial selection.

## Case snapshot

The scripted case starts at SpO₂ 91%, RR 26, temperature 38.7 °C, HR 105, NIBP 108/68, and glucose 165. Untreated scripted values worsen over 60 minutes. These values do not determine CAP severity or treatment.

## Educational approach

- Assess adult CAP severity using ATS/IDSA criteria: one major criterion or at least three minor criteria for severe CAP. CURB-65 or PSI alone does not define severe CAP.
- Choose empiric antibiotics using setting, local guidance, and resistance risks. Prior respiratory isolation or hospitalization with IV antibiotics within 90 days are important risk factors, alongside local validated risks. A beta-lactam plus azithromycin is an accepted severe-CAP regimen; dual antipseudomonal therapy is not universal.
- Obtain appropriate microbiology and viral testing; use influenza antiviral treatment when indicated. Add MRSA or antipseudomonal coverage only when indicated by risk and local guidance, then reassess/de-escalate with results.
- Support oxygenation and reassess escalation needs. The simulator's FiO₂/PEEP buttons are fixed effects, not respiratory support settings.
- Do not apply a blanket “no steroids” rule. Consider corticosteroids for eligible severe CAP under current guidance and contraindications; influenza pneumonia is excluded from the referenced severe-CAP recommendation.
- Treat for at least 5 days when improving, with clinical stability including oxygenation, mentation, oral intake, and complications; do not stop automatically at day 5. For nonresponse, investigate empyema, abscess, resistance, and alternative diagnoses.
- Treat symptomatic bradycardia only when it causes cardiopulmonary compromise; HR is often <50 in this context. Assess ABCs, pulse, ECG, reversible causes, and arrest; persistent symptoms after atropine require escalation under current ACLS/local protocol. These actions are not modeled.

## Model boundary

The simulator's vancomycin button is a fixed scripted vital effect, not CAP antibiotic therapy. It cannot assess severity, resistance, response, oxygen need, clinical stability, or treatment duration. Improving simulator target bands do not establish infection resolution.

## Sources

- [IDSA CAP clinical pathway](https://www.idsociety.org/globalassets/idsa/practice-guidelines/community-acquired-pneumonia-in-adults/cap-clinical-pathway-final-online.pdf)
- [ATS 2025 CAP guideline](https://www.atsjournals.org/doi/pdf/10.1164/rccm.202507-1692ST?download=true)
- [SCCM corticosteroid guidance](https://www.sccm.org/clinical-resources/guidelines/guidelines/use-of-corticosteroids-in-sepsis-ards-cap)

# Septic Shock — Educational Treatment Pathway

This is an educational reference, not validated clinical decision support. The simulator uses scripted vital signs and fixed intervention deltas; it does not model lactate, perfusion, cultures, antimicrobial selection, source control, or organ dysfunction.

## Case snapshot

The scripted post-operative case starts at temperature 38.9 °C, HR 108, NIBP 92/58, RR 22, SpO₂ 94%, and glucose 142. Untreated scripted values worsen. Fever is not required to recognize sepsis or shock, and these values do not establish Sepsis-3 criteria.

## Educational approach

- Assess for infection, shock, perfusion, and likely source. Obtain indicated cultures and investigations without delaying urgent treatment.
- Use source- and resistance-risk-directed antimicrobials under local guidance. Vancomycin alone is neither generic post-operative coverage nor source control.
- In unstable shock, begin vasopressor support when clinically indicated while assessing and giving appropriate fluid; do not require completion of 30 mL/kg before norepinephrine. A central line is not a prerequisite to starting vasopressors when needed.
- Reassess fluid responsiveness, perfusion, lactate trend, and source. MAP alone is not proof of adequate perfusion. Source intervention should be assessed immediately and performed as soon as practical, ideally within 6 hours when required.
- For ongoing vasopressor need, consider vasopressin as norepinephrine escalates; consider epinephrine if MAP remains inadequate despite both. Consider inotropy for cardiac dysfunction or persistent hypoperfusion despite adequate pressure and volume. Consider corticosteroids for refractory shock under applicable guidance.
- For vasopressor extravasation, stop infusion at the affected site, arrange alternate support/access, and follow the local antidote pathway.
- Treat symptomatic bradycardia only when it causes cardiopulmonary compromise; HR is often <50 in this context. Assess ABCs, pulse, ECG, reversible causes, and arrest; persistent symptoms after atropine require escalation under current ACLS/local protocol. These actions are not modeled.

## Model boundary

The fixed norepinephrine and antibiotic-button deltas do not model dose, antimicrobial activity, source control, lactate clearance, or perfusion. No universal fever-normalization or lactate-clearance deadline is represented. “Improving” only means modeled values fall within target bands.

## Sources

- [Surviving Sepsis Campaign 2026](https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026)
- [Association of Anaesthetists vasopressor extravasation guidance](https://associationofanaesthetists-publications.onlinelibrary.wiley.com/doi/10.1111/anae.16727)

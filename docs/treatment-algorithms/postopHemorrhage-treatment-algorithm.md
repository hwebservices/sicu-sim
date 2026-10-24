# Post-operative Hemorrhage — Educational Treatment Pathway

This is an educational reference, not validated clinical decision support. The simulator provides a scripted vital-sign case and a fixed transfusion-button effect; it does not model bleeding source, blood loss, labs, blood products, coagulation, or source control. The surgical phenotype is unspecified, so operation-specific policies cannot be selected here.

## Case snapshot

The scripted case starts at NIBP 88/54, HR 122, SpO₂ 95%, RR 22, temperature 36.4 °C, and glucose 150. Untreated scripted values worsen over 60 minutes. These are illustrative and do not predict hemorrhage or response to treatment.

## Educational approach

- Assess the patient and bleeding source immediately; obtain appropriate access, labs, blood-bank support, and activate the local hemorrhage pathway according to the observed clinical situation.
- Engage the surgeon and, when appropriate, interventional radiology for hemorrhage control in parallel with resuscitation. Do not defer source-control consultation until after a fixed unit count or crossmatch result.
- Resuscitate according to the bleeding cause, operation-specific policy, physiology, and local protocol. There is no universal postoperative TXA dose/timing rule or universal permissive-hypotension target supplied for this unspecified operation. These require a named operation/cause policy and must not be inferred from trauma protocols.
- Follow serial fibrinogen, platelet count, coagulation, ionized calcium, temperature, perfusion, and response to targeted correction.
- If a transfusion reaction is suspected, stop and assess promptly under protocol; distinguish TACO, TRALI, hemolysis, and anaphylaxis because management differs.
- Treat symptomatic bradycardia only when it causes cardiopulmonary compromise; a rate below 60 alone is not a trigger. HR is often <50 in this context. Assess ABCs, pulse, ECG, reversible causes, and arrest; persistent symptoms after atropine require escalation under current ACLS/local protocol. These actions are not modeled.

## Model boundary

The simulator's “Blood transfusion (1 unit)” changes fixed vital-sign values. It does not represent a real unit, transfusion threshold, massive transfusion protocol, correction of coagulopathy, or hemostasis. Vital normalization alone cannot establish control of bleeding. No TXA or permissive-hypotension policy is encoded.

## Sources

- [Critical Care review of major bleeding](https://link.springer.com/article/10.1186/s13054-023-04327-7)
- [ESAIC severe peri-operative bleeding guideline](https://sfai.se/wp-content/uploads/2023/04/Management_of_severe_peri_operative_bleeding_.2.pdf)
- [BSH platelet transfusion guideline](https://onlinelibrary.wiley.com/doi/full/10.1111/bjh.18275)
- [BSH fibrinogen guideline](https://onlinelibrary.wiley.com/doi/10.1111/bjh.18789)

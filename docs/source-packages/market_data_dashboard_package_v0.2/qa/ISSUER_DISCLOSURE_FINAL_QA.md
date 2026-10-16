# ISSUER DISCLOSURE FINAL QA V0.2

Verification date: 2026-10-16.

This file defines the implementation baseline. It is not a substitute for re-checking the issuer page when a future disclosure is published.

## USDC / Circle

Primary transparency page verified current snapshot:
- reserves page date: 12 Oct 2026;
- in-circulation and total-reserve values are published dynamically;
- reserve categories include bank deposits, overnight reverse Treasury repo and <3-month Treasuries;
- issuance/redemption changes are separately displayed.

Implementation:
- current reserve/circulation values may be dynamically sourced if the existing integration is reliable;
- always display the source snapshot date;
- monthly attestation is a separate disclosure layer;
- Circle company quarterly financial results are separate from USDC reserve backing.

Do not copy a current value into static page copy.

## USDT / Tether

Latest verified quarterly reserve attestation available at this baseline:
- Q2 2026;
- reserve-report period end: 30 Jun 2026;
- publication: 31 Jul 2026;
- prepared by BDO.

Separate disclosure:
- on 13 Aug 2026 Tether announced KPMG U.S.'s unqualified opinion on Tether International's financial statements for the year ended 31 Dec 2025.

Implementation:
show two separate rows/labels:
1. `Quarterly reserve attestation`
2. `Annual financial-statement audit`

Never convert the existence of the 2025 financial-statement audit into a claim that each quarterly reserve statement is an audit.

## PYUSD / Paxos

Paxos' transparency page currently exposes 2026 monthly material through Aug 2026.

The page distinguishes:
- Paxos self-reported portfolio composition, published promptly after month-end and not independently reviewed;
- independent attestations/examinations.

Attestation reports posted on/after 28 Feb 2025 are issued by KPMG LLP under AICPA attestation standards.

Implementation:
do not collapse `Paxos Report` and `Attestation` into a single assurance field.

## FDUSD / First Digital Labs

Transparency page verified:
- snapshot dated 31 Aug 2026;
- tokens issued/in circulation and assets in reserve accounts are shown;
- monthly reserve-report/attestation framework is described.

Implementation:
- report snapshot may be shown with date;
- do not freeze reserve-composition percentages scraped from the live page unless the underlying monthly report has been separately QA'd;
- direct issuer purchase/redemption eligibility remains separate from secondary-market holding.

## Cross-issuer comparison rule

Allowed comparison fields:
- report period;
- publication date;
- circulation/liabilities covered;
- reserve asset categories at a high level;
- assurance scope/type;
- provider;
- disclosure frequency;
- direct redemption eligibility;
- limitations.

Do not create a composite `reserve quality score` or ranking in V0.2.

# SOURCE VERIFICATION LOG V0.2

Verification date: 2026-10-16.

## Circle
Circle transparency page verified:
- snapshot date shown: 12 Oct 2026;
- current circulation/reserve figures and reserve categories are published;
- issuance/redemption changes are separately displayed.

Implementation decision:
dynamic primary-source module allowed if parser/integration remains healthy.

## Tether
Tether Q2 2026 reserve attestation announcement verified:
- publication: 31 Jul 2026;
- reserve-report period end: 30 Jun 2026;
- prepared by BDO.

Tether financial-statement audit announcement verified:
- publication: 13 Aug 2026;
- KPMG U.S.;
- financial statements for year ended 31 Dec 2025;
- unqualified audit opinion.

Implementation decision:
quarterly reserve attestation and annual financial-statement audit remain separate fields.

## Paxos / PYUSD
PYUSD transparency page verified:
- 2026 monthly material currently visible through Aug;
- Paxos self-reports and independent attestations are separate documents;
- attestation reports posted on/after 28 Feb 2025 are issued by KPMG LLP.

## FDUSD
First Digital Labs transparency page verified:
- snapshot date shown: 31 Aug 2026;
- tokens in circulation and reserve-account assets displayed;
- monthly attestation framework stated.

Implementation decision:
do not hard-code scraped composition percentages without report-level QA.

## CoinGecko
Current API changelog verifies:
- explicit `interval=hourly` is available to all plans for market-chart endpoints;
- hourly data can cover up to the past/any 100-day range per request.

Implementation decision:
this improves granularity access but does not validate the website's depeg detector.

## Etherscan
Token Holder List endpoint verified:
- PRO endpoint;
- Standard Plan and above;
- returns holder addresses and balances.

Implementation decision:
holder concentration remains non-public because address-role classification remains unresolved.

## Artemis
Adjusted stablecoin transfer API verified:
- deduped;
- removes intra-exchange transfers and MEV;
- API key required.

P2P metric verified:
- activity between wallets/EOAs;
- API key required.

Implementation decision:
preserve Artemis metric names/methods and do not treat either metric as merchant-payment volume.

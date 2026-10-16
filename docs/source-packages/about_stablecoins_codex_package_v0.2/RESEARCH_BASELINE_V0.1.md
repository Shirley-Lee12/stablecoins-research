# About Stablecoins｜Research Baseline V0.1

Baseline date: 2026-10-16.

## 1. Definition

A stablecoin is best introduced as a transferable digital token designed to maintain a relatively stable value against a reference asset or unit, most commonly a fiat currency.

Do not define all stablecoins as “fully backed by fiat reserves”. That describes the dominant fiat-reserve model but excludes crypto-collateralised, synthetic/hedged and historical algorithmic designs.

The stability arrangement may rely on:
- redeemable reserves;
- overcollateralisation + liquidation + redemption;
- hedged backing / derivatives;
- supply and arbitrage rules;
- combinations of these.

The practical test is not the marketing label but the mechanism.

## 2. The common lifecycle

For mechanism teaching, use:

`Backing / collateral / hedge`
→ `Mint / issuance`
→ `Circulation & secondary trading`
→ `Price deviation`
→ `Arbitrage / redemption / liquidation / rebalancing`
→ `Burn / settlement / restored balance`

Not every stablecoin uses every node.

## 3. Fiat-reserve-backed

Economic structure:
- an issuer holds reserve assets;
- authorised customers may create/redeem tokens under issuer rules;
- tokens circulate on public/private networks and secondary venues;
- par redemption and arbitrage help anchor secondary-market prices.

USDC is a clean current example:
- highly liquid cash/cash-equivalent reserves;
- direct Circle Mint access is institutional, not available to individuals/small businesses;
- other users usually acquire USDC through exchanges, wallets, neobanks or on/off-ramp providers.

USDT is another major fiat-referenced reserve-backed example. Tether states its tokens are pegged 1:1 to matching fiat currencies and backed by reserves.

Important teaching point:
“1:1 reserve backing” does not mean every holder has identical direct redemption access, settlement speed or legal relationship with the issuer.

Key risks:
reserve quality/liquidity, custodian/bank exposure, issuer/legal claim, operational/compliance risk, secondary liquidity, redemption gates.

Attestation is not the same thing as an audit.

## 4. Crypto-collateralised

Clean mechanism:
crypto collateral
→ collateralised borrowing / mint
→ minimum collateral requirement
→ liquidation when collateral becomes insufficient
→ redemption/arbitrage supports peg.

Liquity V2 BOLD is a clean contemporary teaching example:
- overcollateralised;
- backed by WETH/wstETH/rETH;
- holders can redeem BOLD for protocol collateral at face-value logic;
- undercollateralised positions can be liquidated.

Maker's original Single-Collateral Dai/Sai, launched in December 2017, is a historically important example of the model.

Key risks:
collateral crash, oracle failure/lag, liquidation congestion, bad debt, smart-contract risk, redemption/liquidity dynamics.

Do not use “decentralised = risk-free”.

## 5. Synthetic / hedged

This category should be defined by economic hedge, not by the word “synthetic”.

Ethena USDe is the clean current example:
- backing assets are held;
- delta-hedging derivative positions support relative USD stability;
- protocol backing/custody and derivative venues are part of the mechanism;
- direct mint/redeem is restricted to whitelisted KYC/KYB counterparties; other holders may acquire through secondary liquidity.

Key risks:
basis/funding risk, derivative-market liquidity, exchange/settlement counterparty risk, custodian/off-exchange-settlement risk, hedge execution, redemption/access.

A synthetic design is not the same thing as an unbacked algorithmic stablecoin.

## 6. Algorithmic

Use as a mechanism/history page, not as a recommendation category.

Classic mechanism:
stablecoin deviation
→ arbitrage conversion against another token / endogenous asset
→ supply expansion/contraction
→ intended return to peg.

TerraUSD (UST) is the canonical failure case.
BIS documents that UST relied on convertibility into $1 worth of LUNA and that loss of confidence caused a run/death-spiral dynamic in May 2022.

Core lesson:
if the stabilising asset's value depends on confidence in the same ecosystem, the mechanism can become reflexive under stress.

Do not generalise UST's failure to every non-fiat-backed stablecoin.

## 7. Hybrid & boundary cases

This page solves two problems:

### A. Mechanisms change over time
Classification should describe the current economic mechanism, not an old project reputation.

Current frxUSD, for example, is described by Frax as fiat-redeemable and fully collateralised with permitted cash-equivalent/tokenised-Treasury reserves. That current mechanism should not be inferred from older FRAX-era labels.

### B. Adjacent tokenised money is not automatically a stablecoin
Separate:
- CBDCs;
- tokenised commercial-bank deposits;
- tokenised money-market / Treasury fund shares;
- payment stablecoins;
- other tokenised claims.

The IMF explicitly distinguishes stablecoins from central-bank money, deposits and money-market-fund shares, including their tokenised forms.

## 8. Applications ≠ Adoption

Applications answer:
“What task could a stablecoin perform?”

Adoption answers:
“How much is it actually used, by whom, where, and through what channel?”

The About Applications page should explain tasks:
- crypto trading/settlement and collateral;
- cross-border transfers/remittances;
- B2B / treasury settlement;
- merchant / P2P payments;
- DeFi liquidity/credit;
- tokenised-asset settlement;
- machine/agentic payment rails.

Actual volumes, geography and user adoption belong in `/market-data/adoption`.

Current IMF evidence says crypto trading remains the main use case, while cross-border payments are increasing; future domestic payment/tokenisation demand depends on infrastructure and legal/regulatory conditions.

## 9. History

Use a causal timeline, not a list of logos:

- 2014: Tether launches; fiat value moves onto blockchain rails.
- Dec 2017: Dai/Sai launches; crypto-collateralised on-chain credit becomes a stablecoin mechanism.
- Sep 2018: USDC launches; reserve-backed stablecoins broaden institutional/fintech participation.
- 2020–21: DeFi expansion increases stablecoin use as settlement, liquidity and collateral.
- May 2022: TerraUSD collapse demonstrates reflexive algorithmic-run risk.
- Jul 2023: FSB finalises global stablecoin recommendations.
- Jun 2024: EU MiCA ART/EMT provisions begin applying.
- Jul/Aug 2025: US GENIUS Act becomes law; Hong Kong issuer regime enters force.
- 2026: jurisdictions move from framework design toward implementation/systemic oversight; FSB intensifies cross-border vulnerability and data monitoring.

The history page should explain “what changed” at each step.

## 10. Regulatory evolution

Do not duplicate `/regulatory`.

This page answers:
“How did regulation evolve conceptually?”

Stages:
1. risk warnings and perimeter questions;
2. reserve/redemption/governance requirements;
3. international functional standards;
4. dedicated issuer/payment-stablecoin regimes;
5. systemic and cross-border supervision/data monitoring.

Key global milestones:
- FSB 2023 recommendations;
- MiCA ART/EMT provisions from 30 Jun 2024;
- US GENIUS Act signed 18 Jul 2025;
- Hong Kong stablecoin issuer regime effective 1 Aug 2025;
- UK 2026 FCA/BoE stablecoin framework development;
- FSB 2025 review finds implementation uneven;
- FSB Oct 2026 cross-border vulnerability/monitoring work.

Link to `/regulatory` for current jurisdiction-by-jurisdiction status.

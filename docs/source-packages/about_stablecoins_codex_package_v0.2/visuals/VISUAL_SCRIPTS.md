# About Stablecoins｜Visual Scripts V0.1

V0.1 freezes information design only. V0.2 will create the final editable SVGs.

## STB-D01｜Stablecoin Lifecycle

Horizontal mechanism flow:
1. Economic support
   - reserve / collateral / hedge / mechanism
2. Mint / issuance
3. Circulation & secondary trading
4. Price deviation
5. Stabilisation response
   - redemption
   - arbitrage
   - liquidation
   - hedge/rebalancing
   - supply adjustment
6. Burn / settlement / restored balance

Important:
Not every stablecoin uses every node.
Do not render one flow as universal.

Footer question:
`Where is the loss absorbed if the mechanism is stressed?`

## STB-D02｜Stablecoin vs Adjacent Digital Money

Four columns:
- Stablecoin — private issuer/protocol arrangement; reference-value target
- CBDC — central-bank liability
- Tokenised deposit — commercial-bank deposit liability
- Tokenised fund share — fund/security claim

Compare:
issuer/obligor · legal claim · redemption · typical backing · transfer rail.

Do not imply tokenised deposits/funds are inferior or superior.

## STB-D03｜Mechanism-first Taxonomy

Three horizontal axes:
1. Economic support
2. Exit / redemption
3. Stabilisation mechanism

Below them, five teaching groups:
- Fiat-reserve-backed
- Crypto-collateralised
- Synthetic / hedged
- Algorithmic
- Hybrid / boundary

Use connectors to show that categories can overlap/change.
Footer:
`Classify the current mechanism — not the project's historical reputation.`

## STB-D04｜Regulatory Evolution

Five stages:
Risk & perimeter
→ Stability obligations
→ International baseline
→ Dedicated issuer regimes
→ Systemic & cross-border monitoring

Under stages place dated anchors:
2023 FSB / 2024 MiCA / 2025 GENIUS + HK / 2026 UK + FSB monitoring.

Do not turn this into current country ranking.

## STB-D05｜Fiat-reserve-backed Flow

Fiat/reserve assets
→ issuer / custodian structure
→ eligible direct minter
→ stablecoin
→ secondary holders/venues
→ eligible direct redeemer
→ reserve payout + burn

Use a separate loop from secondary price deviation to eligible arbitrageur/direct redemption.

Critical callout:
`Secondary holder ≠ direct issuer customer`

## STB-D06｜Crypto-collateralised Flow

Crypto collateral
→ borrowing position
→ stablecoin minted
→ collateral ratio changes

Branch:
safe → remains open
unsafe → liquidation → debt extinguished / collateral redistributed or sold

Separate peg arrow:
stablecoin below peg → redemption/arbitrage → collateral/debt adjustment

Stress callouts:
oracle · chain congestion · collateral liquidity.

## STB-D07｜Synthetic / Hedged Flow

Backing assets
→ custody / off-exchange settlement
→ derivative hedge
→ USDe-like stablecoin exposure

Side loop:
funding/basis/PnL
↔ hedge maintenance

Direct mint/redeem lane:
whitelisted eligible counterparty only

Secondary holder lane:
market liquidity / no identical direct-redemption status.

## STB-D08｜Algorithmic Reflexive Failure

Normal intended loop:
below peg
→ arbitrage conversion
→ endogenous token issuance / supply adjustment
→ intended return to peg

Stress loop:
confidence ↓
→ stablecoin selling ↑
→ endogenous token issuance ↑
→ endogenous token price ↓
→ arbitrage capacity / confidence ↓
→ more selling

Label:
`TerraUSD is the historical case used to explain this reflexive failure mode.`

## STB-D09｜Hybrid & Boundary Map

Center:
`Classify today's mechanism`

Left: mechanism migration
- reserve mix changes
- new redemption path
- RWA/tokenised Treasury added
- governance/issuer changes

Right: adjacent assets
- CBDC
- tokenised deposit
- tokenised MMF/Treasury share
- yield-bearing wrapper

Bottom example:
`Current frxUSD: reserve-backed / fiat-redeemable under current documentation.`

## STB-T01｜History Timeline

Render from HISTORY_TIMELINE.json.
Event types:
PRODUCT / MECHANISM / MARKET_STRUCTURE / FAILURE / REGULATION / SYSTEMIC_OVERSIGHT.

Every event must display:
- date
- event
- “What changed”
- official/authoritative source

No decorative logo timeline.

## STB-D10｜Application ≠ Adoption Matrix

Render from APPLICATION_MATRIX.csv.
Columns:
Task | Why a stablecoin may help | Evidence state | Key constraint

Top warning:
`Capability does not equal market adoption.`

Link actual adoption to `/market-data/adoption`.

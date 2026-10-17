# Stablecoin Risk Framework｜Content Master en V0.2

## `/quantitative`

### Stablecoin Risk Framework

This study develops a multi-dimensional framework for stablecoin risk.

It first decomposes broad and overlapping risk concepts into **55 atomic risks**, then maps those risks along two complementary dimensions:

1. **Lifecycle Dimension (T0–T3)** — where a risk is primarily located in the stablecoin operational lifecycle.
2. **Amplification & Transmission Dimension (L0–L3)** — what causal role the risk plays from initial shock to cross-system transmission.

The current research output is conceptual decomposition and mapping.

Risk-specific indicators, quantitative transmission analysis, dynamic monitoring, early warning and regulatory-coverage evaluation are future research directions. They are not currently deployed website research products.

### Why atomic-risk decomposition?

Stablecoins connect issuers, reserves, custodians, blockchains, markets, protocols and users. Their risks mix financial/institutional vulnerabilities with crypto-native technical and protocol risks.

Aggregate measures can obscure:
- the specific source of deterioration;
- the operational location of a risk;
- whether a factor is a trigger, vulnerability or amplification process;
- when the effects have moved beyond one stablecoin.

An atomic risk is the minimum useful risk unit for identification and measurement in this framework.

“Atomic” does not mean causally or statistically independent.

### Research method

1. Understand the stablecoin system.
2. Organise higher-level risk modules.
3. Define distinct atomic risk units with clear conceptual boundaries, operational locus and future measurement logic.
4. Map them across the two dimensions.

Evidence comes from academic research, regulatory and industry reports, issuer/protocol documentation, and real-world failure or stress cases.

Quantification and monitoring come **after** decomposition and mapping.

### Presentation-level risk modules

The conference study organises the submitted framework into seven presentation-level modules:
- Backing Assets & Balance Sheet
- Issuer Transparency, Legal Structure & Custody
- Fiat Settlement, Regulation & Redemption
- Secondary Markets, Token Holders & Confidence
- Technical Infrastructure, Code, Cryptography & Information
- Governance & Privileged Control
- DeFi Integration, On-Chain Markets & Endogenous Mechanisms

This presentation-level organisation explains the submitted framework; it is not a second independent taxonomy.

### Current study

- 55 atomic risks
- T0–T3 lifecycle mapping
- L0–L3 amplification & transmission mapping
- risk-decomposition methodology

### Future research

- risk-specific indicator sets;
- composite measures where appropriate;
- quantitative transmission and amplification analysis;
- dynamic monitoring and stress detection;
- tiered early warning;
- regulatory-coverage mapping and blind-spot analysis;
- regulatory optimisation recommendations.

These are future research directions, not completed or live functions.

---

## `/quantitative/dimension-a`

### Lifecycle Mapping (T0–T3)

The Lifecycle Dimension asks:

> Where is the risk primarily located in the stablecoin operational lifecycle?

It identifies the main operational locus where a risk enters, is embedded, or becomes relevant.

#### T0 — Foundation, Backing & Issuance
Representative risks:
- C5 — Asset-Liability Maturity Mismatch
- C14 — Lack of Bankruptcy Remoteness for Reserves

#### T1 — Circulation, Trading & Settlement
Representative risks:
- C22 — Deficient Secondary Market Order Book Depth
- U1 — Underlying Public Blockchain Network Congestion

#### T2 — Protocol Embedding & Layered Finance
Representative risks:
- U18 — DeFi Nested Collateralization Risks
- U24 — Excessive Credit Expansion via AMO Algorithms

The boundary is protocol embedding, not simply “being on-chain” or “being in DeFi”.
A DEX trade may remain T1; lending, collateral and LP positions belong to T2.

#### T3 — Redemption, Deleveraging & Liquidation
Representative risks:
- C26 — Asymmetric Redemption Channels
- U25 — Unbuffered Cascading Liquidations

The T dimension locates risks. It does not rank severity, prove temporal order, or establish causal transmission.

---

## `/quantitative/dimension-b`

### Amplification & Transmission Mapping (L0–L3)

The L dimension asks:

> What role does the risk play in the causal chain from initial shock to cross-system transmission?

#### L0 — Initial Trigger
A shock that directly initiates the episode.

Representative risks:
- C1 — Macro Interest Rate Shocks
- U2 — Layer 2 Sequencer Downtime

#### L1 — Structural Vulnerability
A pre-existing weakness that shapes susceptibility.

Representative risks:
- C5 — Asset-Liability Maturity Mismatch
- C22 — Deficient Secondary Market Order Book Depth

#### L2 — Dynamic Amplification
Activated reactions or feedback loops that magnify the shock.

Representative risks:
- U21 — High Friction Inducing Arbitrage Failure
- U25 — Unbuffered Cascading Liquidations

#### L3 — Cross-System Transmission / Outcomes
Effects that propagate beyond the focal stablecoin into:
- other stablecoins;
- DeFi protocols;
- broader crypto markets;
- traditional financial markets.

### Important distinctions

`L0 ≠ L1`  
Trigger event versus pre-existing susceptibility.

`L1 ≠ L2`  
Structural condition versus activated amplification process.

`T0 ≠ L1`  
Lifecycle location versus causal role.

`T3 ≠ L3`  
Exit/unwind stage versus cross-system propagation.

### Current boundary

The conference study provides conceptual decomposition and mapping.

It does not yet provide:
- estimated causal networks;
- transmission coefficients;
- TE or Hawkes results;
- real-time early-warning signals;
- depeg probabilities;
- production risk scores;
- regulatory coverage scores.

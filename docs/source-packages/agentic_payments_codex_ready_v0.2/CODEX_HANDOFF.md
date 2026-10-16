# CODEX HANDOFF｜Agentic Payments V0.2

## Mission

Implement the Agentic Payments section of Stablecoin Research Hub using this package as the content source.

Do not redesign the research conclusions. Do not infer missing facts. Do not scrape extra facts into the production copy unless explicitly requested.

## Use these files as source of truth

1. `content/CONTENT_MASTER.zh-CN.md`
2. `content/CONTENT_MASTER.en.md`
3. `manifests/PAGE_MANIFEST.csv`
4. `cards/PROTOCOL_CARDS.json`
5. `cards/ECOSYSTEM_CARDS.json`
6. `manifests/ASSET_MANIFEST.csv`
7. `manifests/SOURCE_MANIFEST.csv`
8. `visuals/VISUAL_SCRIPTS.md`
9. `RESEARCH_CORRECTIONS.md`

The files in `reference/` are evidence/context only.

## Non-negotiable content rules

- Protocol != Product != Infrastructure != Partnership != Pilot.
- Stablecoin is a payment rail, not the definition of agentic payment.
- Blockchain != stablecoin.
- Token may mean LLM token, payment token, network token, tokenised deposit, or crypto token. Never collapse them.
- “Production-system validation” must not be rewritten as “widely available”.
- “Phase I rollout” must not be rewritten as “available to all users”.
- Unknown fields stay unknown.
- Do not display A2P2 as a core protocol.
- A402 is currently classified as a product-embedded 402/A2M method/spec, not a confirmed vendor-neutral open standard.
- No placeholder or fake market numbers.

## Routing

Keep:
- /agentic-payments
- /agentic-payments/protocols
- /agentic-payments/scenarios
- /agentic-payments/ecosystem
- /protocols/ap2
- /protocols/acp
- /protocols/amp
- /protocols/x402
- /protocols/apop
- /protocols/ucp

Add:
- /protocols/mpp
- /protocols/act

Hold:
- /protocols/a2p2

If existing links point to A2P2, either:
1. remove from visible navigation; and
2. redirect to `/agentic-payments/protocols`, or show a compact “under verification” status page.
Do not preserve unverified old copy.

## Information hierarchy

### General audience
Show:
- 1 sentence
- 1 diagram
- 3–5 key points
- real product example

### Research / enterprise detail
Expandable:
- actors
- protocol mechanics
- exact maturity
- stablecoin status
- official sources
- unknowns

Avoid turning every section into equal white cards.

## Visual implementation

### Do
- render diagrams as editable SVG/components;
- support light/dark themes through semantic tokens;
- allow wide diagrams/tables to use more horizontal width than normal prose;
- use source superscripts near important facts;
- use responsive horizontal scroll for matrices only when necessary;
- use expandable detail on mobile;
- preserve the current blue research-oriented visual identity.

### Do not
- create decorative robot illustrations;
- use crypto-neon/cyberpunk visuals;
- use gold;
- make a logo wall the main content;
- put large empty chart placeholders;
- turn every paragraph into a card.

## Asset handling

For assets with status `PLANNED`:
- create from `VISUAL_SCRIPTS.md`.
- keep SVG source editable.

For `SOURCE_FOUND / CAPTURE_REQUIRED`:
- do not substitute third-party screenshots automatically.
- use official media/page capture only when available and record source metadata.
- if rights/use are uncertain, render an original neutral schematic and keep the source link rather than copying a third-party image.

## Sources UI

Important claims should have a small source marker next to the claim.
Desktop: hover/focus can show title/date/org.
Mobile: tap opens source detail/popover.
Click opens official source in a new tab.

Do not dump a long bibliography in the main reading flow.

## i18n

- Keep protocol/product official names in English.
- Chinese page may use Chinese explanation + official English name.
- Do not translate trademarks.
- Avoid different factual claims between languages.
- Shared structured JSON should drive both languages where possible.

## Current content status

Overview, Protocols, Scenarios, Ecosystem and eight protocol detail pages are `CONTENT_READY`, not visually frozen.
Visual scripts are `PLANNED`, so implement only after their layout/content has been approved.


## V0.2 asset status

### READY
- AGT-D01 through AGT-D06 under `visuals/final/`
- `visuals/TIMELINE_DATA.json`

### Supporting / non-blocking
- AGT-S01 through AGT-S07 official product visuals

Read `visuals/OFFICIAL_VISUAL_STATUS.md`.

Do not block page implementation on screenshot acquisition. When no approved official still is available, use the original explanatory visual plus first-party source link.

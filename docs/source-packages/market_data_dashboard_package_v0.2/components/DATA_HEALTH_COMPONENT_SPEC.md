# DATA HEALTH / FRESHNESS UI SPEC V0.2

This specification is mandatory for all seven Market Data + Dashboard routes.

## 1. Status badge

Every dynamic or report-derived module exposes exactly one primary data state:

| State | Public label | Use when |
|---|---|---|
| `FRESH` | Live / fresh | Latest valid observation is inside the source-specific freshness window |
| `DELAYED` | Delayed | Latest valid observation exists but is outside the freshness tolerance |
| `LAST_SUCCESSFUL_SNAPSHOT` | Last successful snapshot | Current retrieval failed, but a prior valid observation exists |
| `REPORT_SNAPSHOT` | Report snapshot | Dated report/manual evidence, not a live API feed |
| `UNAVAILABLE` | Unavailable | No valid observation exists |
| `NOT_APPLICABLE` | Not applicable | Metric does not apply |
| `UNKNOWN_TO_VERIFY` | Unknown / to verify | Method/access/value is not yet verified |

Do not create extra public states such as `ERROR = 0`, `NO DATA = 0` or `OFFLINE = 0`.

## 2. Required metadata line

Immediately below the metric title or chart title:

`Source · observation/report date · freshness`

Examples:

`DefiLlama · 16 Oct 2026 · Live / fresh`

`Tether Q2 2026 attestation · report period 30 Jun 2026 · Report snapshot`

`Binance · last valid book 16 Oct 2026 14:20 UTC · Last successful snapshot`

## 3. Current fetch failure

If a live retrieval fails and a valid historical snapshot exists:

- keep the last valid value;
- visually de-emphasise it;
- label `Last successful snapshot`;
- show its actual observation timestamp;
- optionally show `Current refresh unavailable`.

Do not:
- set value to zero;
- set timestamp to the current page-load time;
- draw a zero line through the chart;
- preserve a `Live` badge.

## 4. No valid snapshot

Render a compact status panel:

`Data currently unavailable`

Then show:
- source;
- last attempted refresh if useful;
- one-sentence scope/methodology;
- no numerical placeholder.

Do not reserve a full chart-height blank canvas.

## 5. Report snapshot

Report-based evidence must visibly differ from API data.

Badge:
`Report snapshot`

Required:
- research/report period;
- publication date when materially different;
- sample/coverage note.

Example:
`Artemis stablecoin payments study · Jan 2023–Aug 2025 · Report snapshot`

Never display `Updated today` merely because the website was opened today.

## 6. Tooltip / methodology drawer

Every module must expose:
- metric definition;
- source;
- unit;
- coverage;
- adjustment/estimation method;
- interpretation boundary.

Do not use hover-only access for critical methodology; mobile must support click/tap.

## 7. Data-health strip

`/dashboard` and `/market-data` may show one compact source-health strip.

Example rows:
`DefiLlama — fresh`
`FRED — fresh`
`Binance collector — delayed`
`CoinGecko depeg method — under validation`
`Artemis payments — report snapshot`

This is an operational transparency component, not a system uptime claim.

## 8. Colour

Status may use restrained semantic accents, but the text label must carry the meaning.
Do not rely on red/green alone.

## 9. Accessibility

Status labels are text.
Timestamps use machine-readable `datetime` where practical.
Tooltips/popovers are keyboard accessible.

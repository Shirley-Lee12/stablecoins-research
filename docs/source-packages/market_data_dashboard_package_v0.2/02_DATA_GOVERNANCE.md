# Data Governance Baseline V0.1

## 1. Display contract

Every metric object shown publicly should carry:

- `metric_id`
- `label`
- `value`
- `unit`
- `observation_time` or `report_period_end`
- `publication_time` where applicable
- `source_id`
- `source_scope`
- `freshness_state`
- `last_successful_fetch`
- `methodology_note`
- `coverage_note`
- `is_estimate`
- `is_adjusted`

Do not display a value without its semantic metadata being available to the UI.

## 2. Freshness model

### LIVE / FRESH
Latest successful data is inside the source-specific expected freshness window.

### DELAYED
The collector succeeded previously, but the latest snapshot is older than the configured tolerance.

### LAST_SUCCESSFUL_SNAPSHOT
Current retrieval failed, but a prior valid snapshot exists. Display the prior observation time explicitly.

### REPORT_SNAPSHOT
Manually entered / report-derived evidence. Its date is the report period, not “last updated today”.

### UNAVAILABLE
No valid snapshot exists for the required metric.

### NOT_APPLICABLE
The concept does not apply to the asset/source.

### UNKNOWN / TO VERIFY
The value or methodology cannot yet be established.

## 3. Zero-value rule

`0` is a valid display only if the source explicitly returns a valid observed zero under the metric definition.

Null, missing key, failed request, empty response, parse error, rate limit, unavailable credentials or stale source must not become zero.

## 4. Time semantics

Keep distinct:
- observation time;
- report-period end;
- publication date;
- website verification date;
- collector fetch time.

For issuer disclosures, the report-period end is the economically relevant snapshot.
For API data, observation time comes before fetch/cache time.

## 5. Aggregation rules

Never sum:
- market trading volume + on-chain transfer volume;
- raw + adjusted transfer volume;
- CEX volume + DEX volume unless venue universe and double counting are explicitly defined;
- issuer-reported payments + Artemis sampled payments;
- multiple chain representations if bridged/native double counting is unresolved.

## 6. Source hierarchy

1. Official API / official statistical series
2. Issuer primary disclosure / attestation / financial statement
3. Protocol or venue official API
4. Specialist data vendor with explicit methodology
5. Research/report snapshot
6. Secondary commentary only when original unavailable

## 7. Data rights

Publicly visible source data are not automatically licensed for bulk redistribution.
Do not infer a redistribution right from:
- an API key;
- a public dashboard;
- a downloadable report.

Use links and derived visualisations only within confirmed terms; otherwise keep the source as `SOURCE_ONLY`.

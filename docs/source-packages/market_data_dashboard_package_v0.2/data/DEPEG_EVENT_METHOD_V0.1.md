# Depeg Event Method｜V0.1 Review Baseline

## Existing implementation inherited from the current site

For USD-target assets:
- target reference = 1.00 USD;
- an event starts when an hourly observation reaches an absolute deviation of at least 50 bps;
- recovery requires two consecutive hourly observations within 20 bps of target;
- record direction, maximum deviation, event duration and worst-point-to-recovery time.

## V0.1 decision

This method may be retained for research/testing, but it is **not yet approved as a public validated event detector**.

Do not publish:
- depeg probability;
- risk probability;
- “real-time early warning”;
- historical event counts without source/coverage QA.

## Required QA before public event charts

1. Asset eligibility
   - verified USD target only;
   - exclude non-USD pegs from the $1 rule;
   - explicitly handle rebasing/wrapper products.

2. Price source
   - record provider;
   - record venue/aggregation method;
   - do not silently mix sources across assets.

3. Sampling
   - hourly data can miss short events;
   - CoinGecko documents hourly granularity for 2–90 day auto windows and up to 100 days with explicit hourly interval on the relevant API tier;
   - longer history may become daily depending on endpoint/plan.

4. Missing observations
   - missing points do not imply recovery;
   - data gaps inside an event must be flagged.

5. Event opening
   - current rule uses one hourly observation >=50 bps;
   - run sensitivity checks before calling this robust.

6. Recovery
   - distinguish:
     a. first return inside 20 bps;
     b. confirmed recovery after two consecutive observations.

7. Open events
   - do not invent a duration end;
   - status = OPEN at last valid observation.

8. Sensitivity
   Suggested research QA grid:
   - start threshold: 25 / 50 / 100 bps
   - recovery threshold: 10 / 20 / 50 bps
   - recovery confirmation: 1 / 2 / 3 observations

These are validation settings, not website product options by default.

## Public interim state

Until the above QA is frozen:
- current price/deviation may be shown when the data source is healthy;
- depeg event-history chart should show `METHOD UNDER VALIDATION` or remain hidden;
- no event metric should appear on `/dashboard`.

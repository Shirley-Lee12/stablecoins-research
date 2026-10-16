# PUBLIC DEPEG DISPLAY DECISION V0.2

Status: FROZEN FOR IMPLEMENTATION

## Public decision

### Allowed now
On `/market-data/market`, when source health and asset metadata are valid:
- current/reference price;
- verified target value;
- current absolute deviation in basis points;
- timestamp and source.

Label this as:
`Observed price deviation`

### Not public in V0.2
- depeg-event history based on the 50 bps / 20 bps recovery rule;
- event counts;
- event-duration rankings;
- real-time depeg probability;
- future depeg probability;
- depeg risk score;
- dashboard depeg KPI.

Reason:
the event detector still requires validation across source granularity, missing observations, threshold sensitivity, open events, non-USD targets and historical coverage.

## UI behaviour

If event-history code already exists:
- keep it behind an internal/disabled implementation flag; or
- hide the module from public routes.

Do not show a large placeholder saying “coming soon”.
The public Market page should simply omit the event-history panel until it is approved.

## Price-deviation requirements

Before a token can appear:
- reference target must be verified;
- price source must be defined;
- observation timestamp must be valid;
- no missing/failed observation may be coerced to 1.00 or 0;
- wrappers/non-$1 targets must not inherit the USD-target formula blindly.

## Future validation baseline

Retain `DEPEG_EVENT_METHOD_V0.1.md` as research-method documentation.
A future package may approve event-history display after sensitivity and coverage QA.

# Visual QA V0.2

## READY assets

- AGT-D01 Agentic Payment Stack
- AGT-D02 Autonomy Levels
- AGT-D03 Three Fund-Control Models
- AGT-D04 Three Payment Rails
- AGT-D05 Protocol vs Product vs Infrastructure
- AGT-D06 Agentic Payment Risk Chain

All six:
- are editable SVG;
- use a 1600×900 viewBox;
- avoid embedded raster images;
- use system/web-safe font fallbacks;
- preserve the site's restrained blue/teal research aesthetic;
- are designed to be rebuilt as responsive components if Codex prefers;
- contain no unsupported dynamic numbers.

## Timeline
AGT-T01 is intentionally **not** a static final SVG.
`TIMELINE_DATA.json` is the canonical source because the timeline should be responsive and easy to update.

## Known implementation note
SVG text uses font fallbacks (`Inter`, `Noto Sans SC`, `PingFang SC`, `Arial`, sans-serif). Codex should map these to the site's actual typography tokens rather than bundling font files.

## Dark mode
The SVG files are light-mode reference assets. Preferred production implementation:
- convert fills/strokes to CSS semantic tokens, or
- recreate the SVG as JSX/SVG components using theme variables.
Do not simply invert the raster output.

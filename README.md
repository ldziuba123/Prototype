# Segment editor prototype

Static copy of the Piwik PRO segment-editor prototype, served with GitHub Pages.

- `/` is the main version (v3): nothing is revealed on hover. "+ AND" / "+ OR" sit on the bottom border of the groups, and duplicate / remove (rows and event cards) are always visible. Add `?hover=on` to see the old hover-revealed behaviour.
- `/v4/` is the drag & drop version, kept for reference.
- Add `?mode=editor` to open only the builder, without the report behind it.
- The editor is fully interactive. The report behind it needs a ClickHouse database that only exists on the author's machine, so here it shows "Report data unavailable".
- No build step: plain React (UMD) plus the design-system bundle in `ds/`.

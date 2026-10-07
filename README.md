# Segment editor prototype

Static copy of the Piwik PRO segment-editor prototype, served with GitHub Pages.

- `/` is v3 (click to add), `/v4/` is v4 (drag & drop). The bottom bar switches between them and carries the segment you are building across.
- The editor is fully interactive. The report behind it needs a ClickHouse database that only exists on the author's machine, so here it shows "Report data unavailable".
- No build step: plain React (UMD) plus the design-system bundle in `ds/`.

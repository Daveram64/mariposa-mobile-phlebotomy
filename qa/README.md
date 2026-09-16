# QA scripts

- `node qa/verify.js`: re-runs the September 2026 QA report's ranked claims against the site. Serve the repo root on port 8130 first (`npx http-server -p 8130 -s`). Needs Playwright with Chromium; set `EXE` at the top of the script to your Chromium binary. The last run's results are in `verify-log.json`.
- `node qa/checklist.js`: regenerates `LAUNCH-CHECKLIST.md` from every `CONFIRM(...)` marker in the source. Run it after editing copy.
- `node qa/duo.js`: iPhone Duo matrix (folded 466x678 and unfolded 626x890 at 3x) across every page, plus live fold and unfold resizes mid-scene. Same server and Chromium setup as `verify.js`.

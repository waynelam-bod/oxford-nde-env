# Print & Deliver verification

- `PrintDeliverService` updates native delivery state; the host renders one `nde-view-it-card .view-it-card-container` per service. No DOM insertion is needed.
- The host supplies `fulldisplay.constants.pnd_url`; the Oxford test view configures `https://print-and-deliver.bodleian.ox.ac.uk/`.
- `tests/print-deliver.spec.ts` checks guest, authenticated and signed-out rendering for MMS `991010939019707026` through `npm.cmd run start:proxy`. Login uses `.env` without persisting browser state.
- The sample record has no `pnx.display.creator`; an empty author is valid. Compare the copied ELD link to the original service href, which need not be an absolute ELD-domain URL.
- Focused unit command: `npm.cmd test -- --watch=false --browsers=ChromeHeadless --reporters=progress --include=src/app/oxford/print-deliver/print-deliver.service.spec.ts`. The progress reporter avoids the installed Jasmine 6 / HTML reporter `jasmine.QueryString` incompatibility.
- PowerShell should invoke `npm.cmd` to forward Angular arguments correctly. If Playwright uses a sandbox-local cache, set `PLAYWRIGHT_BROWSERS_PATH` to the installed user cache. Browser tests and the proxy may require approved execution outside the managed sandbox for localhost networking.
- The Print & Deliver href contains a JWT. Keep traces, screenshots and video disabled, and assert boolean metadata checks without printing raw links or credentials.

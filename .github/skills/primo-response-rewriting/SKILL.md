---
name: primo-response-rewriting
description: 'Use when intercepting or rewriting Primo NDE REST responses, especially AlmaRequest pickupLocation options; debugging why changes work locally but not in production; or deploying and verifying custom-module network interception.'
---

# Primo Response Rewriting

Use this workflow for changes to the AlmaRequest pickup-location list or other Primo-owned REST responses. The request is made by Primo's NDE application, not by this custom module's Angular HttpClient.

## Known Behavior and Failure History

- The relevant response is from `/primaws/rest/priv/ILSServices/titleServices/{mmsId}/{serviceId}/AlmaRequest`. IDs vary per item/service; do not hard-code them.
- Pickup choices are under `services-arr.services[].groups-list-map[].pickupLocation[]`. Each option has a `key` and display `value`.
- The desired transform prefixes `value` with `Read At: ` when `key` ends in `CIRCULATION_DESK`, and `Borrow From: ` when it ends in `LIBRARY`. Existing prefixes must not be duplicated. Blacklist entries remove a location by exact key or value.
- `proxy/proxy.conf.mjs` is only used by the local dev proxy. It cannot change production traffic on the Primo host.
- An Angular `HttpInterceptor` in this custom module does not see requests made by Primo's separately bootstrapped application.
- The first production XHR attempt attached a `load` listener inside wrapped `send()`. This was too late: Angular registers its own `load` handler before calling `send()`, reads the unmodified response first, and keeps that data for the UI.
- The current XHR approach shadows the instance `response` and `responseText` getters during `open()`, before listeners are registered. It delegates to the native prototype getters and transforms lazily when `readyState === 4`. Do not replace this with a `load` listener.
- A successful local build is not a production deployment. Production uses the uploaded Alma custom package; upload the newly generated `dist/44OXF_INST-SOLO_NDE.zip` before testing the live site.

## Source of Truth

- `src/app/services/alma-request-override.ts`: production URL matching and JSON transform. The blacklist can be loaded from the translation key `fulldisplay.constants.request_blacklist` as an array of strings or an object with a `blacklist_keys` array; entries match exact keys or values.
- `src/app/services/network-interceptor.service.ts`: production `fetch` and XHR interception. `init()` is called from the custom module's `AppModule` constructor so the patches are installed as early as this module can run.
- `src/app/app.module.ts`: initialization point for the network interceptor.
- `proxy/alma-request-override.mjs` and the AlmaRequest rule in `proxy/proxy.conf.mjs`: local development equivalent. Keep the production TypeScript and dev-proxy transforms in sync.

## Procedure

1. Inspect the actual request in the browser Network panel. Confirm its path ends in `/AlmaRequest`, note whether the transport is `fetch` or XHR, and inspect the response schema. Primo may use a different MMS/service ID or query string than an example URL.
2. Change the transform in the production TypeScript source. Keep the `.mjs` dev-proxy transform equivalent if local proxy testing is needed. Do not rely on Angular `HttpClient` interceptors for Primo-owned traffic.
3. Confirm the URL matcher covers the observed endpoint without matching unrelated requests. Keep transformations idempotent and preserve the rest of the response shape.
4. Test locally with `yarn start:proxy`, but treat this only as dev-proxy validation. Run `yarn build` and confirm the build produces the package zip.
5. Upload that exact zip to the Alma custom package, wait for deployment, and hard-reload the Primo page to avoid cached remote entries/chunks.
6. On the production page, trigger the request through the actual Request workflow. Verify the request occurs after the custom module is loaded, then inspect the rendered pickup-location options: labels should have the correct prefix and blacklisted locations should be absent.
7. If the UI is unchanged, do not conclude the fix works from source or build output alone. Check the deployed `remoteEntry.js` and lazy chunk for a unique transform marker, confirm the runtime XHR/fetch patch is installed, inspect the actual API response as consumed by the page, and compare it with the rendered dropdown. Check console/network errors and confirm the uploaded package is the latest build.

## Completion Criteria

Call the change complete only after the production custom package is deployed and the real pickup-location dropdown shows the expected transformed options. A successful build, a modified local proxy response, or finding the code in a deployed chunk is necessary evidence but not sufficient end-to-end verification.
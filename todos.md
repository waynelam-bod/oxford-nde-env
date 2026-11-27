# Todos

<!-- next-id: 2 -->
## Inbox
1. [x] Electronic Legal Deposit print and deliver link - A link "Print & Deliver" should be showing beneath the Electronic Legal Deposit link and should only show when user is logged in. By default, it should use the ngrx state to replicate a similar link in additional to the existing link as much as possible and avoid use DOM manipulation only if necessary. It should watch the state in Delivery > entities > delivery > electronicServices in the ngrx store to trigger and add extra link to it. It should only be added on Electronic Legal Deposit (ELD) records, that is determined by in the ngrx store, selected record in Search entities which is selected. The current selected record can be determine by full-display > selectedRecordId. And in the selected record, the entitiy pnx > display > rights, if it starts with "Legal Deposit" and when its entities pnx > display > identifier has "eld.bodleian.ox.ac.uk", then it is an ELD records. Or if in the selected record, the entity pnx > display > type is equal to eld_article, it is an ELD record as well. And an extra link should be added. To add these link, at Delivery > selected entities > delivery > electronicServices. Add an additional entries like this:
{
    adaptorid: 'ALMA_01',
    serviceUrl: pndUrl + "?mms_id=" + mms_id + "&title=" + encodeURI(title) + "&author=" + encodeURI(author) + "&link=" + elDlink + "&jwt=" + jwt,
    licenceExist: 'false',
    packageName: 'Print & Deliver',
    availiability: '',
    publicNote: 'To order and receive printed copies of electronic Legal Deposit (eLD) content to your postal address',
    hasAccess: false,
    serviceType: 'ELECTRONIC',
    registrationRequired: false,
    numberOfFiles: 0,
    cdlItemAvailable: false,
    cdl: false,
    ndeCdlSessionActive: false,
    fromNetwork: false,
    displayInEmbedViewer: true,
    collapse: false,
    displayExternalViewer: false,
    shouldDisplayInDigitalViewer: false
}

pndUrl should be get from translation fulldisplay.constants.let mms_id from selected item entity > pnx > control > sourcerecordid
title from selected item entity > pnx > display > title
author from selected item entity > pnx > display > creator || '';
and the author should strip out the $$Q and after bit
jwt from the store, user > jwt

The additional link should be placed within nde-view-it-card as an additonal div with class view-it-card-container, similar to the link before it.

The success of it is verified by opening a full display of mms id 991010939019707026 and be able to see that additional link "Print & Deliver". It should spawn a dev server and check the URL that query mmsid like the following
/nde/fulldisplay?query=991010939019707026&tab=Everything&search_scope=MyInst_and_CI&lang=en&vid=44OXF_INST:SOLO_NDE&docid=alma991010939019707026&adaptor=Local Search Engine&context=L&isFrbr=false&isHighlightedRecord=false&state=

Use the test user login in .env and choose "Other users" if login is needed to verify.
### Item 1 acceptance verification (2026-11-27)

- Existing implementation `4ad188f` verified without service changes.
- `npm.cmd run start:proxy`: proxy compiled and served the specified full-display record.
- Authenticated Other users login from `.env`: exactly one Print & Deliver native card immediately after Electronic Legal Deposit. Checked configured destination, selected MMS/title, optional author, copied ELD service href, and JWT presence without logging tokens.
- Host translation `fulldisplay.constants.pnd_url` is configured to `https://print-and-deliver.bodleian.ox.ac.uk/`.
- Guest page, logout transition and fresh logged-out full display: Print & Deliver absent, original ELD card retained.
- `npm.cmd test -- --watch=false --browsers=ChromeHeadless --reporters=progress --include=src/app/oxford/print-deliver/print-deliver.service.spec.ts`: six passed. Default HTML reporter fails before tests with `jasmine.QueryString is not a constructor`; progress reporter works.
- `npm.cmd run build`: passed, including archive generation.
- `node node_modules/@playwright/test/cli.js test tests/print-deliver.spec.ts`: passed against the running proxy, with `PLAYWRIGHT_BROWSERS_PATH` pointing to the installed user browser cache.
- Closed with the configured `adapters/backlog-done.ps1 -Id 1`; `backlog-sync.ps1` reports item 1 done.

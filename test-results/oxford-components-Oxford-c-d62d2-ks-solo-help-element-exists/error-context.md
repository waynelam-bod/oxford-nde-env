# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: oxford-components.spec.ts >> Oxford component render checks >> solo-help element exists
- Location: tests\oxford-components.spec.ts:36:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 60000ms exceeded.
Call log:
  - waiting for locator('solo-help')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - link "Bodleian Libraries" [ref=e8] [cursor=pointer]:
      - /url: https://www.bodleian.ox.ac.uk/
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic:
          - generic:
            - button "Skip to Main menu links"
          - generic:
            - button "Skip to Search bar"
          - generic:
            - button "Skip to Quick Access Links"
          - generic:
            - button "Skip to Welcome to the library"
          - generic:
            - button "Skip to Announcements:"
          - generic:
            - button "Skip to About the Library"
        - link [ref=e13] [cursor=pointer]:
          - /url: /nde/home?lang=en&vid=44OXF_INST%3ASOLO_NDE
          - img "The Library Logo" [ref=e14]
        - text: Main menu links
        - navigation "Main Menu Region" [ref=e15]:
          - navigation "Main Menu Region" [ref=e16]:
            - list [ref=e18]:
              - listitem [ref=e19]:
                - link "New Search" [ref=e20] [cursor=pointer]:
                  - /url: /nde/home?vid=44OXF_INST%3ASOLO_NDE&lang=en
                - separator [ref=e24]
              - listitem [ref=e25]:
                - link "Help, opens in a new window" [ref=e26] [cursor=pointer]:
                  - /url: https://libguides.bodleian.ox.ac.uk/solo/help
                  - generic [ref=e27]: Help
                - separator [ref=e35]
              - listitem [ref=e36]:
                - link "Purchase Request, opens in a new window" [ref=e37] [cursor=pointer]:
                  - /url: https://forms.office.com/e/bdkEm5wDzu
                  - generic [ref=e38]: Purchase Request
                - separator [ref=e46]
              - listitem [ref=e47]:
                - link "Need more?" [ref=e48] [cursor=pointer]:
                  - /url: /nde/blankIll?lang=en&vid=44OXF_INST%3ASOLO_NDE
                - separator [ref=e52]
              - listitem [ref=e53]:
                - link "Browse" [ref=e54] [cursor=pointer]:
                  - /url: /nde/browse?lang=en&vid=44OXF_INST%3ASOLO_NDE
                - separator [ref=e58]
              - listitem [ref=e59]:
                - link "Journal Search" [ref=e60] [cursor=pointer]:
                  - /url: /nde/jsearch?lang=en&vid=44OXF_INST%3ASOLO_NDE
                - separator [ref=e64]
              - listitem [ref=e65]:
                - button "More Options" [ref=e66]:
                  - generic [ref=e67]: More
      - generic [ref=e74]:
        - text: Language bar and user area
        - button "Open user actions menu button" [ref=e78] [cursor=pointer]
    - main [ref=e86]:
      - generic [ref=e87]:
        - search "Search Bar Region" [ref=e94]:
          - button "Show results from Search Everything" [ref=e99]:
            - generic [ref=e100]: Search Everything
          - generic [ref=e106]:
            - generic [ref=e108]:
              - combobox "Search field" [ref=e109]
              - button "Submit search" [ref=e111] [cursor=pointer]
            - generic [ref=e117]:
              - button "Ask Anything" [ref=e118]
              - button "Advanced Search" [ref=e127]
        - main [ref=e135]:
          - generic [ref=e136]:
            - heading "Quick Access Links" [level=2] [ref=e137]
            - list [ref=e138]:
              - listitem [ref=e139]:
                - link "Opening hours" [ref=e140] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e147]:
                - link "FAQ" [ref=e148] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e155]:
                - link "Ask a librarian" [ref=e156] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e163]:
                - link "Search tips" [ref=e164] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e171]:
                - link "Study room" [ref=e172] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e179]:
            - generic [ref=e180]:
              - heading "Welcome to the library" [level=2] [ref=e181]
              - generic [ref=e182]: Access your account by signing in and enabling more capabilities
              - link "Go to my library card" [ref=e183] [cursor=pointer]:
                - /url: ""
            - generic [ref=e184]:
              - generic [ref=e185]:
                - heading "Announcements:" [level=2] [ref=e186]
                - heading "New library resources" [level=3] [ref=e187]
              - article [ref=e188]:
                - paragraph [ref=e189]: Lorem ipsum dolor sit amet consectetur. Varius ipsum amet elit convallis. Egestas arcu volutpat morbi urna cursus amet.
          - generic [ref=e192]:
            - heading "About the Library" [level=2] [ref=e193]
            - paragraph [ref=e194]: Primo provides a simple, one-stop search platform for books and e-books, videos, articles, digital media, and more.
            - generic [ref=e195]:
              - generic [ref=e196]: "Primo also helps you manage your research. Sign in to:"
              - list [ref=e197]:
                - listitem [ref=e198]:
                  - img "Library image" [ref=e199]
                  - generic [ref=e200]: Reserve and renew books
                - listitem [ref=e201]:
                  - img "Library image" [ref=e202]
                  - generic [ref=e203]: Create favorites lists
                - listitem [ref=e204]:
                  - img "Library image" [ref=e205]
                  - generic [ref=e206]: Reserve and renew books
                - listitem [ref=e207]:
                  - img "Library image" [ref=e208]
                  - generic [ref=e209]: View full search results
      - generic [ref=e214]:
        - paragraph [ref=e215]: © Bodleian Libraries 2026
        - generic [ref=e216]:
          - link "Accessibility" [ref=e217] [cursor=pointer]:
            - /url: https://visit.bodleian.ox.ac.uk/accessibility
          - generic [ref=e218]: "|"
          - link "Privacy" [ref=e219] [cursor=pointer]:
            - /url: https://glam.web.ox.ac.uk/privacy-policy-solo
          - generic [ref=e220]: "|"
          - link "Cookies" [ref=e221] [cursor=pointer]:
            - /url: /nde/custom/44OXF_INST-SOLO_NDE/assets/solo-cookies.html
  - generic [ref=e222]: Loading complete
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const RENDER_TIMEOUT_MS = 60_000;
  4  | const TEST_TIMEOUT_MS = 150_000;
  5  | 
  6  | const HOME_URL =
  7  |   process.env.OXFORD_HOME_URL ??
  8  |   '/nde/home?vid=44OXF_INST:SOLO_NDE&lang=en';
  9  | 
  10 | async function expectExistsWithSlowRender(page: Page, selector: string): Promise<void> {
> 11 |   await page.waitForSelector(selector, {
     |              ^ TimeoutError: page.waitForSelector: Timeout 60000ms exceeded.
  12 |     state: 'attached',
  13 |     timeout: RENDER_TIMEOUT_MS
  14 |   });
  15 | }
  16 | 
  17 | test.describe('Oxford component render checks', () => {
  18 |   test.describe.configure({ mode: 'serial' });
  19 |   test.setTimeout(TEST_TIMEOUT_MS);
  20 | 
  21 |   test('startup: home URL is reachable', async ({ request }) => {
  22 |     const response = await request.get(HOME_URL);
  23 |     expect(response.ok()).toBeTruthy();
  24 |   });
  25 | 
  26 |   test('nde-logo element exists', async ({ page }) => {
  27 |     await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
  28 |     await expectExistsWithSlowRender(page, 'nde-logo');
  29 |   });
  30 | 
  31 |   test('nde-footer element exists', async ({ page }) => {
  32 |     await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
  33 |     await expectExistsWithSlowRender(page, 'nde-footer');
  34 |   });
  35 | 
  36 |   test('solo-help element exists', async ({ page }) => {
  37 |     await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
  38 |     await expectExistsWithSlowRender(page, 'solo-help');
  39 |   });
  40 | 
  41 |   test('custom-announcements-loader element exists', async ({ page }) => {
  42 |     await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
  43 |     await expectExistsWithSlowRender(page, 'custom-announcements-loader');
  44 |   });
  45 | });
  46 | 
```
import { expect, test } from '@playwright/test';

const RENDER_TIMEOUT_MS = 60_000;
const TEST_TIMEOUT_MS = 150_000;

const HOME_URL =
  process.env.OXFORD_HOME_URL ??
  '/nde/home?vid=44OXF_INST:SOLO_NDE&lang=en';

async function expectExistsWithSlowRender(page: Page, selector: string): Promise<void> {
  await page.waitForSelector(selector, {
    state: 'attached',
    timeout: RENDER_TIMEOUT_MS
  });
}

test.describe('Oxford component render checks', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(TEST_TIMEOUT_MS);

  test('startup: home URL is reachable', async ({ request }) => {
    const response = await request.get(HOME_URL);
    expect(response.ok()).toBeTruthy();
  });

  test('nde-logo element exists', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await expectExistsWithSlowRender(page, 'nde-logo');
  });

  test('nde-footer element exists', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await expectExistsWithSlowRender(page, 'nde-footer');
  });

  test('solo-help element exists', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await expectExistsWithSlowRender(page, 'solo-help');
  });

  test('custom-announcements-loader element exists', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await expectExistsWithSlowRender(page, 'custom-announcements-loader');
  });
});

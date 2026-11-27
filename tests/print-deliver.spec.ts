import { expect, test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const MMS_ID = '991010939019707026';
const FULL_DISPLAY = '/nde/fulldisplay?' + new URLSearchParams({
  query: MMS_ID, tab: 'Everything', search_scope: 'MyInst_and_CI', lang: 'en',
  vid: '44OXF_INST:SOLO_NDE', docid: `alma${MMS_ID}`, adaptor: 'Local Search Engine',
  context: 'L', isFrbr: 'false', isHighlightedRecord: 'false', state: ''
});

test.afterEach(async ({ page }) => {
  // Playwright also writes an error-context DOM snapshot on failure, independently of tracing.
  // Clear token-bearing links before the context fixture collects that snapshot.
  if (!page.isClosed()) await page.goto('about:blank');
});

test('ELD Print & Deliver uses native cards and follows authentication', async ({ page }) => {
  test.setTimeout(150_000);
  // The native link contains a JWT: never save traces, screenshots or video of this session.
  test.skip(!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD, 'Requires .env test login');
  page.setDefaultTimeout(60_000);
  await page.goto(FULL_DISPLAY, { waitUntil: 'domcontentloaded' });
  const cards = page.locator('nde-view-it-card .view-it-card-container');
  const printLink = page.getByRole('link', { name: /Print & Deliver/ });
  await expect(cards.first()).toContainText('Electronic Legal Deposit');
  await expect(printLink).toHaveCount(0);

  await page.getByRole('button', { name: 'Open user actions menu button' }).click();
  await page.locator('button').filter({ hasText: /^\s*Sign in\s*$/i }).click();
  await page.getByRole('button', { name: /^Other users/ }).click();
  await page.locator('#username').fill(process.env.TEST_USERNAME!);
  await page.locator('#password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.locator('#password')).toHaveCount(0);

  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('Electronic Legal Deposit');
  await expect(cards.nth(1)).toContainText('Print & Deliver');
  await expect(cards.nth(1)).toContainText('To order and receive printed copies');
  await expect(printLink).toHaveCount(1);
  await expect(printLink).toBeVisible();
  // Return booleans so assertion failures cannot disclose the JWT-bearing href.
  const eldHref = await cards.first().getByRole('link', { name: /Electronic Legal Deposit/ }).getAttribute('href');
  const metadata = await printLink.evaluate((element, { mmsId, eldHref }) => {
    const url = new URL((element as HTMLAnchorElement).href);
    return {
      configuredDestination: url.origin === 'https://print-and-deliver.bodleian.ox.ac.uk',
      mmsId: url.searchParams.get('mms_id') === mmsId,
      title: url.searchParams.get('title')?.trim() === 'Harry Potter',
      author: url.searchParams.has('author') && !url.searchParams.get('author')!.includes('$$Q'),
      eldLink: !!eldHref && url.searchParams.get('link') === eldHref,
      jwt: !!url.searchParams.get('jwt')
    };
  }, { mmsId: MMS_ID, eldHref });
  expect(metadata).toEqual({
    configuredDestination: true, mmsId: true, title: true, author: true, eldLink: true, jwt: true
  });

  await page.getByRole('button', { name: 'Open user actions menu button' }).click();
  await page.locator('button').filter({ hasText: /^\s*Sign out\s*$/i }).click();
  await expect(printLink).toHaveCount(0);
  await page.goto(FULL_DISPLAY, { waitUntil: 'domcontentloaded' });
  await expect(cards.first()).toContainText('Electronic Legal Deposit');
  await expect(cards).toHaveCount(1);
  await expect(printLink).toHaveCount(0);
});

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

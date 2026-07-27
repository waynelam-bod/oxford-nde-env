import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readPackageNameFromEnv() {
  try {
    const envPath = path.resolve(__dirname, '../build-settings.env');
    const envText = fs.readFileSync(envPath, 'utf8');
    const instId = (envText.match(/^INST_ID=(.*)$/m)?.[1] || '').trim();
    const viewId = (envText.match(/^VIEW_ID=(.*)$/m)?.[1] || '').trim();

    if (instId && viewId) {
      return `${instId}-${viewId}`;
    }
  } catch {
    // Fall back to a safe default used in template examples.
  }

  return 'MOCKINST-MOCKVID';
}

const packageName = readPackageNameFromEnv();
const base = `custom/${packageName}/assets`;

export const customizationConfigOverride = {
  favIcon: `${base}/images/favicon.ico`,
  libraryLogo: `${base}/images/library-logo.png`,
  viewSvg: `${base}/icons/custom_icons.svg`,
  homepage: {
    homepageBGImage: `${base}/homepage/homepage_background.svg`,
    html: {
      en: `${base}/homepage/homepage_en.html`,
      he: `${base}/homepage/homepage_he.html`,
      ar: `${base}/homepage/homepage_ar.html`,
      fr: `${base}/homepage/homepage_fr.html`,
      de: `${base}/homepage/homepage_de.html`,
      es: `${base}/homepage/homepage_es.html`,
      it: `${base}/homepage/homepage_it.html`,
      pl: `${base}/homepage/homepage_pl.html`,
      ja: `${base}/homepage/homepage_ja.html`,
      zh: `${base}/homepage/homepage_zh.html`
    }
  }
};

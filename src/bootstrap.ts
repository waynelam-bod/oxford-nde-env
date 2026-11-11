import "@angular/compiler";
import { AppModule } from './app/app.module';
import {bootstrap} from "@angular-architects/module-federation-tools";

declare const __webpack_public_path__: string;

function loadCustomStylesheet(): Promise<void> {
  const publicPath = new URL(__webpack_public_path__, document.baseURI);
  const stylesheetUrl = new URL('custom.css', publicPath).href;
  const existingStylesheet = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  ).find(link => link.href === stylesheetUrl);
  const stylesheet = existingStylesheet ?? document.createElement('link');

  if (stylesheet.sheet) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    stylesheet.addEventListener('load', () => resolve(), {once: true});
    stylesheet.addEventListener('error', () => {
      console.error(`Failed to load custom stylesheet: ${stylesheetUrl}`);
      resolve();
    }, {once: true});

    if (!existingStylesheet) {
      stylesheet.rel = 'stylesheet';
      stylesheet.href = stylesheetUrl;
      document.head.appendChild(stylesheet);
    }
  });
}

export const bootstrapRemoteApp = (bootstrapOptions: any) => {
   return loadCustomStylesheet().then(() => bootstrap(AppModule(bootstrapOptions), {
      production: true,
      appType: 'microfrontend'
    })).then(r => {
      console.log('custom remote app bootstrap success!', r);
      return r
  });
}

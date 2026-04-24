import "@angular/compiler";
import { AppModule } from './app/app.module';
import {bootstrap} from "@angular-architects/module-federation-tools";
import { HomeBannerService } from './app/oxford/home-banner/home-banner.service';
export { selectorComponentMap } from './app/custom1-module/customComponentMappings';

export const bootstrapRemoteApp = (bootstrapOptions: any = {}) => {
  // Ensure providers is always present
  if (!bootstrapOptions.providers) {
    bootstrapOptions.providers = [];
  }
  console.log('[bootstrapRemoteApp] Starting remote app bootstrap', bootstrapOptions);
  const AppModuleClass = AppModule(bootstrapOptions);
  console.log('[bootstrap.ts] AppModuleClass:', AppModuleClass);
  return bootstrap(AppModuleClass, {
    production: true,
    appType: 'microfrontend'
  }).then(r => {
    const homeBannerService = r.injector.get(HomeBannerService, null);
    if (homeBannerService) {
      homeBannerService.init();
      r.onDestroy(() => homeBannerService.destroy());
    }
    console.log('[bootstrapRemoteApp] custom remote app bootstrap success!', r);
    if (typeof window !== 'undefined') {
      (window as any)['customModuleBootstrapResult'] = r;
    }
    return r
  }).catch(e => {
    console.error('[bootstrapRemoteApp] Bootstrap failed', e);
    throw e;
  });
}


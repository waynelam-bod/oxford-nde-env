import {ApplicationRef, DoBootstrap, Injector, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {createCustomElement, NgElementConstructor} from "@angular/elements";
import {Router} from "@angular/router";
import {selectorComponentMap} from "./custom1-module/customComponentMappings";
import {TranslateModule} from "@ngx-translate/core";
import { CommonModule } from '@angular/common';
import { AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import {SHELL_ROUTER} from "./injection-tokens";
import { HomeBannerService } from './oxford/home-banner/home-banner.service';
import { NetworkInterceptorService } from './services/network-interceptor.service';

export const AppModule = ({providers, shellRouter}: {providers:any, shellRouter: Router}) => {
   @NgModule({
    declarations: [
      AppComponent,
      AutoAssetSrcDirective
    ],
    exports: [AutoAssetSrcDirective],
    imports: [
      BrowserModule,
      CommonModule,
      TranslateModule.forRoot({})
    ],
    providers: [...providers, {provide: SHELL_ROUTER, useValue: shellRouter}],
    bootstrap: []
  })
  class AppModule implements DoBootstrap{
    private webComponentSelectorMap = new Map<string,  NgElementConstructor<unknown>>();

    constructor(
      private injector: Injector,
      private router: Router,
      private homeBannerService: HomeBannerService,
      private networkInterceptorService: NetworkInterceptorService
    ) {
      router.dispose(); //this prevents the router from being initialized and interfering with the shell app router
      this.networkInterceptorService.init(); //patch fetch/XHR as early as possible, before Primo issues the AlmaRequest call
    }

    ngDoBootstrap(appRef: ApplicationRef) {
      for (const [key, value] of selectorComponentMap) {
        const existingElement = customElements.get(key);
        if (existingElement) {
          this.webComponentSelectorMap.set(key, existingElement as NgElementConstructor<unknown>);
          continue;
        }

        const angularElement = createCustomElement(value, {injector: this.injector});
        const customElement = class extends (angularElement as CustomElementConstructor) {};
        customElements.define(key, customElement);
        this.webComponentSelectorMap.set(key, customElement as NgElementConstructor<unknown>);
      }

      this.homeBannerService.init();
    }

    /**
     * Use componentMapping, selectorComponentMap
     * @param componentName
     */
    public getComponentRef(componentName:string) {
      const customElement = this.webComponentSelectorMap.get(componentName);
      if (!customElement) {
        return undefined;
      }

      return class extends (customElement as CustomElementConstructor) {} as NgElementConstructor<unknown>;
    }
  }
  return AppModule
}

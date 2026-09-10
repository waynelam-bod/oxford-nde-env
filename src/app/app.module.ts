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

const registeredCustomElements = new Set<string>();


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
      private homeBannerService: HomeBannerService
    ) {
      router.dispose(); //this prevents the router from being initialized and interfering with the shell app router
    }

    ngDoBootstrap(appRef: ApplicationRef) {
      for (const [key, value] of selectorComponentMap) {
        if (registeredCustomElements.has(key) || customElements.get(key)) {
          this.webComponentSelectorMap.set(key, customElements.get(key) as NgElementConstructor<unknown>);
          continue;
        }

        const customElement = createCustomElement(value, {injector: this.injector});
        registeredCustomElements.add(key);
        try {
          customElements.define(key, customElement as NgElementConstructor<any>);
        } catch (error) {
          registeredCustomElements.delete(key);
          if (!(error instanceof DOMException) || error.name !== 'NotSupportedError') {
            throw error;
          }
        }
        this.webComponentSelectorMap.set(key, customElement);
      }

      this.homeBannerService.init();
    }

    /**
     * Use componentMapping, selectorComponentMap
     * @param componentName
     */
    public getComponentRef(componentName:string) {
      return this.webComponentSelectorMap.get(componentName);
    }
  }
  return AppModule
}


import {ApplicationRef, DoBootstrap, Injector, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import { RecordMessageComponent } from './oxford/record-message/record-message.component';
import { StoreModule } from '@ngrx/store';
import {createCustomElement, NgElementConstructor} from "@angular/elements";
import {Router} from "@angular/router";
import {selectorComponentMap} from "./custom1-module/customComponentMappings";
import {TranslateModule} from "@ngx-translate/core";
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AutoAssetSrcDirective } from './services/auto-asset-src.directive';
import {SHELL_ROUTER} from "./injection-tokens";



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
      HttpClientModule,
      TranslateModule.forRoot({}),
      StoreModule.forRoot({}),
      RecordMessageComponent
    ],
    providers: [...providers, {provide: SHELL_ROUTER, useValue: shellRouter}],
    bootstrap: []
  })
  class AppModule implements DoBootstrap {
    constructor(private injector: Injector, private router: Router) {
      console.log('[AppModule] Constructor called', { injector, router });
      try {
        console.log('[AppModule] Injector keys:', Object.keys(injector));
      } catch (e) {
        console.warn('[AppModule] Injector keys error:', e);
      }
      try {
        console.log('[AppModule] Router keys:', Object.keys(router));
      } catch (e) {
        console.warn('[AppModule] Router keys error:', e);
      }
      router.dispose(); //this prevents the router from being initialized and interfering with the shell app router
    }
    private webComponentSelectorMap = new Map<string,  NgElementConstructor<unknown>>();

    ngDoBootstrap(appRef: ApplicationRef) {
      console.log('[AppModule] ngDoBootstrap called');
      console.log('[AppModule] Registering custom elements from selectorComponentMap:', selectorComponentMap);
      for (const [key, value] of selectorComponentMap) {
        console.log(`[AppModule] Processing: ${key}`, value);
        if (!this.webComponentSelectorMap.has(key)) {
          const customElement = createCustomElement(value, {injector: this.injector});
          this.webComponentSelectorMap.set(key, customElement);
          console.log(`[AppModule] Created custom element for: ${key}`, customElement);
        }

        if (!customElements.get(key)) {
          const elementCtor = this.webComponentSelectorMap.get(key);
          if (elementCtor) {
            customElements.define(key, elementCtor);
            console.log(`[AppModule] Defined custom element: ${key}`, elementCtor);
          }
        } else {
          console.log(`[AppModule] Custom element already defined: ${key}`);
        }
      }
      console.log('[AppModule] Done registering custom elements');
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


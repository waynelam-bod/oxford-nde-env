import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { applyAlmaRequestOverride, isAlmaRequestUrl, setPickupLocationBlacklistFromTranslation, setPickupLocationLabelRulesFromTranslation } from './alma-request-override';

// Patches window.fetch/XMLHttpRequest to rewrite AlmaRequest responses in production,
// where there is no dev-server proxy to intercept the network call.
@Injectable({ providedIn: 'root' })
export class NetworkInterceptorService {
  private initialized = false;

  constructor(private readonly translate: TranslateService) {}

  init(): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }
    this.initialized = true;

    this.loadPickupLocationBlacklist();
    this.loadPickupLocationLabelRules();
    this.patchFetch();
    this.patchXhr();
  }

  private loadPickupLocationBlacklist(): void {
    this.translate.get('fulldisplay.constants.request_blacklist').pipe(take(1)).subscribe({
      next: (value: unknown) => setPickupLocationBlacklistFromTranslation(value),
    });
  }

  private loadPickupLocationLabelRules(): void {
    this.translate.get('fulldisplay.constants.request_label_rules').pipe(take(1)).subscribe({
      next: (value: unknown) => setPickupLocationLabelRulesFromTranslation(value),
    });
  }

  private patchFetch(): void {
    if (typeof window.fetch !== 'function') {
      return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const response = await originalFetch(...args);
      if (!isAlmaRequestUrl(this.resolveFetchUrl(args[0]))) {
        return response;
      }

      try {
        const json = await response.clone().json();
        const transformed = applyAlmaRequestOverride(json);
        return new Response(JSON.stringify(transformed), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch {
        return response;
      }
    };
  }

  private resolveFetchUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return input.url;
  }

  private patchXhr(): void {
    const xhrProto = XMLHttpRequest.prototype;
    const originalOpen = xhrProto.open;
    // Angular's HttpClient reads xhr.response/responseText from its own 'load' listener, which it
    // registers before send() is called - so hooking 'load' ourselves always runs too late. Instead,
    // shadow the response/responseText getters on the instance so any reader gets the transformed value.
    const responseDescriptor = Object.getOwnPropertyDescriptor(xhrProto, 'response');
    const responseTextDescriptor = Object.getOwnPropertyDescriptor(xhrProto, 'responseText');

    xhrProto.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: any[]) {
      const resolvedUrl = typeof url === 'string' ? url : url.toString();

      if (isAlmaRequestUrl(resolvedUrl) && responseDescriptor?.get && responseTextDescriptor?.get) {
        let cachedResponse: any;
        let responseCached = false;
        let cachedResponseText: string | undefined;
        let responseTextCached = false;

        Object.defineProperty(this, 'response', {
          configurable: true,
          get(this: XMLHttpRequest) {
            const raw = responseDescriptor.get!.call(this);
            if (this.readyState !== 4) return raw;
            if (!responseCached) {
              try {
                const json = typeof raw === 'string' ? JSON.parse(raw) : raw;
                cachedResponse = applyAlmaRequestOverride(json);
              } catch {
                cachedResponse = raw;
              }
              responseCached = true;
            }
            return cachedResponse;
          },
        });

        Object.defineProperty(this, 'responseText', {
          configurable: true,
          get(this: XMLHttpRequest) {
            const raw = responseTextDescriptor.get!.call(this);
            if (this.readyState !== 4) return raw;
            if (!responseTextCached) {
              try {
                cachedResponseText = JSON.stringify(applyAlmaRequestOverride(JSON.parse(raw)));
              } catch {
                cachedResponseText = raw;
              }
              responseTextCached = true;
            }
            return cachedResponseText;
          },
        });
      }

      return (originalOpen as any).call(this, method, url, ...rest);
    };
  }
}

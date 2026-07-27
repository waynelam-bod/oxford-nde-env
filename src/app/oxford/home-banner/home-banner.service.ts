import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';

export interface BannerImageConfig {
  url?: string;
  library?: string;
}

export interface HomeBannerConfig {
  background_image?: BannerImageConfig[];
}

@Injectable({ providedIn: 'root' })
export class HomeBannerService implements OnDestroy {
  private readonly translationKey = 'fulldisplay.constants.home_banner';
  private readonly domReadyHandler = () => this.renderIfNeeded();
  private readonly scopeClickHandler = (event: Event) => this.handleScopeClick(event);
  private renderedElement: HTMLElement | null = null;
  private initialized = false;
  private isRendering = false;
  private retryTimer: number | null = null;
  private retryAttempts = 0;
  private readonly maxRetryAttempts = 40; // ~10 seconds with 250ms spacing
  private readonly preloadedImages = new Set<string>();
  private cachedConfig: HomeBannerConfig | null = null;
  private selectedLibrary: string | null = null;

  constructor(private readonly translate: TranslateService) {}

  init(): void {
    if (this.initialized) {
      this.renderIfNeeded();
      return;
    }

    this.initialized = true;

    if (typeof document === 'undefined') {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.domReadyHandler);
    } else {
      this.renderIfNeeded();
    }

    // Listen for scope selection clicks
    document.addEventListener('click', this.scopeClickHandler, true);

    this.scheduleRetry();
  }

  destroy(): void {
    if (!this.initialized) {
      return;
    }
    this.initialized = false;
    this.renderedElement = null;
    this.isRendering = false;
    this.stopWatching();
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.scopeClickHandler, true);
    }
  }

  private handleScopeClick(event: Event): void {
    const target = event.target as HTMLElement;
    const menuItem = target.closest('button.mat-mdc-menu-item');
    
    if (!menuItem) {
      return;
    }

    // Only respond to scope selection menu (inside .options-container)
    const optionsContainer = menuItem.closest('.options-container');
    if (!optionsContainer) {
      return;
    }

    const dataQa = menuItem.getAttribute('data-qa');
    if (!dataQa) {
      return;
    }

    const configuredLibraries = this.getConfiguredLibraries();
    if (configuredLibraries.includes(dataQa)) {
      this.setLibraryBanner(dataQa);
    } else {
      // Non-library scope selected, reset to default banner
      this.resetToDefault();
    }
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private renderIfNeeded = (): void => {
    if (typeof document === 'undefined' || this.isRendering) {
      return;
    }

    const bannerHost = document.querySelector<HTMLElement>('.top-bar-background-image');
    if (!bannerHost) {
      this.renderedElement = null;
      this.scheduleRetry();
      return;
    }

    if (this.renderedElement === bannerHost && bannerHost.dataset['homeBannerApplied'] === 'true') {
      this.stopWatching();
      return;
    }

    this.renderedElement = bannerHost;
    this.isRendering = true;
    this.translate
      .get(this.translationKey)
      .pipe(take(1))
      .subscribe({
        next: (rawConfig: unknown) => {
          this.applyBackgroundFromConfig(bannerHost, rawConfig);
          this.isRendering = false;
          this.stopWatching();
        },
        error: () => {
          this.clearBackground(bannerHost);
          this.isRendering = false;
          this.stopWatching();
        }
      });
  };

  private applyBackgroundFromConfig(host: HTMLElement, rawConfig: unknown): void {
    const config = this.normalizeConfig(rawConfig);
    this.cachedConfig = config;
    this.ensureImagesPreloaded(config.background_image);

    // If a library was previously selected, preserve that selection
    if (this.selectedLibrary) {
      const libraryImage = this.findLibraryImage(this.selectedLibrary);
      if (libraryImage) {
        this.applyBackgroundImage(host, libraryImage);
        return;
      }
    }

    // Pick a random image from ALL available images on initial load
    const imageUrl = this.pickAnyImageUrl(config.background_image);
    if (!imageUrl) {
      this.clearBackground(host);
      return;
    }

    this.applyBackgroundImage(host, imageUrl);
  }

  private findLibraryImage(library: string): string | null {
    if (!this.cachedConfig?.background_image) {
      return null;
    }
    const match = this.cachedConfig.background_image.find(
      (img) => img.library === library && img.url?.trim()
    );
    return match?.url?.trim() || null;
  }

  /**
   * Pick any available image as fallback.
   */
  private pickAnyImageUrl(images?: BannerImageConfig[]): string | null {
    if (!images || images.length === 0) {
      return null;
    }
    const urls = images
      .map((img) => img.url?.trim())
      .filter((value): value is string => Boolean(value));
    if (urls.length === 0) {
      return null;
    }
    const index = this.getRandomIndex(urls.length);
    return urls[index];
  }

  private applyBackgroundImage(host: HTMLElement, imageUrl: string): void {
    const resolvedUrl = this.resolveUrl(imageUrl);
    if (!resolvedUrl) {
      this.clearBackground(host);
      return;
    }

    // Set up transition for smooth crossfade
    host.style.transition = 'opacity 0.3s ease-in-out';
    
    // Fade out, change image, fade in
    host.style.opacity = '0.6';
    
    setTimeout(() => {
      host.style.backgroundImage = `url("${resolvedUrl}")`;
      host.style.backgroundSize = 'cover';
      host.style.backgroundRepeat = 'no-repeat';
      host.style.backgroundPosition = 'center';
      host.dataset['homeBannerApplied'] = 'true';
      host.style.opacity = '1';
    }, 150);
  }

  /**
   * Change the banner to a library-specific image if available.
   * If no matching library is found, the banner remains unchanged.
   */
  setLibraryBanner(library: string): void {
    if (!this.cachedConfig?.background_image || !this.renderedElement) {
      return;
    }

    const matchingImage = this.cachedConfig.background_image.find(
      (img) => img.library === library && img.url?.trim()
    );

    if (matchingImage?.url) {
      this.selectedLibrary = library; // Persist selection for re-renders
      this.applyBackgroundImage(this.renderedElement, matchingImage.url);
    }
  }

  /**
   * Reset to default banner (clears library selection).
   */
  resetToDefault(): void {
    this.selectedLibrary = null;
    if (this.renderedElement && this.cachedConfig) {
      const imageUrl = this.pickRandomDefaultImageUrl(this.cachedConfig.background_image)
        ?? this.pickAnyImageUrl(this.cachedConfig.background_image);
      if (imageUrl) {
        this.applyBackgroundImage(this.renderedElement, imageUrl);
      }
    }
  }

  /**
   * Get the list of configured library codes.
   */
  getConfiguredLibraries(): string[] {
    if (!this.cachedConfig?.background_image) {
      return [];
    }
    return this.cachedConfig.background_image
      .map((img) => img.library)
      .filter((lib): lib is string => Boolean(lib));
  }

  private clearBackground(host: HTMLElement): void {
    host.style.removeProperty('background-image');
    host.dataset['homeBannerApplied'] = 'false';
  }

  /**
   * Pick a random image from entries WITHOUT a library (default banners).
   */
  private pickRandomDefaultImageUrl(images?: BannerImageConfig[]): string | null {
    if (!images || images.length === 0) {
      return null;
    }

    // Filter to only default images (no library specified)
    const defaultImages = images.filter((img) => !img.library);
    const urls = defaultImages
      .map((image) => image.url?.trim())
      .filter((value): value is string => Boolean(value));

    if (urls.length === 0) {
      return null;
    }

    const index = this.getRandomIndex(urls.length);
    return urls[index];
  }

  private normalizeConfig(rawConfig: unknown): HomeBannerConfig {
    if (!rawConfig) {
      return {};
    }

    if (typeof rawConfig === 'string') {
      // Check if translation key was returned (not found)
      if (rawConfig === this.translationKey || rawConfig.startsWith('fulldisplay.')) {
        return {};
      }
      
      try {
        return JSON.parse(rawConfig) as HomeBannerConfig;
      } catch {
        return {};
      }
    }

    if (typeof rawConfig === 'object') {
      return rawConfig as HomeBannerConfig;
    }

    return {};
  }

  private resolveUrl(url: string): string | null {
    if (typeof document === 'undefined') {
      return url;
    }

    try {
      return new URL(url, document.baseURI).toString();
    } catch {
      return null;
    }
  }

  private disconnectDomReadyListener(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.removeEventListener('DOMContentLoaded', this.domReadyHandler);
  }

  private stopWatching(): void {
    this.disconnectDomReadyListener();
    this.clearRetryTimer();
    this.retryAttempts = 0;
  }

  private scheduleRetry(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.isRendering) {
      return;
    }

    if (this.retryAttempts >= this.maxRetryAttempts) {
      this.stopWatching();
      return;
    }

    if (this.retryTimer !== null) {
      return;
    }

    this.retryAttempts += 1;
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      this.renderIfNeeded();
    }, 250);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer === null || typeof window === 'undefined') {
      return;
    }
    window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private getRandomIndex(length: number): number {
    if (length <= 1) {
      return 0;
    }

    if (typeof window !== 'undefined' && typeof window.crypto?.getRandomValues === 'function') {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % length;
    }

    return Math.floor(Math.random() * length);
  }

  private ensureImagesPreloaded(images?: BannerImageConfig[]): void {
    if (!images || typeof window === 'undefined' || typeof Image === 'undefined') {
      return;
    }

    images.forEach((image) => {
      const rawUrl = image.url?.trim();
      if (!rawUrl) {
        return;
      }
      const resolved = this.resolveUrl(rawUrl);
      if (!resolved || this.preloadedImages.has(resolved)) {
        return;
      }

      // Prime browser cache for all defined backgrounds
      const img = new Image();
      img.src = resolved;
      this.preloadedImages.add(resolved);
    });
  }
}

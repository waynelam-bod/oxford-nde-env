import { Injectable } from '@angular/core';
import { LIBRARY_INFO_LINKS, LibraryInfo } from '../config/library-info.config';

/**
 * Service to inject library info icons next to library titles in the location cards.
 * The library link data is imported from config/library-info.config.ts
 */
@Injectable({
  providedIn: 'root'
})
export class LocationInfoService {

  private observer: MutationObserver | null = null;
  private libraryMap: Map<string, LibraryInfo> = new Map();
  private initialized = false;

  initialize(): void {
    // Always reconnect the observer when initializing
    // (service may be reused when navigating back to the page)
    this.disconnectObserver();
    this.initialized = false;

    this.loadLibraryData();
  }

  private loadLibraryData(): void {
    if (Array.isArray(LIBRARY_INFO_LINKS)) {
      LIBRARY_INFO_LINKS.forEach((lib: LibraryInfo) => {
        this.libraryMap.set(lib.name.toLowerCase(), lib);
      });
      this.observeLocationTitles();
    }
  }

  private observeLocationTitles(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const attachToTitles = () => {
      const titles = document.querySelectorAll<HTMLElement>('.getit-library-title:not([data-library-info-attached])');
      titles.forEach(title => {
        this.attachInfoIcon(title);
      });
    };

    attachToTitles();

    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => {
        attachToTitles();
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  private attachInfoIcon(titleElement: HTMLElement): void {
    const titleText = titleElement.textContent?.trim();
    if (!titleText) return;

    const libraryInfo = this.libraryMap.get(titleText.toLowerCase());
    if (!libraryInfo) return;

    // Mark element as processed
    titleElement.setAttribute('data-library-info-attached', 'true');

    // Create button container
    const button = document.createElement('button');
    button.className = 'mat-icon-button library-info-button';
    button.setAttribute('type', 'button');
    button.setAttribute('title', `Visit ${libraryInfo.name}`);
    button.setAttribute('aria-label', `Open ${libraryInfo.name} website`);
    
    // Add Material Icons inline SVG (info icon)
    button.innerHTML = '<svg class="mat-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>';
    
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(libraryInfo.id, '_blank');
    };

    // Insert button after title
    titleElement.parentElement?.insertBefore(button, titleElement.nextSibling);
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  private disconnectObserver(): void {
    if (!this.observer) {
      return;
    }
    this.observer.disconnect();
    this.observer = null;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';

export interface LibraryInfo {
  id: string;
  name: string;
}

/**
 * Service to inject library info icons next to library titles in the location cards.
 * The library link data is loaded from assets/library-info-links.json
 */
@Injectable({
  providedIn: 'root'
})
export class LocationInfoService {
  private static readonly MAX_OBSERVE_MS = 15000;

  private readonly httpClient = inject(HttpClient);
  private observer: MutationObserver | null = null;
  private giveUpTimer: ReturnType<typeof setTimeout> | null = null;
  private libraryMap: Map<string, LibraryInfo> = new Map();
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.loadLibraryData();
  }

  private loadLibraryData(): void {
    this.httpClient.get<LibraryInfo[]>('/assets/library-info-links.json')
      .pipe(take(1))
      .subscribe({
        next: (data: LibraryInfo[]) => {
          if (Array.isArray(data)) {
            data.forEach((lib: LibraryInfo) => {
              this.libraryMap.set(lib.name.toLowerCase(), lib);
            });
            this.observeLocationTitles();
          }
        },
        error: (error) => {
          console.warn('Failed to load library-info-links.json:', error);
        }
      });
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
      this.giveUpTimer = setTimeout(() => this.disconnectObserver(), LocationInfoService.MAX_OBSERVE_MS);
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
    if (this.giveUpTimer) {
      clearTimeout(this.giveUpTimer);
      this.giveUpTimer = null;
    }
    if (!this.observer) {
      return;
    }
    this.observer.disconnect();
    this.observer = null;
  }
}

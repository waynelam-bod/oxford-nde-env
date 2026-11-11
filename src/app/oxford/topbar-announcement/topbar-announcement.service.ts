import { Injectable, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TopbarAnnouncementService implements OnDestroy {
  private observer: MutationObserver | null = null;

  init(): void {
    if (typeof document === 'undefined' || this.observer) {
      return;
    }
    this.mount();
    this.observer = new MutationObserver(() => this.mount());
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private mount(): void {
    const header = document.querySelector('nde-header');
    if (header && !header.querySelector('custom-topbar-announcement')) {
      header.prepend(document.createElement('custom-topbar-announcement'));
    }
  }
}

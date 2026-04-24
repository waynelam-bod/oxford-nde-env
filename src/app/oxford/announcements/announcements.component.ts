import {Component, OnDestroy, OnInit, inject} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {take} from 'rxjs';

@Component({
  selector: 'custom-announcements-loader',
  standalone: true,
  imports: [],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private observer: MutationObserver | null = null;
  private renderedElement: HTMLElement | null = null;
  private readonly renderIfNeeded = () => {
    if (typeof document === 'undefined') {
      return;
    }

    const container = document.querySelector<HTMLElement>('#homepage-announcements')
      || document.querySelector<HTMLElement>('.announcements article');
    if (!container) {
      return;
    }

    if (this.renderedElement === container && container.innerHTML.trim().length > 0) {
      this.disconnectObserver();
      return;
    }

    this.renderedElement = container;
    this.translate.get('fulldisplay.constants.nde_announcements')
      .pipe(take(1))
      .subscribe({
        next: (text: string) => {
          container.innerHTML = text;
          this.disconnectObserver();
        },
        error: () => {
          container.innerHTML = '';
          this.disconnectObserver();
        }
      });
    this.disconnectDomReadyListener();
  };

  ngOnInit(): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.renderIfNeeded);
    } else {
      this.renderIfNeeded();
    }

    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => this.renderIfNeeded());
      this.observer.observe(document.body, {childList: true, subtree: true});
    }
  }

  ngOnDestroy(): void {
    this.disconnectDomReadyListener();
    this.disconnectObserver();
  }

  private disconnectDomReadyListener(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.removeEventListener('DOMContentLoaded', this.renderIfNeeded);
  }

  private disconnectObserver(): void {
    if (!this.observer) {
      return;
    }
    this.observer.disconnect();
    this.observer = null;
  }
}

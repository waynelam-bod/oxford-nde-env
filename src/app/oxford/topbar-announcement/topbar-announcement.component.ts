import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SHELL_ROUTER } from '../../injection-tokens';

interface Announcement {
  viewId: string;
  message: string;
  from: string;
  to: string;
}

@Component({
  selector: 'custom-topbar-announcement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar-announcement.component.html',
  styleUrl: './topbar-announcement.component.scss'
})
export class TopbarAnnouncementComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router: Router = inject(SHELL_ROUTER);
  private readonly subscriptions = new Subscription();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private announcements: Announcement[] = [];
  private dismissed = new Set<Announcement>();

  visibleAnnouncements: Announcement[] = [];

  ngOnInit(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.subscriptions.add(this.translate.stream('fulldisplay.constants.general_message').subscribe({
      next: (value: unknown) => {
        this.announcements = this.parseAnnouncements(value);
        this.dismissed.clear();
        this.refresh();
      },
      error: (error: unknown) => console.error('[TopbarAnnouncement] Unable to load announcements', error)
    }));
    this.subscriptions.add(this.router.events.subscribe(() => this.refresh()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
  }

  dismiss(announcement: Announcement): void {
    this.dismissed.add(announcement);
    this.refresh();
  }

  private parseAnnouncements(value: unknown): Announcement[] {
    if (typeof value === 'string') {
      if (value === 'fulldisplay.constants.general_message' || !value.trim()) {
        return [];
      }
      try {
        value = JSON.parse(value);
      } catch (error) {
        console.error('[TopbarAnnouncement] Invalid announcement JSON', error);
        return [];
      }
    }
    if (!Array.isArray(value)) {
      console.error('[TopbarAnnouncement] Expected an array of announcements');
      return [];
    }
    return value.filter((item: unknown): item is Announcement => {
      if (!item || typeof item !== 'object') {
        console.warn('[TopbarAnnouncement] Invalid announcement entry', item);
        return false;
      }
      const entry = item as Record<string, unknown>;
      const valid = typeof entry['viewId'] === 'string' && typeof entry['message'] === 'string'
        && typeof entry['from'] === 'string' && typeof entry['to'] === 'string'
        && Number.isFinite(Date.parse(entry['from'])) && Number.isFinite(Date.parse(entry['to']))
        && Date.parse(entry['from']) <= Date.parse(entry['to']);
      if (!valid) {
        console.warn('[TopbarAnnouncement] Invalid announcement entry', item);
      }
      return valid;
    });
  }

  private refresh(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const now = Date.now();
    const viewId = new URLSearchParams(window.location.search).get('vid');
    const matching = this.announcements.filter(item => item.viewId === viewId && !this.dismissed.has(item));
    this.visibleAnnouncements = matching.filter(item => Date.parse(item.from) <= now && now <= Date.parse(item.to));
    const boundaries = matching.flatMap(item => [Date.parse(item.from), Date.parse(item.to) + 1])
      .filter(time => time > now);
    if (boundaries.length) {
      const delay = Math.min(Math.min(...boundaries) - now, 2147483647);
      this.timer = setTimeout(() => this.refresh(), delay);
    }
    this.changeDetector.markForCheck();
  }
}

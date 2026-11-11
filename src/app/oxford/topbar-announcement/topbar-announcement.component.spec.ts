import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SHELL_ROUTER } from '../../injection-tokens';
import { TopbarAnnouncementComponent } from './topbar-announcement.component';
import { TopbarAnnouncementService } from './topbar-announcement.service';

describe('TopbarAnnouncementComponent', () => {
  const translations = new Subject<unknown>();
  const navigation = new Subject();
  let originalUrl: string;

  beforeEach(() => {
    originalUrl = window.location.href;
    window.history.replaceState(null, '', '?vid=44OXF_INST:SOLO_NDE');
    TestBed.configureTestingModule({
      imports: [TopbarAnnouncementComponent],
      providers: [
        { provide: TranslateService, useValue: { stream: () => translations } },
        { provide: SHELL_ROUTER, useValue: { events: navigation } }
      ]
    });
  });

  afterEach(() => window.history.replaceState(null, '', originalUrl));

  it('filters JSON translations, sanitizes HTML, and dismisses a message', () => {
    const fixture = TestBed.createComponent(TopbarAnnouncementComponent);
    fixture.detectChanges();
    translations.next(JSON.stringify([
      { viewId: '44OXF_INST:SOLO_NDE', message: '<strong>Active</strong><img src=x onerror=alert(1)>', from: '2020-01-01T00:00:00Z', to: '2099-01-01T00:00:00Z' },
      { viewId: '44OXF_INST:SOLO', message: 'Other view', from: '2020-01-01T00:00:00Z', to: '2099-01-01T00:00:00Z' },
      { viewId: '44OXF_INST:SOLO_NDE', message: 'Expired', from: '2020-01-01T00:00:00Z', to: '2021-01-01T00:00:00Z' }
    ]));
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('.announcement').length).toBe(1);
    expect(element.querySelector('strong')?.textContent).toBe('Active');
    expect(element.querySelector('img')?.hasAttribute('onerror')).toBeFalse();
    element.querySelector('button')?.click();
    fixture.detectChanges();
    expect(element.querySelector('.announcement')).toBeNull();
    fixture.destroy();
  });

  it('updates at the start and end of an announcement', fakeAsync(() => {
    const fixture = TestBed.createComponent(TopbarAnnouncementComponent);
    fixture.detectChanges();
    const now = Date.now();
    translations.next([{ viewId: '44OXF_INST:SOLO_NDE', message: 'Scheduled',
      from: new Date(now + 1000).toISOString(), to: new Date(now + 2000).toISOString() }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.announcement')).toBeNull();
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Scheduled');
    tick(1001);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.announcement')).toBeNull();
    fixture.destroy();
  }));
});

describe('TopbarAnnouncementService', () => {
  it('mounts a single element in the header', () => {
    const header = document.createElement('nde-header');
    document.body.prepend(header);
    const service = new TopbarAnnouncementService();
    service.init();
    service.init();
    expect(header.querySelectorAll('custom-topbar-announcement').length).toBe(1);
    service.ngOnDestroy();
    header.remove();
  });
});

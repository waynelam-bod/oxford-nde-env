import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';
import { AssetBaseService } from '../../services/asset-base.service';

const FALLBACK_LANG = 'en';

@Component({
  selector: 'nde-header',
  standalone: true,
  template: `<div class="nde-header" [innerHTML]="headerHtml"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() lang?: string;

  protected headerHtml: SafeHtml | null = null;
  private currentLang: string | null = null;
  private destroyed = false;

  constructor(
    private readonly assetBase: AssetBaseService,
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHeader();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lang'] && !changes['lang'].firstChange) {
      this.loadHeader();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private loadHeader(): void {
    const lang = this.detectLanguage();
    if (lang === this.currentLang && this.headerHtml) {
      return;
    }

    this.currentLang = lang;
    this.fetchHeader(lang);
  }

  private fetchHeader(lang: string, hasRetried = false): void {
    const url = this.assetBase.resolveAssetUrl(`header-footer/header_${lang}.html`);
    this.http.get(url, { responseType: 'text' })
      .pipe(take(1))
      .subscribe({
        next: (html) => this.setHeaderHtml(html),
        error: () => {
          if (!hasRetried && lang !== FALLBACK_LANG) {
            this.fetchHeader(FALLBACK_LANG, true);
            return;
          }
          console.warn('[Header] Failed to load header markup for', lang);
          this.setHeaderHtml(null);
        }
      });
  }

  private setHeaderHtml(html: string | null): void {
    if (this.destroyed) {
      return;
    }

    this.headerHtml = html ? this.sanitizer.bypassSecurityTrustHtml(html) : null;
    this.cdr.markForCheck();
  }

  private detectLanguage(): string {
    const fromInput = this.normalizeLang(this.lang);
    if (fromInput) {
      return fromInput;
    }

    if (typeof window !== 'undefined') {
      const urlLang = this.normalizeLang(new URLSearchParams(window.location.search).get('lang'));
      if (urlLang) {
        return urlLang;
      }
    }

    if (typeof document !== 'undefined') {
      const docLang = this.normalizeLang(document.documentElement.getAttribute('lang'));
      if (docLang) {
        return docLang;
      }
    }

    return FALLBACK_LANG;
  }

  private normalizeLang(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.toLowerCase().split('-')[0];
  }
}

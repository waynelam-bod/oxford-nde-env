import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { RecordType, RecordTypeService } from './record-type.service';

interface ResolvedRecordMessage {
  text: string;
  isRed: boolean;
}

@Component({
  selector: 'solo-record-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './record-message.component.html',
  styleUrl: './record-message.component.scss'
})
export class RecordMessageComponent implements OnInit, OnDestroy {
  private static readonly PROCESS_DEBOUNCE_MS = 500;
  private static readonly MESSAGE_SELECTOR = '.solo-record-message[data-solo-context]';

  private readonly recordTypeService = inject(RecordTypeService);
  private readonly translate = inject(TranslateService);
  private observer: MutationObserver | null = null;
  private processTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;
  private readonly processedSearchDocIds = new Map<string, string>();
  private lastDetailDocId: string | null = null;
  private lastDetailSignature: string | null = null;

  ngOnInit(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.scheduleProcess();
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver((mutations) => this.onMutation(mutations));
      this.observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  ngOnDestroy(): void {
    if (this.processTimer) {
      clearTimeout(this.processTimer);
      this.processTimer = null;
    }

    this.disconnectObserver();

    this.removeAllMessageElements();
  }

  /**
   * MutationObserver callback.
   * Filters out mutations caused by our own DOM insertions (solo-record-message
   * elements) to prevent the feedback loop. The subscribe callbacks that render
   * messages run asynchronously after the observer is reconnected, so simply
   * disconnecting during processCurrentPage() is not sufficient.
   */
  private onMutation(mutations: MutationRecord[]): void {
    if (this.isProcessing) {
      return;
    }

    const hasExternalMutation = mutations.some((mutation) => {
      for (let index = 0; index < mutation.addedNodes.length; index += 1) {
        const node = mutation.addedNodes.item(index);
        if (!node) {
          continue;
        }
        if (node instanceof HTMLElement) {
          if (node.matches?.(RecordMessageComponent.MESSAGE_SELECTOR)) {
            continue;
          }
          return true;
        }
        return true;
      }

      for (let index = 0; index < mutation.removedNodes.length; index += 1) {
        const node = mutation.removedNodes.item(index);
        if (!node) {
          continue;
        }
        if (node instanceof HTMLElement) {
          if (node.matches?.(RecordMessageComponent.MESSAGE_SELECTOR)) {
            continue;
          }
          return true;
        }
        return true;
      }

      return false;
    });

    if (hasExternalMutation) {
      this.scheduleProcess();
    }
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private reconnectObserver(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
      return;
    }

    if (this.observer) {
      this.observer.observe(document.body, { childList: true, subtree: true });
    } else {
      this.observer = new MutationObserver((mutations) => this.onMutation(mutations));
      this.observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  private scheduleProcess(): void {
    if (this.processTimer) {
      return;
    }

    this.processTimer = setTimeout(() => {
      this.processTimer = null;
      this.processCurrentPage();
    }, RecordMessageComponent.PROCESS_DEBOUNCE_MS);
  }

  private processCurrentPage(): void {
    // Guard against re-entrancy (same pattern as HomeBannerService.isRendering)
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    // Disconnect observer while we mutate the DOM so our own changes
    // don't re-trigger the callback (same concept as AnnouncementsComponent.disconnectObserver)
    this.disconnectObserver();

    try {
      this.processSearchResults();
      this.processFullDisplay();
    } finally {
      this.isProcessing = false;
      // Reconnect observer so we catch the next genuine page navigation / DOM change
      this.reconnectObserver();
    }
  }

  private processSearchResults(): void {
    const itemCards = Array.from(document.querySelectorAll<HTMLElement>('nde-search-result-item-container .search-result-item.card'));
    const seenDocIds = new Set<string>();
    // On the full-display page, the current record is also rendered as a highlighted
    // search card alongside the detail panel. Showing the message in both places
    // duplicates it on screen, so let the detail-context message take precedence.
    const activeDetailDocId = document.querySelector('nde-record-availability') ? this.getDocIdFromUrl() : null;

    for (const itemCard of itemCards) {
      const docId = this.extractDocIdFromSearchItem(itemCard);
      if (!docId) {
        continue;
      }

      seenDocIds.add(docId);

      if (docId === activeDetailDocId) {
        itemCard.querySelector<HTMLElement>('.solo-record-message[data-solo-context="search"]')?.remove();
        this.processedSearchDocIds.delete(docId);
        continue;
      }

      // Skip if we already processed this docId and the card hasn't changed
      const existing = itemCard.querySelector<HTMLElement>('.solo-record-message[data-solo-context="search"]');
      const cachedSignature = this.processedSearchDocIds.get(docId);
      const currentSignature = this.getSearchItemSignature(itemCard, docId);

      if (existing && cachedSignature === currentSignature) {
        continue;
      }

      this.processedSearchDocIds.set(docId, currentSignature);

      this.recordTypeService.getRecordTypeById(docId)
        .pipe(
          take(1),
          switchMap((result) => this.resolveMessage(result))
        )
        .subscribe((message) => this.renderMessageInSearchItem(itemCard, docId, message));
    }

    // Clean up stale cached docIds
    for (const cachedDocId of this.processedSearchDocIds.keys()) {
      if (!seenDocIds.has(cachedDocId)) {
        this.processedSearchDocIds.delete(cachedDocId);
      }
    }

    const staleMessages = document.querySelectorAll<HTMLElement>('.solo-record-message[data-solo-context="search"]');
    staleMessages.forEach((messageEl) => {
      const messageDocId = messageEl.dataset['docid'];
      if (!messageDocId || !seenDocIds.has(messageDocId)) {
        messageEl.remove();
      }
    });
  }

  private getSearchItemSignature(itemCard: HTMLElement, docId: string): string {
    const fullDisplayLink = itemCard.querySelector<HTMLAnchorElement>('a[href*="/nde/fulldisplay"]');
    const linkHref = fullDisplayLink?.getAttribute('href') || fullDisplayLink?.href || '';

    const pnxUrlElement = itemCard.querySelector<HTMLElement>('.urlToXmlPnx');
    const pnxUrl = pnxUrlElement?.getAttribute('data-url') || pnxUrlElement?.getAttribute('title') || '';

    return [docId, linkHref, pnxUrl].join('|');
  }

  private processFullDisplay(): void {
    const availabilityEl = document.querySelector<HTMLElement>('nde-record-availability');
    if (!availabilityEl) {
      this.removeContextMessage('detail');
      this.lastDetailDocId = null;
      this.lastDetailSignature = null;
      return;
    }

    const docId = this.getDocIdFromUrl();
    if (!docId) {
      return;
    }

    // Skip if we already processed this exact docId and the availability element hasn't changed
    const currentSignature = `${docId}:${availabilityEl.outerHTML.length}`;
    if (this.lastDetailDocId === docId && this.lastDetailSignature === currentSignature) {
      return;
    }

    this.lastDetailDocId = docId;
    this.lastDetailSignature = currentSignature;

    this.recordTypeService.getRecordTypeById(docId)
      .pipe(
        take(1),
        switchMap((result) => this.resolveMessage(result))
      )
      .subscribe((message) => this.renderMessageInFullDisplay(message, availabilityEl));
  }

  private resolveMessage(record: { recordType: RecordType; pnx: any } | null): Observable<ResolvedRecordMessage | null> {
    if (!record || !record.recordType) {
      return of(null);
    }

    if (record.recordType === 'LIBGUIDES') {
      return this.resolveLibGuidesMessage(record.pnx);
    }

    if (record.recordType === 'ELDOAI' || record.recordType === 'ELDBOOKS') {
      return this.resolveTranslatedMessage('fulldisplay.constants.eld_legal_deposit_reg', false);
    }

    if (record.recordType === 'ELDOPENACCESS') {
      return this.resolveTranslatedMessage('fulldisplay.constants.eld_legal_deposit_oa_delivery', false);
    }

    if (record.recordType === 'ELDMAP') {
      return this.resolveTranslatedMessage('fulldisplay.constants.eld_legal_deposit_map', false);
    }

    return of(null);
  }

  private resolveLibGuidesMessage(pnx: any): Observable<ResolvedRecordMessage | null> {
    const description = pnx?.display?.description?.[0] || '';

    if (description.includes('within the United Kingdom')) {
      return this.resolveTranslatedMessage('fulldisplay.constants.lg_display_uk_restriction', false);
    }
    if (description.includes('Special password required')) {
      return this.resolveTranslatedMessage('fulldisplay.constants.lg_display_special_word_required', false);
    }
    if (description.includes('Oxford Single Sign-On (SSO) required')) {
      return this.resolveTranslatedMessage('fulldisplay.constants.lg_display_oxf_login', false);
    }
    if (description.includes('requires you to create an account')) {
      return this.resolveTranslatedMessage('fulldisplay.constants.lg_display_require_register', false);
    }
    if (description.includes('may not under any circumstances download')) {
      return this.resolveTranslatedMessage('fulldisplay.constants.lg_display_may_not_download', false);
    }
    if (description.includes('British Newspaper Archive content')) {
      return this.resolveTranslatedMessage('fulldisplay.constants.lg_display_british_newspapers', false);
    }
    if (description.includes('Downtime')) {
      return of({ text: description, isRed: true });
    }

    return of(null);
  }

  private resolveTranslatedMessage(key: string, isRed: boolean): Observable<ResolvedRecordMessage> {
    return this.translate.get(key).pipe(
      take(1),
      map((text: string) => ({ text, isRed })),
      catchError(() => of({ text: key, isRed }))
    );
  }

  private renderMessageInSearchItem(itemCard: HTMLElement, docId: string, message: ResolvedRecordMessage | null): void {
    const existing = itemCard.querySelector<HTMLElement>('.solo-record-message[data-solo-context="search"]');
    if (!message) {
      existing?.remove();
      return;
    }

    const anchor = itemCard.querySelector<HTMLElement>('nde-record-main-details, nde-record-summary, nde-record-availability');
    if (!anchor) {
      return;
    }

    const messageEl = existing || document.createElement('div');
    messageEl.className = `solo-record-message solo-record-message-search${message.isRed ? ' red-message' : ''}`;
    messageEl.dataset['soloContext'] = 'search';
    messageEl.dataset['docid'] = docId;
    messageEl.innerHTML = message.text;

    if (!existing) {
      anchor.insertAdjacentElement('afterend', messageEl);
    }
  }

  private renderMessageInFullDisplay(message: ResolvedRecordMessage | null, availabilityEl: HTMLElement): void {
    const existing = document.querySelector<HTMLElement>('.solo-record-message[data-solo-context="detail"]');
    if (!message) {
      existing?.remove();
      return;
    }

    const targetEl = document.querySelector<HTMLElement>('.record-availability-and-exhibition-links') || availabilityEl;
    const messageEl = existing || document.createElement('div');
    messageEl.className = `solo-record-message${message.isRed ? ' red-message' : ''}`;
    messageEl.dataset['soloContext'] = 'detail';
    messageEl.innerHTML = message.text;

    if (!existing) {
      targetEl.parentNode?.insertBefore(messageEl, targetEl);
    }
  }

  private removeContextMessage(context: string): void {
    document.querySelectorAll<HTMLElement>(`.solo-record-message[data-solo-context="${context}"]`).forEach((el) => el.remove());
  }

  private removeAllMessageElements(): void {
    document.querySelectorAll<HTMLElement>('.solo-record-message[data-solo-context]').forEach((el) => el.remove());
  }

  private getDocIdFromUrl(): string | null {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('docid');
    } catch {
      return null;
    }
  }

  private extractDocIdFromSearchItem(itemCard: HTMLElement): string | null {
    const fullDisplayLink = itemCard.querySelector<HTMLAnchorElement>('a[href*="/nde/fulldisplay"]');
    if (fullDisplayLink?.href) {
      try {
        const linkUrl = new URL(fullDisplayLink.href, window.location.origin);
        const linkDocId = linkUrl.searchParams.get('docid');
        if (linkDocId) {
          return linkDocId;
        }
      } catch {
        // Continue to fallback extraction.
      }
    }

    const pnxUrlElement = itemCard.querySelector<HTMLElement>('.urlToXmlPnx');
    const pnxUrl = pnxUrlElement?.getAttribute('data-url') || pnxUrlElement?.getAttribute('title') || '';
    const docIdMatch = pnxUrl.match(/\/xml\/[A-Z]\/([^?]+)/i);
    return docIdMatch ? decodeURIComponent(docIdMatch[1]) : null;
  }
}
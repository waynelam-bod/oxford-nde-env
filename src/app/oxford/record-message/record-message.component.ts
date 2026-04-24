import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { RecordType, RecordTypeService } from '../../services/record-type.service';

@Component({
  selector: 'solo-record-message',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styles: [':host { display: none; }']
})
export class RecordMessageComponent implements OnInit, OnDestroy {
  private readonly recordTypeService = inject(RecordTypeService);
  private readonly translate = inject(TranslateService);
  private pollInterval: any = null;
  private lastAvailabilityFound = false;

  ngOnInit(): void {
    console.log('[RecordMessageComponent] ngOnInit');
    // Poll every 500ms - lightweight check
    this.pollInterval = setInterval(() => this.checkForAvailability(), 500);
    // Check immediately
    this.checkForAvailability();
  }

  ngOnDestroy(): void {
    console.log('[RecordMessageComponent] ngOnDestroy');
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.removeMessageElement();
  }

  private checkForAvailability(): void {
    const availabilityEl = document.querySelector('nde-record-availability');
    console.log('[RecordMessageComponent] checkForAvailability', { availabilityEl });
    if (!availabilityEl) {
      if (this.lastAvailabilityFound) {
        this.removeMessageElement();
        this.lastAvailabilityFound = false;
      }
      return;
    }

    // Element exists - check if we already have our message
    const existingMsg = document.getElementById('solo-record-message');
    if (existingMsg && this.lastAvailabilityFound) {
      console.log('[RecordMessageComponent] Message already processed');
      return; // Already processed
    }

    this.lastAvailabilityFound = true;
    this.processAvailability(availabilityEl);
  }

  private processAvailability(availabilityEl: Element): void {
    // TODO: Replace 'docId' with the actual record ID if available
    const docId = null; // Set this to the correct value if you have it
    console.log('[RecordMessageComponent] processAvailability', { docId, availabilityEl });
    this.recordTypeService.getRecordTypeById(docId).subscribe(result => {
      console.log('[RecordMessageComponent] getRecordTypeById result', result);
      if (!result || !result.recordType) {
        this.removeMessageElement();
        return;
      }
      this.handleRecordType(result.recordType, result.pnx, availabilityEl);
    });
  }

  private handleRecordType(recordType: RecordType, pnx: any, availabilityEl: Element): void {
    switch (recordType) {
      case 'LIBGUIDES':
        this.handleLibguides(pnx, availabilityEl);
        break;
      case 'ELDOAI':
      case 'ELDBOOKS':
        this.injectMessage('fulldisplay.constants.eld_legal_deposit_reg', false, availabilityEl);
        break;
      case 'ELDOPENACCESS':
        this.injectMessage('fulldisplay.constants.eld_legal_deposit_oa_delivery', false, availabilityEl);
        break;
      case 'ELDMAP':
        this.injectMessage('fulldisplay.constants.eld_legal_deposit_map', false, availabilityEl);
        break;
    }
  }

  private handleLibguides(pnx: any, availabilityEl: Element): void {
    const description = pnx?.display?.description?.[0] || '';

    if (description.includes('within the United Kingdom')) {
      this.injectMessage('fulldisplay.constants.lg_display_uk_restriction', false, availabilityEl);
    } else if (description.includes('Special password required')) {
      this.injectMessage('fulldisplay.constants.lg_display_special_word_required', false, availabilityEl);
    } else if (description.includes('Oxford Single Sign-On (SSO) required')) {
      this.injectMessage('fulldisplay.constants.lg_display_oxf_login', false, availabilityEl);
    } else if (description.includes('requires you to create an account')) {
      this.injectMessage('fulldisplay.constants.lg_display_require_register', false, availabilityEl);
    } else if (description.includes('may not under any circumstances download')) {
      this.injectMessage('fulldisplay.constants.lg_display_may_not_download', false, availabilityEl);
    } else if (description.includes('British Newspaper Archive content')) {
      this.injectMessage('fulldisplay.constants.lg_display_british_newspapers', false, availabilityEl);
    } else if (description.includes('Downtime')) {
      this.injectMessageDirect(description, true, availabilityEl);
    } else {
      this.removeMessageElement();
    }
  }

  private injectMessage(key: string, isRed: boolean, availabilityEl: Element): void {
    this.translate.get(key).pipe(take(1)).subscribe({
      next: (translation: string) => this.injectMessageDirect(translation, isRed, availabilityEl),
      error: () => this.injectMessageDirect(key, isRed, availabilityEl)
    });
  }

  private injectMessageDirect(message: string, isRed: boolean, availabilityEl: Element): void {
    let messageEl = document.getElementById('solo-record-message');
    
    if (messageEl) {
      messageEl.className = 'solo-record-message' + (isRed ? ' red-message' : '');
      messageEl.innerHTML = message;
    } else {
      messageEl = document.createElement('div');
      messageEl.id = 'solo-record-message';
      messageEl.className = 'solo-record-message' + (isRed ? ' red-message' : '');
      messageEl.innerHTML = message;
      
      // Insert above .record-availability-and-exhibition-links if found, otherwise above availabilityEl
      const targetEl = document.querySelector('.record-availability-and-exhibition-links') || availabilityEl;
      targetEl.parentNode?.insertBefore(messageEl, targetEl);
    }
  }

  private removeMessageElement(): void {
    document.getElementById('solo-record-message')?.remove();
  }
}

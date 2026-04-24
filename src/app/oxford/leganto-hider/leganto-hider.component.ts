import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RecordTypeService, RecordTypeResult } from '../../services/record-type.service';

@Component({
  selector: 'nde-main-actions-after',
  standalone: true,
  template: '',
  styles: [':host { display: none; }']
})
export class LegantoHiderComponent implements OnInit, OnDestroy {
  private readonly recordTypeService = inject(RecordTypeService);
  private styleElement: HTMLStyleElement | null = null;

  ngOnInit(): void {
    this.checkRecordType();
  }

  ngOnDestroy(): void {
    this.removeStyles();
  }

  private checkRecordType(): void {
    const urlMatch = window.location.href.match(/docid=([^&]+)/);
    const docId = urlMatch ? decodeURIComponent(urlMatch[1]) : null;
    
    this.recordTypeService.getRecordTypeById(docId).subscribe((result: RecordTypeResult | null) => {
      if (result && (result.recordType === 'ELDOAI' || result.recordType === 'ELDBOOKS')) {
        this.injectStyles();
      } else {
        this.removeStyles();
      }
    });
  }

  private injectStyles(): void {
    if (document.getElementById('solo-leganto-hider-styles')) return;
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'solo-leganto-hider-styles';
    this.styleElement.textContent = `
      .cdk-overlay-container [data-mat-icon-name="Reading-list"],
      .cdk-overlay-container [data-mat-icon-name="Reading-list"] ~ * {
        display: none !important;
      }
      .cdk-overlay-container button:has([data-mat-icon-name="Reading-list"]),
      .cdk-overlay-container [mat-menu-item]:has([data-mat-icon-name="Reading-list"]),
      .cdk-overlay-container .mat-mdc-menu-item:has([data-mat-icon-name="Reading-list"]) {
        display: none !important;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  private removeStyles(): void {
    this.styleElement?.remove();
    this.styleElement = null;
    document.getElementById('solo-leganto-hider-styles')?.remove();
  }
}

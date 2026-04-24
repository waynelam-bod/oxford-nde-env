import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Component that styles pickup location dropdown options based on their text content.
 * Appends to nde-request-form-after hook.
 * 
 * - "BORROW FROM:" options are styled green
 * - "READ AT:" options are styled dark orange
 */
@Component({
  selector: 'nde-pickup-location-styler',
  standalone: true,
  imports: [CommonModule],
  template: `<!-- Hidden component - only adds styles via MutationObserver -->`,
  styles: [`
    :host {
      display: none;
    }
  `]
})
export class PickupLocationStylerComponent implements OnInit, OnDestroy {
  private observer: MutationObserver | null = null;
  private styleElement: HTMLStyleElement | null = null;

  ngOnInit(): void {
    this.injectStyles();
    this.startObserving();
  }

  ngOnDestroy(): void {
    this.stopObserving();
    this.removeStyles();
  }

  /**
   * Inject global styles for pickup location options
   */
  private injectStyles(): void {
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'pickup-location-styles';
    this.styleElement.textContent = `
      /* BORROW FROM: - Green styling */
      mat-option.borrow-from-library {
        color: #2e7d32 !important;
      }
      mat-option.borrow-from-library .mdc-list-item__primary-text {
        color: #2e7d32 !important;
      }
      mat-option.borrow-from-library.mat-mdc-option-active,
      mat-option.borrow-from-library:hover {
        color: #1b5e20 !important;
      }
      mat-option.borrow-from-library.mat-mdc-option-active .mdc-list-item__primary-text,
      mat-option.borrow-from-library:hover .mdc-list-item__primary-text {
        color: #1b5e20 !important;
      }

      /* READ AT: - Dark orange styling */
      mat-option.read-at-desk {
        color: #e65100 !important;
      }
      mat-option.read-at-desk .mdc-list-item__primary-text {
        color: #e65100 !important;
      }
      mat-option.read-at-desk.mat-mdc-option-active,
      mat-option.read-at-desk:hover {
        color: #bf360c !important;
      }
      mat-option.read-at-desk.mat-mdc-option-active .mdc-list-item__primary-text,
      mat-option.read-at-desk:hover .mdc-list-item__primary-text {
        color: #bf360c !important;
      }
    `;
    document.head.appendChild(this.styleElement);
  }

  /**
   * Remove injected styles
   */
  private removeStyles(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }

  /**
   * Start observing DOM for dropdown panels
   */
  private startObserving(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          // Check if any autocomplete panel or mat-option was added
          const hasRelevantNodes = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType !== 1) return false;
            const el = node as Element;
            return (
              el.classList?.contains('mat-mdc-autocomplete-panel') ||
              el.tagName === 'MAT-OPTION' ||
              el.querySelector?.('mat-option') ||
              el.querySelector?.('.mat-mdc-autocomplete-panel')
            );
          });
          
          if (hasRelevantNodes) {
            // Small delay to ensure options are rendered
            setTimeout(() => this.styleDropdownOptions(), 10);
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Stop observing DOM
   */
  private stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Apply CSS classes to dropdown options based on their text content
   */
  private styleDropdownOptions(): void {
    const options = document.querySelectorAll('mat-option:not([data-pickup-styled])');
    
    options.forEach(option => {
      option.setAttribute('data-pickup-styled', 'true');
      
      const textSpan = option.querySelector('.mdc-list-item__primary-text');
      const text = textSpan?.textContent || option.textContent || '';
      
      if (text.includes('BORROW FROM:')) {
        option.classList.add('borrow-from-library');
      } else if (text.includes('READ AT:')) {
        option.classList.add('read-at-desk');
      }
    });
  }
}

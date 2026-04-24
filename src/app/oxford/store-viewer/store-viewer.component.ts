import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

/**
 * Testing component that displays the current Redux (NgRx) store state.
 * Useful for debugging and understanding the application state.
 */
@Component({
  selector: 'nde-store-viewer',
  standalone: true,
  imports: [CommonModule, JsonPipe],
  templateUrl: './store-viewer.component.html',
  styleUrl: './store-viewer.component.scss'
})
export class StoreViewerComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private subscription: Subscription | null = null;

  storeState: any = null;
  isExpanded = true;
  lastUpdated: Date | null = null;
  searchTerm = '';
  filteredState: any = null;

  ngOnInit(): void {
    // Subscribe to the entire store state
    this.subscription = this.store.subscribe((state: any) => {
      this.storeState = state;
      this.filteredState = state;
      this.lastUpdated = new Date();
      console.log('=== NgRx Store State ===');
      console.log(state);
      console.log('========================');
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.filterState();
  }

  private filterState(): void {
    if (!this.searchTerm || !this.storeState) {
      this.filteredState = this.storeState;
      return;
    }

    // Filter state keys that match search term
    this.filteredState = this.filterObject(this.storeState, this.searchTerm);
  }

  private filterObject(obj: any, term: string): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return String(obj).toLowerCase().includes(term) ? obj : undefined;
    }

    if (Array.isArray(obj)) {
      const filtered = obj
        .map(item => this.filterObject(item, term))
        .filter(item => item !== undefined);
      return filtered.length > 0 ? filtered : undefined;
    }

    const result: any = {};
    let hasMatch = false;

    for (const key of Object.keys(obj)) {
      if (key.toLowerCase().includes(term)) {
        result[key] = obj[key];
        hasMatch = true;
      } else {
        const filteredValue = this.filterObject(obj[key], term);
        if (filteredValue !== undefined) {
          result[key] = filteredValue;
          hasMatch = true;
        }
      }
    }

    return hasMatch ? result : undefined;
  }

  copyToClipboard(): void {
    const text = JSON.stringify(this.filteredState, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert('Store state copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  getStateKeys(): string[] {
    return this.storeState ? Object.keys(this.storeState) : [];
  }
}

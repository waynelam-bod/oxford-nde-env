import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';

export type RecordType = 'LIBGUIDES' | 'ELDOAI' | 'ELDOPENACCESS' | 'ELDMAP' | 'ELDBOOKS' | null;

@Injectable({
  providedIn: 'root'
})
export class RecordTypeService {
  private readonly store = inject(Store);

  /**
   * Detect record type from PNX data
   */
  detectRecordType(pnx: any): RecordType {
    const originalSourceId = pnx?.control?.originalsourceid?.[0] || '';
    if (originalSourceId.startsWith('oai:libguides.com:az')) {
      return 'LIBGUIDES';
    }

    const rights = (pnx?.display?.rights?.[0] || '').toLowerCase();
    if (!rights.startsWith('legaldeposit') && !rights.startsWith('legal deposit')) {
      return null;
    }

    if (rights.includes('open government licence')) return 'ELDOPENACCESS';
    
    const source = pnx?.display?.source?.[0] || '';
    if (source.startsWith('ELDOAI')) return 'ELDOAI';

    const displayType = pnx?.display?.type || [];
    if (displayType.some((t: string) => t?.toLowerCase().includes('map'))) return 'ELDMAP';

    // Fallback: if rights starts with legaldeposit but no other ELD type matched
    return 'ELDBOOKS';
  }

  /**
   * Get current record from store and detect its type
   */
  getCurrentRecordType(): Observable<{ recordType: RecordType; pnx: any } | null> {
    return this.store.pipe(
      take(1),
      map((state: any) => {
        const search = state?.Search;
        if (!search?.ids || search.ids.length !== 1) {
          return null;
        }

        const id = search.ids[0];
        const record = search.entities?.[id];
        if (!record?.pnx) {
          return null;
        }

        const recordType = this.detectRecordType(record.pnx);
        return { recordType, pnx: record.pnx };
      })
    );
  }

  /**
   * Check if record is a LibGuides record
   */
  isLibGuides(pnx: any): boolean {
    return this.detectRecordType(pnx) === 'LIBGUIDES';
  }

  /**
   * Check if record is any ELD (Electronic Legal Deposit) type
   */
  isELD(pnx: any): boolean {
    const type = this.detectRecordType(pnx);
    return type === 'ELDOAI' || type === 'ELDOPENACCESS' || type === 'ELDMAP' || type === 'ELDBOOKS';
  }
}

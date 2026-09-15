import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

export type RecordType = 'LIBGUIDES' | 'ELDOAI' | 'ELDOPENACCESS' | 'ELDMAP' | 'ELDBOOKS' | null;

@Injectable({
  providedIn: 'root'
})
export class RecordTypeService {
  private readonly store = inject(Store);

  /**
   * Get a record by docid from store and detect its type.
   */
  getRecordTypeById(docId: string | null): Observable<{ recordType: RecordType; pnx: any } | null> {
    return this.store.pipe(
      map((state: any) => {
        const search = state?.Search;
        const entities = search?.entities;
        if (!entities || Object.keys(entities).length === 0) {
          return undefined;
        }

        const resolvedDocId = docId || (search?.ids?.length === 1 ? search.ids[0] : null);
        if (!resolvedDocId) {
          return null;
        }

        const record = this.findRecordByDocId(entities, resolvedDocId);
        if (!record?.pnx) {
          return null;
        }

        return {
          recordType: this.detectRecordType(record.pnx),
          pnx: record.pnx
        };
      }),
      filter((result): result is { recordType: RecordType; pnx: any } | null => result !== undefined),
      take(1)
    );
  }

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

  private findRecordByDocId(entities: Record<string, any>, docId: string): any | null {
    if (entities[docId]) {
      return entities[docId];
    }

    const cleanDocId = docId.replace(/^alma/i, '');

    for (const key of Object.keys(entities)) {
      const entity = entities[key];
      const pnxRecordId = entity?.pnx?.control?.recordid?.[0] || entity?.pnx?.search?.recordid?.[0];
      if (
        pnxRecordId === docId ||
        key === docId ||
        (cleanDocId && (key.endsWith(cleanDocId) || pnxRecordId?.endsWith(cleanDocId)))
      ) {
        return entity;
      }
    }

    return null;
  }
}

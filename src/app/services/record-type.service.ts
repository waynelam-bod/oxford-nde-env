import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

export type RecordType = 'LIBGUIDES' | 'ELDOAI' | 'ELDOPENACCESS' | 'ELDMAP' | 'ELDBOOKS' | null;

export interface RecordTypeResult {
  recordType: RecordType;
  pnx: any;
  recordId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecordTypeService {
  private readonly store = inject(Store);
  constructor() {
    console.log('[RecordTypeService] Constructor called', { store: this.store });
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
   * Get record type by specific ID (for full display when coming from search results)
   */
  getRecordTypeById(docId: string | null): Observable<RecordTypeResult | null> {
    return this.store.pipe(
      take(1),
      map((state: any) => {
        const search = state?.Search;
        if (!search?.entities) {
          return null;
        }

        // If docId provided, try to find that specific record
        if (docId) {
          // Try direct lookup first
          let record = search.entities[docId];
          
          // If not found, search through all entities for matching recordid
          if (!record) {
            for (const id of (search.ids || [])) {
              const entity = search.entities[id];
              const entityRecordId = entity?.pnx?.control?.recordid?.[0];
              if (entityRecordId === docId || id === docId) {
                record = entity;
                break;
              }
            }
          }

          if (record?.pnx) {
            const recordType = this.detectRecordType(record.pnx);
            const recordId = record.pnx?.control?.recordid?.[0] || docId;
            return { recordType, pnx: record.pnx, recordId };
          }
        }

        // Fallback: if only one record in store, use that
        if (search.ids?.length === 1) {
          const id = search.ids[0];
          const record = search.entities[id];
          if (record?.pnx) {
            const recordType = this.detectRecordType(record.pnx);
            const recordId = record.pnx?.control?.recordid?.[0] || id;
            return { recordType, pnx: record.pnx, recordId };
          }
        }

        return null;
      })
    );
  }

  /**
   * Get all records from store IN ORDER with their types (for search results)
   * Returns null for records without a special type, preserving indices
   */
  getAllRecordTypesInOrder(): Observable<(RecordTypeResult | null)[]> {
    return this.store.pipe(
      take(1),
      map((state: any) => {
        const search = state?.Search;
        if (!search?.ids || search.ids.length === 0) {
          return [];
        }

        const results: (RecordTypeResult | null)[] = [];
        
        for (const id of search.ids) {
          const record = search.entities?.[id];
          if (!record?.pnx) {
            results.push(null);
            continue;
          }

          const recordType = this.detectRecordType(record.pnx);
          if (recordType) {
            const recordId = record.pnx?.control?.recordid?.[0] || id;
            results.push({ recordType, pnx: record.pnx, recordId });
          } else {
            results.push(null);
          }
        }

        return results;
      })
    );
  }
}

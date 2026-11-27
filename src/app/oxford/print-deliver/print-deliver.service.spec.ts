import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, map } from 'rxjs';
import { NavigationEnd, NavigationStart } from '@angular/router';
import { SHELL_ROUTER } from '../../injection-tokens';
import { PrintDeliverService, printDeliverUpdates } from './print-deliver.service';

describe('Print & Deliver', () => {
  const destination = 'https://print-and-deliver.bodleian.ox.ac.uk/?source=solo';
  let input: any;
  const services = (entity: any) => entity.delivery.electronicServices;
  beforeEach(() => {
    input = {
      selectedId: 'alma1', isLoggedIn: true, jwt: 'test.jwt',
      records: { alma1: { pnx: {
        control: { sourcerecordid: ['1'] },
        display: { rights: ['Legal Deposit; restricted'], identifier: ['VDC: http://eld.bodleian.ox.ac.uk/item'],
          title: ['A & B? #1'], creator: ['Author & Co.$$Qauthority'] }
      } } },
      deliveries: { alma1: { recordId: 'alma1', delivery: { other: 'preserve', electronicServices: [
        { packageName: 'Another service', serviceUrl: 'https://example.org/' },
        { packageName: 'Electronic Legal Deposit', serviceUrl: 'http://eld.bodleian.ox.ac.uk/item?a=1&b=2' },
        { packageName: 'Last service', serviceUrl: 'https://example.org/last' }
      ] } } }
    };
  });

  it('adds the native service immediately after ELD with encoded selected-record metadata', () => {
    const before = JSON.stringify(input);
    const [update] = printDeliverUpdates(input, destination);
    expect(services(update).map((s: any) => s.packageName)).toEqual([
      'Another service', 'Electronic Legal Deposit', 'Print & Deliver', 'Last service'
    ]);
    const service = services(update)[2];
    const url = new URL(service.serviceUrl);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      source: 'solo', mms_id: '1', title: 'A & B? #1', author: 'Author & Co.',
      link: 'http://eld.bodleian.ox.ac.uk/item?a=1&b=2', jwt: 'test.jwt'
    });
    expect(service.hasAccess).toBeFalse();
    expect(service.displayInEmbedViewer).toBeTrue();
    expect(update.delivery?.['other']).toBe('preserve');
    expect(JSON.stringify(input)).toBe(before);
  });

  it('requires both rights and identifier, or the exact eld_article type', () => {
    const display = input.records.alma1.pnx.display;
    display.identifier = ['other'];
    expect(printDeliverUpdates(input, destination)).toEqual([]);
    display.type = ['eld_article'];
    display.rights = [];
    expect(printDeliverUpdates(input, destination).length).toBe(1);
    display.type = ['article'];
    expect(printDeliverUpdates(input, destination)).toEqual([]);
    display.identifier = ['eld.bodleian.ox.ac.uk'];
    display.rights = ['Not Legal Deposit'];
    expect(printDeliverUpdates(input, destination)).toEqual([]);
  });

  it('does not use a guest JWT, missing metadata, missing ELD service, or untranslated destination', () => {
    input.isLoggedIn = false;
    expect(printDeliverUpdates(input, destination)).toEqual([]);
    input.isLoggedIn = true;
    for (const badUrl of [undefined, '', 'fulldisplay.constants.pnd_url', 'javascript:alert(1)']) {
      expect(printDeliverUpdates(input, badUrl)).toEqual([]);
    }
    input.jwt = '';
    expect(printDeliverUpdates(input, destination)).toEqual([]);
    input.jwt = 'test.jwt';
    input.records.alma1.pnx.control = {};
    expect(printDeliverUpdates(input, destination)).toEqual([]);
    input.records.alma1.pnx.control = { sourcerecordid: '1' };
    services(input.deliveries.alma1).splice(1, 1);
    expect(printDeliverUpdates(input, destination)).toEqual([]);
  });

  it('is idempotent, removes duplicates and cached services, and refreshes JWT and metadata', () => {
    const [updated] = printDeliverUpdates(input, destination);
    input.deliveries.alma1 = updated;
    expect(printDeliverUpdates(input, destination)).toEqual([]);
    services(updated).push(services(updated)[2]);
    expect(services(printDeliverUpdates(input, destination)[0]).filter((s: any) => s.oxfordPrintAndDeliver).length).toBe(1);
    services(updated).pop();
    input.jwt = 'refreshed.jwt';
    input.records.alma1.pnx.display.title = 'New title';
    delete input.records.alma1.pnx.display.creator;
    const url = new URL(services(printDeliverUpdates(input, destination)[0])[2].serviceUrl);
    expect(url.searchParams.get('jwt')).toBe('refreshed.jwt');
    expect(url.searchParams.get('title')).toBe('New title');
    expect(url.searchParams.get('author')).toBe('');
    for (const change of [{ selectedId: 'alma2' }, { selectedId: undefined }, { isLoggedIn: false }, { jwt: '' }]) {
      const [cleaned] = printDeliverUpdates({ ...input, ...change }, destination);
      expect(services(cleaned).some((s: any) => s.oxfordPrintAndDeliver)).toBeFalse();
    }
    expect(services(printDeliverUpdates(input, destination, false)[0]).some((s: any) => s.oxfordPrintAndDeliver)).toBeFalse();
  });

  it('moves the service between cached ELD records without retaining the previous record URL', () => {
    input.deliveries.alma1 = printDeliverUpdates(input, destination)[0];
    input.records.alma2 = { pnx: {
      control: { sourcerecordid: ['2'] },
      display: { type: ['eld_article'], title: ['Second record'] }
    } };
    input.deliveries.alma2 = { recordId: 'alma2', delivery: { electronicServices: [
      { packageName: 'Electronic Legal Deposit', serviceUrl: 'https://eld.bodleian.ox.ac.uk/second' }
    ] } };
    input.selectedId = 'alma2';
    const updates = printDeliverUpdates(input, destination);
    expect(updates.length).toBe(2);
    for (const update of updates) input.deliveries[update.recordId] = update;
    expect(services(input.deliveries.alma1).some((s: any) => s.oxfordPrintAndDeliver)).toBeFalse();
    const url = new URL(services(input.deliveries.alma2)[1].serviceUrl);
    expect(url.searchParams.get('mms_id')).toBe('2');
    expect(url.searchParams.get('title')).toBe('Second record');
    expect(url.searchParams.get('link')).toBe('https://eld.bodleian.ox.ac.uk/second');
    expect(printDeliverUpdates(input, destination)).toEqual([]);
  });

  it('watches delayed delivery and translations, dispatches immutably, and stops on destruction', fakeAsync(() => {
    const state = new BehaviorSubject<any>({});
    const translation = new BehaviorSubject<unknown>('fulldisplay.constants.pnd_url');
    const dispatch = jasmine.createSpy('dispatch');
    const events = new BehaviorSubject<any>(new NavigationEnd(1, '/nde/fulldisplay', '/nde/fulldisplay'));
    TestBed.configureTestingModule({ providers: [
      { provide: SHELL_ROUTER, useValue: { events, url: '/nde/fulldisplay' } },
      { provide: Store, useValue: { select: (selector: any) => state.pipe(map(selector)), dispatch } },
      { provide: TranslateService, useValue: { stream: () => translation } }
    ] });
    const service = TestBed.inject(PrintDeliverService);
    service.init();
    service.init();
    state.next({ 'full-display': { selectedRecordId: input.selectedId }, Search: { entities: input.records },
      Delivery: { entities: input.deliveries }, user: { isLoggedIn: true, jwt: 'test.jwt' } });
    tick();
    expect(dispatch).not.toHaveBeenCalled();
    translation.next(destination);
    tick();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.calls.mostRecent().args[0].type).toBe('[Merge-Delivery] Done merge physical Service links into delivery');
    const updated = dispatch.calls.mostRecent().args[0].delivery;
    state.next({ 'full-display': { selectedRecordId: input.selectedId }, Search: { entities: input.records },
      Delivery: { entities: { alma1: updated } }, user: { isLoggedIn: true, jwt: 'test.jwt' } });
    tick();
    expect(dispatch).toHaveBeenCalledTimes(1);
    events.next(new NavigationStart(2, '/nde/search'));
    tick();
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(services(dispatch.calls.mostRecent().args[0].delivery).some((s: any) => s.oxfordPrintAndDeliver)).toBeFalse();
    service.ngOnDestroy();
    translation.next(destination + '&lang=en');
    tick();
    expect(dispatch).toHaveBeenCalledTimes(2);
  }));
});

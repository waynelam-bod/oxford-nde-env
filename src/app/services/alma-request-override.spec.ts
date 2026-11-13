import { applyAlmaRequestOverride, pickupLocationBlacklist, setPickupLocationLabelRulesFromTranslation } from './alma-request-override';
import { NetworkInterceptorService } from './network-interceptor.service';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('AlmaRequest pickup location labels', () => {
  afterEach(() => {
    setPickupLocationLabelRulesFromTranslation({});
    pickupLocationBlacklist.splice(0);
  });

  it('applies configured labels and removals without duplicating prefixes or suffixes', () => {
    setPickupLocationLabelRulesFromTranslation(JSON.stringify({
      labels: {
        '112219100007026$$LIBRARY': { append: ' Upper Reading room' },
        '16897678790007026$$LIBRARY': { append: ' Level 1' },
        '5755161760007026$$CIRCULATION_DESK': { replace: 'Social Science Library' },
      },
      remove_text: [' Stack Requests'],
    }));
    const locations = [
      { key: '112219100007026$$LIBRARY', value: 'Bodleian Library' },
      { key: '16897678790007026$$LIBRARY', value: 'Borrow From: Weston Library' },
      { key: '5755161760007026$$CIRCULATION_DESK', value: 'Read At: Old name' },
      { key: 'other$$CIRCULATION_DESK', value: 'Example Stack Requests' },
    ];
    const response = { 'services-arr': { services: [{ 'groups-list-map': [{ pickupLocation: locations }] }] } };
    applyAlmaRequestOverride(response);
    applyAlmaRequestOverride(response);
    expect(response['services-arr'].services[0]['groups-list-map'][0].pickupLocation.map(location => location.value)).toEqual([
      'Borrow From: Bodleian Library Upper Reading room',
      'Borrow From: Weston Library Level 1',
      'Read At: Social Science Library',
      'Read At: Example',
    ]);
  });

  it('accepts double-encoded JSON and ignores an unavailable translation', () => {
    setPickupLocationLabelRulesFromTranslation(JSON.stringify(JSON.stringify({ remove_text: [' Stack Requests'] })));
    setPickupLocationLabelRulesFromTranslation('fulldisplay.constants.request_label_rules');
    const response = { 'services-arr': { services: [{ 'groups-list-map': [{ pickupLocation: [
      { key: 'other$$LIBRARY', value: 'Example Stack Requests' },
    ] }] }] } };
    applyAlmaRequestOverride(response);
    expect(response['services-arr'].services[0]['groups-list-map'][0].pickupLocation[0].value).toBe('Borrow From: Example');
  });

  it('uses configurable suffix prefixes and the most specific key-prefix override', () => {
    setPickupLocationLabelRulesFromTranslation({
      prefixes: { CIRCULATION_DESK: 'Reading: ', LIBRARY: 'Borrowing: ' },
      key_prefix_overrides: { '168': 'General: ', '16897678790007026': 'Read At: ' },
      labels: { '16897678790007026$$LIBRARY': { append: ' Level 1' } },
    });
    const response = { 'services-arr': { services: [{ 'groups-list-map': [{ pickupLocation: [
      { key: '16897678790007026$$LIBRARY', value: 'Borrow From: Weston Library' },
      { key: '16897678790007026$$CIRCULATION_DESK', value: 'Read At: Weston Desk' },
      { key: 'other$$CIRCULATION_DESK', value: 'Read At: Another Desk' },
      { key: 'other$$LIBRARY', value: 'Borrow From: Another Library' },
      { key: '168other$$LIBRARY', value: 'Borrow From: General Library' },
      { key: 'unmatched', value: 'Read At: A title' },
    ] }] }] } };
    applyAlmaRequestOverride(response);
    applyAlmaRequestOverride(response);
    expect(response['services-arr'].services[0]['groups-list-map'][0].pickupLocation.map(location => location.value)).toEqual([
      'Read At: Weston Library Level 1',
      'Read At: Weston Desk',
      'Reading: Another Desk',
      'Borrowing: Another Library',
      'General: General Library',
      'Read At: A title',
    ]);
  });

  it('loads the label rules through the interceptor on initialization', () => {
    const get = jasmine.createSpy('get').and.callFake((key: string) => of(
      key === 'fulldisplay.constants.request_label_rules'
        ? { labels: { '123$$LIBRARY': { append: ' Level 1' } } }
        : key,
    ));
    const interceptor = new NetworkInterceptorService({ get } as unknown as TranslateService);
    spyOn<any>(interceptor, 'patchFetch');
    spyOn<any>(interceptor, 'patchXhr');
    interceptor.init();
    const response = { 'services-arr': { services: [{ 'groups-list-map': [{ pickupLocation: [
      { key: '123$$LIBRARY', value: 'Weston Library' },
    ] }] }] } };
    applyAlmaRequestOverride(response);
    expect(get).toHaveBeenCalledWith('fulldisplay.constants.request_label_rules');
    expect(response['services-arr'].services[0]['groups-list-map'][0].pickupLocation[0].value).toBe('Borrow From: Weston Library Level 1');
  });
});
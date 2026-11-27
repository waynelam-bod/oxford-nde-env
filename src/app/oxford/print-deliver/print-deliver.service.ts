import { Inject, Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Store, createSelector } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, auditTime, combineLatest, filter, map, startWith } from 'rxjs';
import { SHELL_ROUTER } from '../../injection-tokens';

const TRANSLATION_KEY = 'fulldisplay.constants.pnd_url';
// Host action 71996.uu; Delivery reducer calls updateOne({id: delivery.recordId, changes: delivery}).
const UPDATE_DELIVERY = '[Merge-Delivery] Done merge physical Service links into delivery';
const MARKER = 'oxfordPrintAndDeliver';

interface ElectronicService {
  packageName?: string;
  serviceUrl?: string;
  [key: string]: unknown;
}

interface DeliveryEntity {
  recordId: string;
  delivery?: { electronicServices?: ElectronicService[]; [key: string]: unknown };
}

const values = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((item): item is string => typeof item === 'string');
const first = (value: unknown): string => values(value)[0] ?? '';

const selectInputs = createSelector(
  (state: any) => state?.['full-display']?.selectedRecordId,
  (state: any) => state?.Search?.entities,
  (state: any) => state?.Delivery?.entities,
  (state: any) => state?.user?.isLoggedIn,
  (state: any) => state?.user?.jwt,
  (selectedId, records, deliveries, isLoggedIn, jwt) => ({ selectedId, records, deliveries, isLoggedIn, jwt })
);

/** Build immutable updates, including removal from previously selected/cached records. */
export function printDeliverUpdates(input: ReturnType<typeof selectInputs>, translatedUrl: unknown,
                                    inFullDisplay = true): DeliveryEntity[] {
  const { selectedId, records, deliveries, isLoggedIn, jwt } = input;
  const pnx = records?.[selectedId]?.pnx;
  const display = pnx?.display;
  const isEld = values(display?.type).includes('eld_article') || (
    values(display?.rights).some(right => right.startsWith('Legal Deposit')) &&
    values(display?.identifier).some(identifier => identifier.includes('eld.bodleian.ox.ac.uk'))
  );
  const mmsId = first(pnx?.control?.sourcerecordid);
  let destination: URL | undefined;
  if (typeof translatedUrl === 'string' && translatedUrl !== TRANSLATION_KEY) {
    try {
      const url = new URL(translatedUrl);
      if (url.protocol === 'https:' || url.protocol === 'http:') destination = url;
    } catch { /* Missing or invalid configuration: remove any previous custom service. */ }
  }

  const updates: DeliveryEntity[] = [];
  for (const [id, entity] of Object.entries(deliveries ?? {}) as [string, DeliveryEntity][]) {
    const original = entity?.delivery?.electronicServices;
    if (!Array.isArray(original)) continue;
    const services = original.filter(service => !service[MARKER]);
    const eldIndex = services.findIndex(service =>
      service.packageName === 'Electronic Legal Deposit' || service.serviceUrl?.includes('eld.bodleian.ox.ac.uk'));
    if (inFullDisplay && id === selectedId && isEld && isLoggedIn === true && typeof jwt === 'string' && jwt &&
        mmsId && destination && eldIndex >= 0 && services[eldIndex].serviceUrl) {
      const url = new URL(destination);
      url.searchParams.set('mms_id', mmsId);
      url.searchParams.set('title', first(display?.title));
      url.searchParams.set('author', first(display?.creator).split('$$Q')[0]);
      url.searchParams.set('link', services[eldIndex].serviceUrl!);
      url.searchParams.set('jwt', jwt);
      services.splice(eldIndex + 1, 0, {
        [MARKER]: true,
        adaptorid: 'ALMA_01',
        serviceUrl: url.toString(),
        licenceExist: 'false',
        packageName: 'Print & Deliver',
        availiability: '',
        publicNote: 'To order and receive printed copies of electronic Legal Deposit (eLD) content to your postal address',
        hasAccess: false,
        serviceType: 'ELECTRONIC',
        registrationRequired: false,
        numberOfFiles: 0,
        cdlItemAvailable: false,
        cdl: false,
        ndeCdlSessionActive: false,
        fromNetwork: false,
        displayInEmbedViewer: true,
        collapse: false,
        displayExternalViewer: false,
        shouldDisplayInDigitalViewer: false
      });
    }
    // Unchanged inputs and our own dispatch must not cause another store update.
    if (JSON.stringify(original) !== JSON.stringify(services)) {
      updates.push({ recordId: entity.recordId, delivery: { ...entity.delivery, electronicServices: services } });
    }
  }
  return updates;
}

@Injectable({ providedIn: 'root' })
export class PrintDeliverService implements OnDestroy {
  private subscription?: Subscription;

  constructor(private readonly store: Store, private readonly translate: TranslateService,
              @Inject(SHELL_ROUTER) private readonly router: Router) {}

  init(): void {
    if (this.subscription) return;
    this.subscription = combineLatest([
      this.store.select(selectInputs), this.translate.stream(TRANSLATION_KEY),
      this.router.events.pipe(
        filter(event => event instanceof NavigationStart || event instanceof NavigationEnd),
        map(event => event instanceof NavigationEnd && this.isFullDisplay(event.urlAfterRedirects)),
        startWith(this.isFullDisplay(this.router.url))
      )
    ]).pipe(auditTime(0)).subscribe(([input, url, inFullDisplay]) => {
      for (const delivery of printDeliverUpdates(input, url, inFullDisplay)) {
        this.store.dispatch({ type: UPDATE_DELIVERY, delivery });
      }
    });
  }

  private isFullDisplay(url: string): boolean {
    return /(?:^|\/)fulldisplay(?:[/?#]|$)/.test(url);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }
}

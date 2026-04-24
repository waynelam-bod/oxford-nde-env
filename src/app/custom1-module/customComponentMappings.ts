import { Type } from '@angular/core';
import { LogoComponent } from '../oxford/logo/logo.component';
import { AnnouncementsComponent } from '../oxford/announcements/announcements.component';
import { FooterComponent } from '../oxford/footer/footer.component';
import { HeaderComponent } from '../oxford/header/header.component';
import { LibraryH3lpComponent } from '../oxford/library-h3lp/library-h3lp.component';
import { LibraryH3lpSkipToComponent } from '../oxford/library-h3lp/library-h3lp-skip-to.component';
import { PickupLocationStylerComponent } from '../oxford/pickup-location-styler/pickup-location-styler.component';
import { RecordMessageComponent } from '../oxford/record-message/record-message.component';
import { LegantoHiderComponent } from '../oxford/leganto-hider/leganto-hider.component';

// Define the map
export const selectorComponentMap = new Map<string, Type<unknown>>([
    ['nde-logo', LogoComponent],
    ['custom-announcements-loader', AnnouncementsComponent],
    ['nde-header', HeaderComponent],
    ['nde-footer', FooterComponent],
    ['solo-help', LibraryH3lpComponent],
    ['solo-skip-to-help', LibraryH3lpSkipToComponent],
    ['nde-request-form-after', PickupLocationStylerComponent],
    ['solo-record-message', RecordMessageComponent],
    ['nde-main-actions-after', LegantoHiderComponent]
]);

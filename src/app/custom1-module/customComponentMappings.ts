// Define the map
import { LogoComponent } from '../oxford/logo/logo.component';
import { AnnouncementsComponent } from '../oxford/announcements/announcements.component';
import { FooterComponent } from '../oxford/footer/footer.component';

/**
 * Maps Primo NDE extension points to custom Angular components.
 * Note: `RecordMessageComponent` (<solo-record-message>) and `LibraryH3lpComponent` (<solo-help>)
 * are hosted inside `nde-footer` (FooterComponent) so they are active across all pages.
 * AlmaRequest overrides are applied in `alma-request-override.ts` and do not require a custom component.
 */
export const selectorComponentMap = new Map<string, any>([
	['nde-logo', LogoComponent],
	['custom-announcements-loader', AnnouncementsComponent],
	['nde-footer', FooterComponent]
]);

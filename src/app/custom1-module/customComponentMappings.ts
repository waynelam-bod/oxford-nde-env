// Define the map
import { LogoComponent } from '../oxford/logo/logo.component';
import { AnnouncementsComponent } from '../oxford/announcements/announcements.component';
import { FooterComponent } from '../oxford/footer/footer.component';
import { LibraryH3lpComponent } from '../oxford/library-h3lp/library-h3lp.component';
export const selectorComponentMap = new Map<string, any>([
	['nde-logo', LogoComponent],
	['custom-announcements-loader', AnnouncementsComponent],
	['nde-footer', FooterComponent],
	['nde-footer-after', LibraryH3lpComponent]

]);

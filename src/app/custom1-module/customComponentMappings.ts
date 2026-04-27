// Define the map
import { LogoComponent } from '../oxford/logo/logo.component';
import { AnnouncementsComponent } from '../oxford/announcements/announcements.component';
export const selectorComponentMap = new Map<string, any>([
	['nde-logo', LogoComponent],
	['custom-announcements-loader', AnnouncementsComponent]


]);

import { ChangeDetectionStrategy, Component } from '@angular/core';
import {MatIconModule} from '@angular/material/icon'; 
import { LibraryH3lpComponent } from './library-h3lp/library-h3lp.component';

@Component({
  selector: 'nde-footer',
  standalone: true,
  imports: [MatIconModule, LibraryH3lpComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  openChat(event: Event): boolean {
    event.preventDefault();
    if (typeof window === 'undefined') {
      return false;
    }
    window.open(
      'https://eu.libraryh3lp.com/chat/bodleian-livechat@chat.eu.libraryh3lp.com?identity=Bodleian+Libraries&skin=14009',
      'chat',
      'resizable=1,width=420,height=450'
    );
    return false;
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'solo-skip-to-help',
  standalone: true,
  templateUrl: './library-h3lp-skip-to.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryH3lpSkipToComponent {
  openLiveChat(event: Event): void {
    event.preventDefault();
    if (typeof window === 'undefined') {
      return;
    }
    window.open(
      'https://eu.libraryh3lp.com/chat/bodleian-livechat@chat.eu.libraryh3lp.com?identity=Bodleian+Libraries&skin=14009',
      'chat',
      'resizable=1,width=420,height=450'
    );
  }
}

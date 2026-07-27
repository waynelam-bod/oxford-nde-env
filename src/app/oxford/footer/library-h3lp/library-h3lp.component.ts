import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';

export interface LibraryH3lpConfig {
  url: string;
  prompt: string;
  icon: {
    set: string;
    icon: string;
  };
}

const DEFAULT_CONFIG: LibraryH3lpConfig = {
  url: 'https://eu.libraryh3lp.com/chat/bodleian-livechat@chat.eu.libraryh3lp.com?identity=Bodleian+Libraries&skin=14009',
  prompt: 'Live Chat',
  icon: {
    set: 'primo-ui',
    icon: 'chat'
  }
};

@Component({
  selector: 'solo-help',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './library-h3lp.component.html',
  styleUrl: './library-h3lp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryH3lpComponent implements OnInit {
  @Input() config: LibraryH3lpConfig = DEFAULT_CONFIG;

  showChatWidget = false;
  trustedUrl: SafeResourceUrl | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.config.url);
  }

  toggle(): void {
    this.showChatWidget = !this.showChatWidget;
  }
}

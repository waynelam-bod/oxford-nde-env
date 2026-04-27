import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { envContent } from '../../state/env-content.generated';

const LOGO_BASE_PATH = envContent.instId && envContent.viewId
  ? `custom/${envContent.instId}-${envContent.viewId}/assets/images/`
  : 'assets/images/';

type LogoVariantDefinition = {
  src: string;
  href: string;
  alt?: string;
};

type RenderedLogo = Required<Pick<LogoVariantDefinition, 'src' | 'href'>> & { alt: string };

/* SOLO logo and Oxford logo */
const LOGO_VARIANTS = {
  solo: {
    src: `${LOGO_BASE_PATH}logo-SOLO.svg`,
    href: envContent.ndeHomeUrl,
    alt: 'SOLO logo'
  },
  oxford: {
    src: `${LOGO_BASE_PATH}logo-OXFORD-high.svg`,
    href: 'https://www.bodleian.ox.ac.uk/',
    alt: 'Bodleian Libraries logo'
  }
} satisfies Record<string, LogoVariantDefinition>;

@Component({
  selector: 'custom-nde-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss'
})

export class LogoComponent {
  /* The logos to display, in order. Valid values are the keys of LOGO_VARIANTS. */
  @Input() logos: Array<keyof typeof LOGO_VARIANTS> = ['solo', 'oxford'];
  @Input() alt = 'Bodleian Libraries logo';

  protected get renderedLogos(): RenderedLogo[] {
    return this.logos.reduce<RenderedLogo[]>((acc, key) => {
      const definition = LOGO_VARIANTS[key];
      if (!definition) {
        return acc;
      }

      acc.push({
        src: definition.src,
        href: definition.href,
        alt: definition.alt ?? this.alt
      });

      return acc;
    }, []);
  }
}

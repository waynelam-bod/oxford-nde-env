import { Component, Input, OnChanges, OnInit } from '@angular/core';
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

export class LogoComponent implements OnInit, OnChanges {
  /* The logos to display, in order. Valid values are the keys of LOGO_VARIANTS. */
  @Input() logos: Array<keyof typeof LOGO_VARIANTS> = ['solo', 'oxford'];
  @Input() alt = 'Bodleian Libraries logo';

  // Computed once per input change instead of a template getter, which would otherwise
  // return new object references every change-detection cycle and force *ngFor to
  // destroy/recreate the DOM nodes on every tick.
  protected renderedLogos: RenderedLogo[] = [];

  ngOnInit(): void {
    this.computeRenderedLogos();
  }

  ngOnChanges(): void {
    this.computeRenderedLogos();
  }

  private computeRenderedLogos(): void {
    this.renderedLogos = this.logos.reduce<RenderedLogo[]>((acc, key) => {
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

  protected trackByHref(_index: number, logo: RenderedLogo): string {
    return logo.href;
  }
}

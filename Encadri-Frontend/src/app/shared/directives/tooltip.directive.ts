import { Directive, ElementRef, HostListener, Input, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipDelay: number = 300;

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltipText) return;

    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.tooltipDelay);
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    this.hide();
  }

  private show() {
    if (this.tooltipElement) return;

    // Create tooltip element
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'app-tooltip');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);

    // Set tooltip text
    const text = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltipElement, text);

    // Append to body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Position the tooltip
    this.positionTooltip();

    // Fade in
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.addClass(this.tooltipElement, 'show');
      }
    }, 10);
  }

  private hide() {
    if (this.tooltipElement) {
      this.renderer.removeClass(this.tooltipElement, 'show');
      setTimeout(() => {
        if (this.tooltipElement) {
          this.renderer.removeChild(document.body, this.tooltipElement);
          this.tooltipElement = null;
        }
      }, 200);
    }
  }

  private positionTooltip() {
    if (!this.tooltipElement) return;

    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltipElement.getBoundingClientRect();
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostPos.top - tooltipPos.height - 10;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'bottom':
        top = hostPos.bottom + 10;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'left':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.left - tooltipPos.width - 10;
        break;
      case 'right':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.right + 10;
        break;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top + scrollPos}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left + scrollLeft}px`);
  }

  ngOnDestroy() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    this.hide();
  }
}

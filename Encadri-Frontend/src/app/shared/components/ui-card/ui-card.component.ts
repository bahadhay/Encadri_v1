import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  template: `
    <div [class]="getCardClasses()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card {
      border-radius: var(--radius-lg);
      padding: var(--spacing-6);
      border: 1px solid var(--slate-200);
      background-color: white;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
    }

    .card-hover:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--slate-300);
    }

    .card-compact {
      padding: var(--spacing-4);
    }

    .card-elevated {
      box-shadow: var(--shadow);
    }
  `]
})
export class UiCardComponent {
  @Input() hover: boolean = false;
  @Input() compact: boolean = false;
  @Input() elevated: boolean = false;

  getCardClasses(): string {
    const classes = ['card'];
    if (this.hover) classes.push('card-hover');
    if (this.compact) classes.push('card-compact');
    if (this.elevated) classes.push('card-elevated');
    return classes.join(' ');
  }
}

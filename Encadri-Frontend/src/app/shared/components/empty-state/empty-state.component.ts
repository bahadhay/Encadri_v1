import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">{{ icon }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description">{{ description }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--spacing-12) var(--spacing-6);
      gap: var(--spacing-3);
    }

    .empty-icon {
      font-size: 4rem;
      line-height: 1;
      opacity: 0.3;
      margin-bottom: var(--spacing-2);
    }

    .empty-title {
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--slate-900);
      margin: 0;
    }

    .empty-description {
      font-size: var(--text-base);
      color: var(--slate-500);
      margin: 0;
      max-width: 400px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = '📭';
  @Input() title: string = 'No items found';
  @Input() description: string = 'There are no items to display at the moment.';
}

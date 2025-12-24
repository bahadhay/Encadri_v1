import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-wrapper" [class.fullscreen]="fullscreen">
      <div [class]="'spinner spinner-' + size"></div>
      <p *ngIf="message" class="loading-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-4);
      padding: var(--spacing-8);
    }

    .loading-wrapper.fullscreen {
      min-height: 50vh;
    }

    .spinner {
      border-radius: 50%;
      border-style: solid;
      border-color: var(--slate-200);
      border-top-color: var(--primary-600);
      animation: spin 0.8s linear infinite;
    }

    .spinner-sm {
      width: 1.5rem;
      height: 1.5rem;
      border-width: 2px;
    }

    .spinner-md {
      width: 2.5rem;
      height: 2.5rem;
      border-width: 3px;
    }

    .spinner-lg {
      width: 4rem;
      height: 4rem;
      border-width: 4px;
    }

    .loading-message {
      color: var(--slate-600);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      margin: 0;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message: string = '';
  @Input() fullscreen: boolean = false;
}

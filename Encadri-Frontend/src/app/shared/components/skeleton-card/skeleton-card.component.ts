import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="skeleton-card">
      <div class="skeleton-header">
        <app-skeleton variant="text" width="80px"></app-skeleton>
        <app-skeleton variant="text" width="60px"></app-skeleton>
      </div>

      <app-skeleton variant="title" width="70%"></app-skeleton>
      <div style="margin-top: 0.5rem;">
        <app-skeleton variant="text" width="100%"></app-skeleton>
        <app-skeleton variant="text" width="90%"></app-skeleton>
      </div>

      <div class="skeleton-meta">
        <app-skeleton variant="text" width="150px"></app-skeleton>
        <div style="margin-top: 0.5rem;">
          <app-skeleton variant="text" width="100px" height="24px"></app-skeleton>
        </div>
      </div>

      <div class="skeleton-progress">
        <app-skeleton variant="rectangle" width="100%" height="8px"></app-skeleton>
      </div>

      <div class="skeleton-actions">
        <app-skeleton variant="button" width="80px"></app-skeleton>
        <app-skeleton variant="button" width="120px"></app-skeleton>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-header {
      display: flex;
      gap: 0.5rem;
    }

    .skeleton-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-progress {
      margin: 0.5rem 0;
    }

    .skeleton-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
  `]
})
export class SkeletonCardComponent {}

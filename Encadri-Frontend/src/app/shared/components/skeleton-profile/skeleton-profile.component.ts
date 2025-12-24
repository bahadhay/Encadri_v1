import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-skeleton-profile',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="skeleton-profile">
      <div class="skeleton-profile-header">
        <app-skeleton variant="circle" width="80px" height="80px"></app-skeleton>
        <div class="profile-info">
          <app-skeleton variant="title" width="200px"></app-skeleton>
          <app-skeleton variant="text" width="150px"></app-skeleton>
        </div>
      </div>

      <div class="skeleton-profile-stats">
        <div class="stat-item">
          <app-skeleton variant="text" width="60px" height="32px"></app-skeleton>
          <app-skeleton variant="text" width="80px"></app-skeleton>
        </div>
        <div class="stat-item">
          <app-skeleton variant="text" width="60px" height="32px"></app-skeleton>
          <app-skeleton variant="text" width="80px"></app-skeleton>
        </div>
        <div class="stat-item">
          <app-skeleton variant="text" width="60px" height="32px"></app-skeleton>
          <app-skeleton variant="text" width="80px"></app-skeleton>
        </div>
      </div>

      <div class="skeleton-profile-details">
        <div class="detail-row">
          <app-skeleton variant="text" width="100px"></app-skeleton>
          <app-skeleton variant="text" width="180px"></app-skeleton>
        </div>
        <div class="detail-row">
          <app-skeleton variant="text" width="100px"></app-skeleton>
          <app-skeleton variant="text" width="180px"></app-skeleton>
        </div>
        <div class="detail-row">
          <app-skeleton variant="text" width="100px"></app-skeleton>
          <app-skeleton variant="text" width="180px"></app-skeleton>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-profile {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid #e5e7eb;
    }

    .skeleton-profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex: 1;
    }

    .skeleton-profile-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }

    .skeleton-profile-details {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 768px) {
      .skeleton-profile {
        padding: 1.5rem;
      }

      .skeleton-profile-header {
        flex-direction: column;
        text-align: center;
      }

      .skeleton-profile-stats {
        grid-template-columns: 1fr;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class SkeletonProfileComponent {}

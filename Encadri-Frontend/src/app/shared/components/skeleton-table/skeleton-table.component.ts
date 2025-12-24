import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="skeleton-table">
      <!-- Desktop Table View -->
      <div class="skeleton-table-desktop">
        <div class="skeleton-table-header">
          <app-skeleton variant="text" width="80px" height="12px"></app-skeleton>
          <app-skeleton variant="text" width="60px" height="12px"></app-skeleton>
          <app-skeleton variant="text" width="100px" height="12px"></app-skeleton>
          <app-skeleton variant="text" width="100px" height="12px"></app-skeleton>
          <app-skeleton variant="text" width="80px" height="12px"></app-skeleton>
        </div>

        <div class="skeleton-table-row" *ngFor="let i of rows">
          <div class="skeleton-file-cell">
            <app-skeleton variant="circle" width="32px" height="32px"></app-skeleton>
            <app-skeleton variant="text" width="180px"></app-skeleton>
          </div>
          <app-skeleton variant="text" width="60px"></app-skeleton>
          <app-skeleton variant="text" width="100px"></app-skeleton>
          <app-skeleton variant="text" width="100px"></app-skeleton>
          <div class="skeleton-actions">
            <app-skeleton variant="circle" width="32px" height="32px"></app-skeleton>
            <app-skeleton variant="circle" width="32px" height="32px"></app-skeleton>
            <app-skeleton variant="circle" width="32px" height="32px"></app-skeleton>
          </div>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="skeleton-table-mobile">
        <div class="skeleton-mobile-row" *ngFor="let i of rows">
          <div class="skeleton-file-info">
            <app-skeleton variant="circle" width="32px" height="32px"></app-skeleton>
            <app-skeleton variant="text" width="150px"></app-skeleton>
          </div>
          <app-skeleton variant="text" width="32px" height="32px"></app-skeleton>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-table {
      width: 100%;
    }

    .skeleton-table-desktop {
      display: block;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .skeleton-table-mobile {
      display: none;
    }

    .skeleton-table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 1.5fr 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .skeleton-table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 1.5fr 1fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f3f4f6;
      align-items: center;
    }

    .skeleton-table-row:last-child {
      border-bottom: none;
    }

    .skeleton-file-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .skeleton-actions {
      display: flex;
      gap: 0.375rem;
      justify-content: flex-end;
    }

    /* Mobile View */
    @media (max-width: 768px) {
      .skeleton-table-desktop {
        display: none;
      }

      .skeleton-table-mobile {
        display: block;
      }

      .skeleton-mobile-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .skeleton-file-info {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex: 1;
      }
    }
  `]
})
export class SkeletonTableComponent {
  @Input() rowCount: number = 5;

  get rows() {
    return Array(this.rowCount).fill(0);
  }
}

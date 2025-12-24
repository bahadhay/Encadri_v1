import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="skeleton-list">
      <div class="skeleton-list-item" *ngFor="let i of items">
        <div class="list-item-left">
          <app-skeleton variant="circle" width="48px" height="48px"></app-skeleton>
          <div class="list-item-content">
            <app-skeleton variant="text" width="180px"></app-skeleton>
            <app-skeleton variant="text" width="120px"></app-skeleton>
          </div>
        </div>
        <div class="list-item-right">
          <app-skeleton variant="text" width="80px"></app-skeleton>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-list {
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .skeleton-list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .skeleton-list-item:last-child {
      border-bottom: none;
    }

    .list-item-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .list-item-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .list-item-right {
      display: flex;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .skeleton-list-item {
        padding: 0.75rem;
      }

      .list-item-left {
        gap: 0.75rem;
      }
    }
  `]
})
export class SkeletonListComponent {
  @Input() itemCount: number = 5;

  get items() {
    return Array(this.itemCount).fill(0);
  }
}

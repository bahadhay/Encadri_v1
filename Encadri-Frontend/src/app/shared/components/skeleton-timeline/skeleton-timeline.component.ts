import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-skeleton-timeline',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="skeleton-timeline">
      <div class="skeleton-timeline-item" *ngFor="let i of items; let last = last">
        <div class="timeline-marker">
          <app-skeleton variant="circle" width="40px" height="40px"></app-skeleton>
        </div>
        <div class="timeline-line" *ngIf="!last"></div>

        <div class="timeline-content">
          <div class="timeline-header">
            <div>
              <app-skeleton variant="title" width="60%"></app-skeleton>
              <div style="margin-top: 0.5rem;">
                <app-skeleton variant="text" width="80px" height="24px"></app-skeleton>
              </div>
            </div>
            <div class="timeline-actions">
              <app-skeleton variant="button" width="80px"></app-skeleton>
              <app-skeleton variant="circle" width="32px" height="32px"></app-skeleton>
            </div>
          </div>

          <div class="timeline-body">
            <app-skeleton variant="text" width="100%"></app-skeleton>
            <app-skeleton variant="text" width="90%"></app-skeleton>
          </div>

          <div class="timeline-meta">
            <app-skeleton variant="text" width="120px"></app-skeleton>
            <app-skeleton variant="text" width="150px"></app-skeleton>
          </div>

          <div class="timeline-subtasks">
            <app-skeleton variant="text" width="100px"></app-skeleton>
            <div style="margin-top: 0.5rem;">
              <app-skeleton variant="rectangle" width="100%" height="6px"></app-skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .skeleton-timeline-item {
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 1rem;
      position: relative;
    }

    .timeline-marker {
      display: flex;
      justify-content: center;
      z-index: 2;
    }

    .timeline-line {
      position: absolute;
      left: 20px;
      top: 40px;
      bottom: -1rem;
      width: 2px;
      background: #e5e7eb;
      z-index: 1;
    }

    .timeline-content {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .timeline-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .timeline-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .timeline-meta {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .timeline-subtasks {
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    @media (max-width: 768px) {
      .timeline-header {
        flex-direction: column;
      }

      .timeline-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .timeline-content {
        padding: 1rem;
      }
    }
  `]
})
export class SkeletonTimelineComponent {
  @Input() itemCount: number = 3;

  get items() {
    return Array(this.itemCount).fill(0);
  }
}

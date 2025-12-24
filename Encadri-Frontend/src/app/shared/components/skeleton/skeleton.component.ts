import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" [ngClass]="variant" [ngStyle]="customStyles">
      <div class="skeleton-shimmer"></div>
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: -100%;
      height: 100%;
      width: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.6) 50%,
        transparent 100%
      );
      animation: shimmer-move 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes shimmer-move {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    /* Variants */
    .skeleton.text {
      height: 1rem;
      width: 100%;
      border-radius: 4px;
    }

    .skeleton.title {
      height: 1.5rem;
      width: 60%;
      border-radius: 4px;
    }

    .skeleton.avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .skeleton.circle {
      border-radius: 50%;
    }

    .skeleton.rectangle {
      border-radius: 8px;
    }

    .skeleton.button {
      height: 2.5rem;
      width: 120px;
      border-radius: 6px;
    }
  `]
})
export class SkeletonComponent {
  @Input() variant: 'text' | 'title' | 'avatar' | 'circle' | 'rectangle' | 'button' = 'text';
  @Input() width?: string;
  @Input() height?: string;

  get customStyles() {
    return {
      width: this.width || undefined,
      height: this.height || undefined
    };
  }
}

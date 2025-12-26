import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      [attr.viewBox]="viewBox"
      [attr.fill]="fill"
      [attr.stroke]="stroke"
      [attr.stroke-width]="strokeWidth"
      [attr.stroke-linecap]="strokeLinecap"
      [attr.stroke-linejoin]="strokeLinejoin"
      class="icon"
      [class]="className">
      <ng-container [ngSwitch]="name">
        <!-- Dashboard -->
        <g *ngSwitchCase="'dashboard'">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
        </g>

        <!-- Projects/Folder -->
        <g *ngSwitchCase="'projects'">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </g>

        <!-- Submissions/File -->
        <g *ngSwitchCase="'submissions'">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </g>

        <!-- Chat/Message -->
        <g *ngSwitchCase="'chat'">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </g>

        <!-- Profile/User -->
        <g *ngSwitchCase="'profile'">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </g>

        <!-- Bell/Notification -->
        <g *ngSwitchCase="'bell'">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </g>

        <!-- Plus -->
        <g *ngSwitchCase="'plus'">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </g>

        <!-- Search -->
        <g *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </g>

        <!-- Calendar -->
        <g *ngSwitchCase="'calendar'">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </g>

        <!-- Clock -->
        <g *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </g>

        <!-- Check -->
        <g *ngSwitchCase="'check'">
          <polyline points="20 6 9 17 4 12"/>
        </g>

        <!-- X/Close -->
        <g *ngSwitchCase="'x'">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </g>

        <!-- Arrow Right -->
        <g *ngSwitchCase="'arrow-right'">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </g>

        <!-- Settings -->
        <g *ngSwitchCase="'settings'">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m5.196-15.196l-4.242 4.242m-5.908 5.908l-4.242 4.242M23 12h-6m-6 0H1m15.196 5.196l-4.242-4.242m-5.908-5.908l-4.242-4.242"/>
        </g>

        <!-- Logout -->
        <g *ngSwitchCase="'logout'">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </g>

        <!-- Menu/Hamburger -->
        <g *ngSwitchCase="'menu'">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </g>

        <!-- ChevronDown -->
        <g *ngSwitchCase="'chevron-down'">
          <polyline points="6 9 12 15 18 9"/>
        </g>

        <!-- ChevronRight -->
        <g *ngSwitchCase="'chevron-right'">
          <polyline points="9 18 15 12 9 6"/>
        </g>

        <!-- Eye -->
        <g *ngSwitchCase="'eye'">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </g>

        <!-- Download -->
        <g *ngSwitchCase="'download'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </g>

        <!-- Upload -->
        <g *ngSwitchCase="'upload'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </g>

        <!-- Trash -->
        <g *ngSwitchCase="'trash'">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </g>

        <!-- Edit -->
        <g *ngSwitchCase="'edit'">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </g>

        <!-- Info -->
        <g *ngSwitchCase="'info'">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </g>

        <!-- Alert Triangle -->
        <g *ngSwitchCase="'alert-triangle'">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </g>

        <!-- Add -->
        <g *ngSwitchCase="'add'">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </g>

        <!-- Schedule -->
        <g *ngSwitchCase="'schedule'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </g>

        <!-- Event -->
        <g *ngSwitchCase="'event'">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </g>

        <!-- Notifications -->
        <g *ngSwitchCase="'notifications'">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </g>

        <!-- History -->
        <g *ngSwitchCase="'history'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
          <path d="M4 12a8 8 0 0 1 8-8V2"/>
        </g>

        <!-- Error -->
        <g *ngSwitchCase="'error'">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </g>

        <!-- Videocam -->
        <g *ngSwitchCase="'videocam'">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </g>

        <!-- Location -->
        <g *ngSwitchCase="'location'">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </g>

        <!-- Timer -->
        <g *ngSwitchCase="'timer'">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </g>

        <!-- Person -->
        <g *ngSwitchCase="'person'">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </g>

        <!-- Description -->
        <g *ngSwitchCase="'description'">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </g>

        <!-- Inbox -->
        <g *ngSwitchCase="'inbox'">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </g>

        <!-- Group -->
        <g *ngSwitchCase="'group'">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </g>

        <!-- Close -->
        <g *ngSwitchCase="'close'">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </g>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      flex-shrink: 0;
    }
  `]
})
export class IconComponent {
  @Input() name: string = 'dashboard';
  @Input() size: number | string = 24;
  @Input() fill: string = 'none';
  @Input() stroke: string = 'currentColor';
  @Input() strokeWidth: string = '2';
  @Input() strokeLinecap: string = 'round';
  @Input() strokeLinejoin: string = 'round';
  @Input() className: string = '';

  get viewBox(): string {
    return '0 0 24 24';
  }
}

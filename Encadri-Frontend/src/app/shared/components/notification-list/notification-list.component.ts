import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  template: `
    <div class="notifications-container">
      <h3>Notifications</h3>
      
      <div *ngIf="notifications().length === 0" class="empty-state">
        <p>No notifications yet.</p>
      </div>

      <div class="notification-list">
        <div *ngFor="let notification of notifications()" 
             class="notification-item" 
             [class.unread]="!notification.isRead">
          
          <div class="content">
            <h4>{{ notification.title }}</h4>
            <p>{{ notification.message }}</p>
            <span class="time">{{ notification.createdDate | date:'short' }}</span>
          </div>

          <div class="actions">
            <app-ui-button
              *ngIf="notification.type === 'invitation' && !notification.isRead"
              variant="primary"
              size="sm"
              (click)="acceptInvitation(notification)">
              Accept
            </app-ui-button>
            <app-ui-button
              *ngIf="notification.type === 'invitation' && !notification.isRead"
              variant="danger"
              size="sm"
              (click)="declineInvitation(notification)">
              Decline
            </app-ui-button>
            <button class="mark-read-btn" (click)="markAsRead(notification)" *ngIf="!notification.isRead">
              Mark as read
            </button>
            <button class="delete-btn" (click)="deleteNotification(notification)">✕</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: var(--spacing-4);
      max-width: 600px;
    }

    .notification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--slate-200);
      background: white;
      transition: background 0.2s;
    }

    .notification-item.unread {
      background: var(--primary-50);
    }

    .content h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--slate-900);
    }

    .content p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: var(--slate-700);
    }

    .time {
      font-size: 0.75rem;
      color: var(--slate-500);
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .mark-read-btn, .delete-btn {
      background: none;
      border: none;
      font-size: 0.875rem;
      cursor: pointer;
      color: var(--slate-500);
    }

    .delete-btn {
      font-size: 1.25rem;
      color: var(--slate-400);
    }
    
    .delete-btn:hover {
      color: var(--danger);
    }
  `]
})
export class NotificationListComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  notifications = this.notificationService.notifications;

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    const user = this.authService.currentUser();
    if (user) {
      try {
        await this.notificationService.loadNotifications();
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  }

  async markAsRead(notification: Notification) {
    if (!notification.id) return;

    try {
      await this.notificationService.markAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async deleteNotification(notification: Notification) {
    if (!notification.id) return;

    try {
      await this.notificationService.deleteNotification(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  acceptInvitation(notification: Notification) {
    const user = this.authService.currentUser();
    if (!user || !notification.link) return;

    this.projectService.joinProject(notification.link, user.email).subscribe({
      next: async () => {
        // Delete the notification instead of just marking as read
        await this.deleteNotification(notification);
        this.toastService.success('You have successfully joined the project!');

        // Navigate after a short delay to show the toast
        setTimeout(() => {
          this.router.navigate(['/projects', notification.link]);
        }, 500);
      },
      error: (err) => {
        console.error('Failed to join', err);
        this.toastService.error('Failed to accept invitation. Please try again.');
      }
    });
  }

  declineInvitation(notification: Notification) {
    const user = this.authService.currentUser();
    if (!user || !notification.link) return;

    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    this.projectService.declineInvitation(notification.link, user.email).subscribe({
      next: async () => {
        await this.deleteNotification(notification);
        this.toastService.success('Invitation declined');
      },
      error: (err) => {
        console.error('Failed to decline invitation:', err);
        this.toastService.error('Failed to decline invitation. Please try again.');
      }
    });
  }
}

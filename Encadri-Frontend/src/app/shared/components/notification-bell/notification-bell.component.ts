import { Component, OnInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;
  private subscriptions = new Subscription();
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);

  constructor(
    public notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    // React to new notifications for toast (handled by parent/toast component)
    effect(() => {
      const count = this.notificationService.unreadCount();
      console.log('📊 Unread notifications:', count);
    });
  }

  async ngOnInit() {
    // Connect to notification hub
    const user = this.authService.currentUser();

    if (user) {
      try {
        await this.notificationService.startConnection(user.email);
      } catch (error) {
        console.error('Failed to connect to notification hub:', error);
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.notificationService.stopConnection();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  async onNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.isRead && notification.id) {
      await this.notificationService.markAsRead(notification.id);
    }

    // Navigate to link if available
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }

    // Close dropdown
    this.closeDropdown();
  }

  async markAllAsRead() {
    await this.notificationService.markAllAsRead();
  }

  async deleteNotification(event: Event, notificationId: string | undefined) {
    event.stopPropagation();

    if (!notificationId) return;

    await this.notificationService.deleteNotification(notificationId);
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'message': '💬',
      'project': '📁',
      'submission': '📝',
      'meeting': '📅',
      'evaluation': '⭐',
      'grade': '🎓',
      'deadline': '⏰',
      'system': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };
    return icons[type] || '🔔';
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  formatTime(date: Date | undefined): string {
    if (!date) return '';

    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return notifDate.toLocaleDateString();
  }

  async acceptInvitation(event: Event, notification: Notification) {
    event.stopPropagation();

    const user = this.authService.currentUser();
    if (!user || !notification.link) return;

    this.projectService.joinProject(notification.link, user.email).subscribe({
      next: async () => {
        // Delete the notification instead of just marking as read
        if (notification.id) {
          await this.notificationService.deleteNotification(notification.id);
        }
        this.toastService.success('You have successfully joined the project!');
        this.closeDropdown();

        // Navigate after a short delay to show the toast
        setTimeout(() => {
          this.router.navigate(['/projects', notification.link]);
        }, 500);
      },
      error: (err) => {
        console.error('Failed to join project:', err);
        this.toastService.error('Failed to accept invitation. Please try again.');
      }
    });
  }

  async declineInvitation(event: Event, notification: Notification) {
    event.stopPropagation();

    const user = this.authService.currentUser();
    if (!user || !notification.link) return;

    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    this.projectService.declineInvitation(notification.link, user.email).subscribe({
      next: async () => {
        if (notification.id) {
          await this.notificationService.deleteNotification(notification.id);
        }
        this.toastService.success('Invitation declined');
        this.closeDropdown();
      },
      error: (err) => {
        console.error('Failed to decline invitation:', err);
        this.toastService.error('Failed to decline invitation. Please try again.');
      }
    });
  }
}

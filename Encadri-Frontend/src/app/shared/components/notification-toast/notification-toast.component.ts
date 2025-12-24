import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

interface ToastNotification extends Notification {
  toastId: number;
  timer?: any;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  toasts: ToastNotification[] = [];
  private subscription?: Subscription;
  private toastIdCounter = 0;
  private readonly maxToasts = 3;
  private readonly toastDuration = 5000; // 5 seconds

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Subscribe to new notifications
    this.subscription = this.notificationService.newNotification$.subscribe(
      notification => {
        this.showToast(notification);
      }
    );
  }

  ngOnDestroy() {
    // Clear all timers
    this.toasts.forEach(toast => {
      if (toast.timer) {
        clearTimeout(toast.timer);
      }
    });

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  showToast(notification: Notification) {
    // Validate notification has required fields
    if (!notification || !notification.title || !notification.message) {
      console.warn('Invalid notification received:', notification);
      return;
    }

    // Create toast with unique ID
    const toast: ToastNotification = {
      ...notification,
      toastId: this.toastIdCounter++
    };

    // Remove oldest toast if we've reached the limit
    if (this.toasts.length >= this.maxToasts) {
      const oldestToast = this.toasts[0];
      this.removeToast(oldestToast.toastId);
    }

    // Add new toast
    this.toasts.push(toast);
    console.log('📢 Showing notification toast:', toast.title);

    // Auto-remove after duration
    toast.timer = setTimeout(() => {
      this.removeToast(toast.toastId);
    }, this.toastDuration);
  }

  removeToast(toastId: number) {
    const index = this.toasts.findIndex(t => t.toastId === toastId);
    if (index !== -1) {
      const toast = this.toasts[index];
      if (toast.timer) {
        clearTimeout(toast.timer);
      }
      this.toasts.splice(index, 1);
    }
  }

  onToastClick(toast: ToastNotification) {
    // Mark as read when clicked
    if (!toast.isRead && toast.id) {
      this.notificationService.markAsRead(toast.id);
    }

    // Remove toast
    this.removeToast(toast.toastId);

    // Navigate if there's a link (handled by router in parent)
    if (toast.link) {
      window.location.href = toast.link;
    }
  }

  onCloseClick(event: Event, toastId: number) {
    event.stopPropagation();
    this.removeToast(toastId);
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
}

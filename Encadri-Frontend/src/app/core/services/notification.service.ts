import { Injectable, signal, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  id?: string;
  userEmail: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  priority: string;
  createdDate?: Date;
  updatedDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl = `${environment.hubUrl}/notifications`;
  private readonly apiUrl = environment.apiUrl;
  private currentUserEmail: string | null = null;

  // Signals for reactive state (Angular 18)
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  // Observables for real-time events
  private newNotificationSubject = new Subject<Notification>();
  private connectionStateSubject = new BehaviorSubject<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );

  // Public observables
  public newNotification$ = this.newNotificationSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();

  constructor() {}

  /**
   * Start SignalR connection for notifications
   */
  public async startConnection(userEmail: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('Already connected to Notification hub');
      return;
    }

    // Store user email for later use
    this.currentUserEmail = userEmail;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?userEmail=${encodeURIComponent(userEmail)}`, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Set up event handlers
    this.setupEventHandlers();

    // Connection state handlers
    this.hubConnection.onreconnecting((error) => {
      console.log('Notification hub reconnecting...', error);
      this.connectionStateSubject.next(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('Notification hub reconnected:', connectionId);
      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
    });

    this.hubConnection.onclose((error) => {
      console.log('Notification hub connection closed', error);
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
    });

    try {
      await this.hubConnection.start();
      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
      console.log('🔔 Notification hub connected successfully');

      // Load initial notifications
      await this.loadNotifications();
    } catch (error) {
      console.error('Error connecting to Notification hub:', error);
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
      throw error;
    }
  }

  /**
   * Set up SignalR event handlers
   */
  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // New notification received
    this.hubConnection.on('NewNotification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification.title);

      // Add to notifications list
      this.notifications.update(current => [notification, ...current]);

      // Update unread count
      this.unreadCount.update(count => count + 1);

      // Only show toast for non-invitation notifications
      // Invitations are shown in the notification bell with action buttons
      if (notification.type !== 'invitation') {
        this.newNotificationSubject.next(notification);
      }

      // Play notification sound
      this.playNotificationSound();
    });

    // Unread count updated
    this.hubConnection.on('UnreadCountUpdated', (count: number) => {
      console.log('📊 Unread count updated:', count);
      this.unreadCount.set(count);
    });
  }

  /**
   * Stop SignalR connection
   */
  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
    }
  }

  /**
   * Load notifications from server
   */
  public async loadNotifications(limit: number = 20): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    if (!this.currentUserEmail) throw new Error('User email not set');

    try {
      const notificationsList = await this.hubConnection.invoke<Notification[]>('GetNotifications', this.currentUserEmail, limit);
      this.notifications.set(notificationsList);
      console.log('📬 Loaded notifications:', notificationsList.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    if (!this.currentUserEmail) throw new Error('User email not set');

    try {
      await this.hubConnection.invoke('MarkAsRead', notificationId, this.currentUserEmail);

      // Update local state
      this.notifications.update(current =>
        current.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );

      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    if (!this.currentUserEmail) throw new Error('User email not set');

    try {
      await this.hubConnection.invoke('MarkAllAsRead', this.currentUserEmail);

      // Update local state
      this.notifications.update(current => current.map(n => ({ ...n, isRead: true })));

      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    if (!this.currentUserEmail) throw new Error('User email not set');

    try {
      await this.hubConnection.invoke('DeleteNotification', notificationId, this.currentUserEmail);

      // Update local state
      this.notifications.update(current => current.filter(n => n.id !== notificationId));

      console.log('🗑️ Notification deleted:', notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Try to play MP3 file first
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        // If MP3 fails, use Web Audio API to generate a beep
        this.playBeepSound();
      });
    } catch (error) {
      // If audio file doesn't exist, use Web Audio API
      this.playBeepSound();
    }
  }

  /**
   * Generate a simple beep sound using Web Audio API
   */
  private playBeepSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set frequency for notification beep (higher pitch)
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      // Set volume
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      // Play for 0.2 seconds
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      // Silently fail if Web Audio API is not supported
      console.log('Notification sound not available');
    }
  }

  /**
   * Create a new notification via backend API
   * This will trigger SignalR to broadcast the notification to the user
   */
  public createNotification(notification: Omit<Notification, 'id' | 'createdDate' | 'updatedDate'>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/notifications`, notification);
  }
}

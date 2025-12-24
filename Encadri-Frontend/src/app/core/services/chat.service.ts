import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  Message,
  ChatRoom,
  TypingIndicator,
  ReadReceipt,
  SendMessageDto,
  UserConnection,
  ChatUser,
  MessageReaction,
  LastSeenDto
} from '../models/chat.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl = `${environment.hubUrl}/chat`;

  // Observables for real-time events
  private messagesSubject = new Subject<Message>();
  private typingIndicatorSubject = new Subject<TypingIndicator>();
  private readReceiptSubject = new Subject<ReadReceipt>();
  private userOnlineSubject = new Subject<ChatUser>();
  private userOfflineSubject = new Subject<string>();
  private reactionUpdatedSubject = new Subject<{ messageId: string, reactions: MessageReaction[] }>();
  private lastSeenUpdatedSubject = new Subject<LastSeenDto>();
  private connectionStateSubject = new BehaviorSubject<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );

  // Public observables
  public messages$ = this.messagesSubject.asObservable();
  public typingIndicators$ = this.typingIndicatorSubject.asObservable();
  public readReceipts$ = this.readReceiptSubject.asObservable();
  public userOnline$ = this.userOnlineSubject.asObservable();
  public userOffline$ = this.userOfflineSubject.asObservable();
  public reactionUpdated$ = this.reactionUpdatedSubject.asObservable();
  public lastSeenUpdated$ = this.lastSeenUpdatedSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();

  constructor() {}

  /**
   * Start SignalR connection
   */
  public async startConnection(userEmail: string, userName: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('Already connected to SignalR hub');
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?userEmail=${encodeURIComponent(userEmail)}&userName=${encodeURIComponent(userName)}`, {
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
      console.log('SignalR reconnecting...', error);
      this.connectionStateSubject.next(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed', error);
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
    });

    try {
      await this.hubConnection.start();
      this.connectionStateSubject.next(signalR.HubConnectionState.Connected);
      console.log('SignalR Connected successfully');
    } catch (error) {
      console.error('Error connecting to SignalR:', error);
      this.connectionStateSubject.next(signalR.HubConnectionState.Disconnected);
      throw error;
    }
  }

  /**
   * Set up SignalR event handlers
   */
  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Receive new messages
    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      console.log('Message received:', message);
      this.messagesSubject.next(message);
    });

    // Typing indicators
    this.hubConnection.on('TypingIndicator', (indicator: TypingIndicator) => {
      this.typingIndicatorSubject.next(indicator);
    });

    // Read receipts
    this.hubConnection.on('MessageRead', (receipt: ReadReceipt) => {
      this.readReceiptSubject.next(receipt);
    });

    // User online/offline
    this.hubConnection.on('UserOnline', (email: string, name: string) => {
      this.userOnlineSubject.next({ email, name, isOnline: true });
    });

    this.hubConnection.on('UserOffline', (email: string) => {
      this.userOfflineSubject.next(email);
    });

    // Room events
    this.hubConnection.on('UserJoinedRoom', (roomId: string, userEmail: string) => {
      console.log(`User ${userEmail} joined room ${roomId}`);
    });

    this.hubConnection.on('UserLeftRoom', (roomId: string, userEmail: string) => {
      console.log(`User ${userEmail} left room ${roomId}`);
    });

    // Reaction events
    this.hubConnection.on('ReactionUpdated', (messageId: string, reactions: MessageReaction[]) => {
      this.reactionUpdatedSubject.next({ messageId, reactions });
    });

    // Last seen events
    this.hubConnection.on('UserLastSeenUpdated', (lastSeenDto: LastSeenDto) => {
      this.lastSeenUpdatedSubject.next(lastSeenDto);
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
   * Join a chat room
   */
  public async joinRoom(roomId: string, userEmail: string): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    await this.hubConnection.invoke('JoinRoom', roomId, userEmail);
  }

  /**
   * Leave a chat room
   */
  public async leaveRoom(roomId: string, userEmail: string): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    await this.hubConnection.invoke('LeaveRoom', roomId, userEmail);
  }

  /**
   * Send a message
   */
  public async sendMessage(messageDto: SendMessageDto): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    await this.hubConnection.invoke('SendMessage', messageDto);
  }

  /**
   * Send typing indicator
   */
  public async sendTypingIndicator(
    roomId: string,
    userEmail: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    await this.hubConnection.invoke('SendTypingIndicator', roomId, userEmail, userName, isTyping);
  }

  /**
   * Mark message as read
   */
  public async markMessageAsRead(messageId: string, userEmail: string): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    await this.hubConnection.invoke('MarkMessageAsRead', messageId, userEmail);
  }

  /**
   * Get online users
   */
  public async getOnlineUsers(): Promise<UserConnection[]> {
    if (!this.hubConnection) throw new Error('Not connected');
    return await this.hubConnection.invoke('GetOnlineUsers');
  }

  /**
   * Get messages for a project or specific conversation
   */
  public async getMessages(projectId: string, limit: number = 50, currentUserEmail?: string, otherUserEmail?: string): Promise<Message[]> {
    if (!this.hubConnection) throw new Error('Not connected');
    return await this.hubConnection.invoke('GetMessages', projectId, limit, currentUserEmail, otherUserEmail);
  }

  /**
   * Toggle reaction on a message
   */
  public async toggleReaction(messageId: string, emoji: string, userEmail: string, userName: string): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    const reactionDto = {
      messageId,
      emoji,
      userEmail,
      userName,
      timestamp: new Date()
    };
    await this.hubConnection.invoke('ToggleReaction', reactionDto);
  }

  /**
   * Update last seen timestamp
   */
  public async updateLastSeen(userEmail: string): Promise<void> {
    if (!this.hubConnection) throw new Error('Not connected');
    await this.hubConnection.invoke('UpdateLastSeen', userEmail);
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}

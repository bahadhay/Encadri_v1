import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Message, TypingIndicator, ChatUser } from '../../core/models/chat.models';
import { Subscription } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  host: {
    'style': 'display: flex; flex-direction: column; height: 100%; min-height: 0;'
  }
})
export class ChatComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // Accept recipient and project as inputs
  @Input() recipientEmail: string = '';
  @Input() recipientName: string = '';
  @Input() projectId: string = 'general';

  messages: Message[] = [];
  newMessage: string = '';
  currentUser = { email: '', name: '' };
  roomId: string = ''; // For group chat
  isTyping: boolean = false;
  typingUsers: Map<string, string> = new Map(); // email -> name
  onlineUsers: ChatUser[] = [];
  isConnected: boolean = false;
  isLoading: boolean = false;

  // Reactions
  hoveredMessageId: string | undefined | null = null;
  showEmojiPickerForMessage: string | undefined | null = null;
  quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // Reply functionality
  replyingTo: Message | null = null;

  // File upload
  selectedFile: File | null = null;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  private subscriptions = new Subscription();
  private typingTimeout: any;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.isLoading = true;

    // Prevent body scroll
    document.body.classList.add('chat-page');

    // Get current user from auth service
    const user = this.authService.currentUser();
    if (!user) {
      console.error('No authenticated user found');
      this.isLoading = false;
      return;
    }

    this.currentUser = {
      email: user.email,
      name: user.fullName
    };

    try {
      // Start SignalR connection
      await this.chatService.startConnection(
        this.currentUser.email,
        this.currentUser.name
      );
      this.isConnected = true;

      // Subscribe to real-time events
      this.setupSubscriptions();

      // Load existing messages
      await this.loadMessages();

      // Create or join room for one-to-one chat
      this.roomId = this.createRoomId(this.currentUser.email, this.recipientEmail);
      await this.chatService.joinRoom(this.roomId, this.currentUser.email);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    // Detect when recipient changes and reload messages
    if (changes['recipientEmail'] && !changes['recipientEmail'].firstChange) {
      console.log('👤 Recipient changed from', changes['recipientEmail'].previousValue, 'to', changes['recipientEmail'].currentValue);

      // Leave old room
      if (this.roomId && this.currentUser.email) {
        await this.chatService.leaveRoom(this.roomId, this.currentUser.email);
      }

      // Create new room ID
      this.roomId = this.createRoomId(this.currentUser.email, this.recipientEmail);

      // Clear old messages
      this.messages = [];

      // Load new messages
      await this.loadMessages();

      // Join new room
      await this.chatService.joinRoom(this.roomId, this.currentUser.email);

      console.log('✅ Switched to new conversation with', this.recipientEmail);
    }
  }

  ngOnDestroy() {
    // Re-enable body scroll
    document.body.classList.remove('chat-page');

    this.subscriptions.unsubscribe();
    this.chatService.leaveRoom(this.roomId, this.currentUser.email);
    this.chatService.stopConnection();
  }

  private setupSubscriptions() {
    // New messages
    this.subscriptions.add(
      this.chatService.messages$.subscribe((message) => {
        // Only add message if it's part of the current conversation
        const isPartOfConversation =
          (message.senderEmail === this.currentUser.email && message.recipientEmail === this.recipientEmail) ||
          (message.senderEmail === this.recipientEmail && message.recipientEmail === this.currentUser.email);

        if (isPartOfConversation) {
          this.messages.push(message);
          this.scrollToBottom();

          // Mark as read if not from current user
          if (message.senderEmail !== this.currentUser.email && message.id) {
            this.chatService.markMessageAsRead(message.id, this.currentUser.email);
          }
        }
      })
    );

    // Typing indicators
    this.subscriptions.add(
      this.chatService.typingIndicators$.subscribe((indicator) => {
        if (indicator.isTyping) {
          this.typingUsers.set(indicator.userEmail, indicator.userName);
        } else {
          this.typingUsers.delete(indicator.userEmail);
        }
      })
    );

    // Read receipts
    this.subscriptions.add(
      this.chatService.readReceipts$.subscribe((receipt) => {
        console.log('📖 Read receipt received:', receipt);
        const message = this.messages.find(m => m.id === receipt.messageId);
        if (message) {
          console.log('✅ Marking message as read:', message.id);
          message.isRead = true;
          message.readAt = receipt.readAt;
        } else {
          console.warn('⚠️ Message not found for receipt:', receipt.messageId);
        }
      })
    );

    // User online
    this.subscriptions.add(
      this.chatService.userOnline$.subscribe((user) => {
        const existingUser = this.onlineUsers.find(u => u.email === user.email);
        if (!existingUser) {
          this.onlineUsers.push(user);
        }
      })
    );

    // User offline
    this.subscriptions.add(
      this.chatService.userOffline$.subscribe((email) => {
        this.onlineUsers = this.onlineUsers.filter(u => u.email !== email);
      })
    );

    // Connection state
    this.subscriptions.add(
      this.chatService.connectionState$.subscribe((state) => {
        this.isConnected = state === HubConnectionState.Connected;
      })
    );

    // Reactions
    this.subscriptions.add(
      this.chatService.reactionUpdated$.subscribe(({ messageId, reactions }) => {
        console.log('🎭 Reaction update received:', { messageId, reactions });
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
          console.log('✅ Updating message reactions:', message.id);
          message.reactions = reactions;
        } else {
          console.warn('⚠️ Message not found for reaction update:', messageId);
        }
      })
    );
  }

  private async loadMessages() {
    try {
      // Load messages filtered by current conversation (sender/recipient pair)
      this.messages = await this.chatService.getMessages(
        this.projectId,
        50,
        this.currentUser.email,
        this.recipientEmail
      );

      // Parse reactions from JSON
      for (const message of this.messages) {
        if (message.reactionsJson) {
          try {
            message.reactions = JSON.parse(message.reactionsJson);
          } catch (e) {
            message.reactions = [];
          }
        } else {
          message.reactions = [];
        }

        // Mark unread messages as read (messages sent by others)
        if (message.senderEmail !== this.currentUser.email && !message.isRead && message.id) {
          await this.chatService.markMessageAsRead(message.id, this.currentUser.email);
        }
      }

      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  async sendMessage() {
    if ((!this.newMessage.trim() && !this.selectedFile && !this.selectedImage) || !this.isConnected) return;

    try {
      let messageType: 'text' | 'file' | 'image' = 'text';
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let fileMimeType = '';

      // Handle file upload
      if (this.selectedFile) {
        messageType = 'file';
        // In a real app, you would upload to a file storage service
        // For now, we'll use a placeholder URL
        fileUrl = URL.createObjectURL(this.selectedFile);
        fileName = this.selectedFile.name;
        fileSize = this.selectedFile.size;
        fileMimeType = this.selectedFile.type;
      }

      // Handle image upload
      if (this.selectedImage) {
        messageType = 'image';
        fileUrl = URL.createObjectURL(this.selectedImage);
        fileName = this.selectedImage.name;
        fileSize = this.selectedImage.size;
        fileMimeType = this.selectedImage.type;
      }

      await this.chatService.sendMessage({
        content: this.newMessage || (messageType === 'file' ? fileName : ''),
        projectId: this.projectId,
        roomId: this.roomId,
        recipientEmail: this.recipientEmail,
        messageType,
        // Reply fields
        replyToMessageId: this.replyingTo?.id,
        replyToContent: this.replyingTo?.content,
        replyToSenderName: this.replyingTo?.senderName,
        // File fields
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        fileMimeType: fileMimeType || undefined
      });

      this.newMessage = '';
      this.replyingTo = null;
      this.selectedFile = null;
      this.selectedImage = null;
      this.imagePreview = null;
      this.stopTyping();

      // Scroll to bottom after sending
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  onTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatService.sendTypingIndicator(
        this.roomId,
        this.currentUser.email,
        this.currentUser.name,
        true
      );
    }

    // Reset timeout
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  private stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      this.chatService.sendTypingIndicator(
        this.roomId,
        this.currentUser.email,
        this.currentUser.name,
        false
      );
    }
  }

  private scrollToBottom() {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  private createRoomId(email1: string, email2: string): string {
    // Create consistent room ID for one-to-one chat
    const sorted = [email1, email2].sort();
    return `room-${sorted[0]}-${sorted[1]}`;
  }

  isOwnMessage(message: Message): boolean {
    return message.senderEmail === this.currentUser.email;
  }

  getTypingText(): string {
    const users = Array.from(this.typingUsers.values());
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return `${users[0]} and ${users.length - 1} others are typing...`;
  }

  formatTime(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Reaction methods
  toggleEmojiPicker(messageId: string | undefined) {
    this.showEmojiPickerForMessage = this.showEmojiPickerForMessage === messageId ? null : messageId;
  }

  async toggleReaction(message: Message, emoji: string) {
    if (!message.id) {
      console.error('Cannot react: message has no ID', message);
      return;
    }

    console.log('🎭 Toggling reaction:', {
      messageId: message.id,
      emoji,
      user: this.currentUser.email
    });

    try {
      await this.chatService.toggleReaction(
        message.id,
        emoji,
        this.currentUser.email,
        this.currentUser.name
      );
      this.showEmojiPickerForMessage = null;
      console.log('✅ Reaction toggled successfully');
    } catch (error) {
      console.error('❌ Failed to toggle reaction:', error);
    }
  }

  getGroupedReactions(reactions: any[]): Array<{ emoji: string; count: number }> {
    const grouped = reactions.reduce((acc: any, r: any) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0 };
      }
      acc[r.emoji].count++;
      return acc;
    }, {});
    return Object.values(grouped);
  }

  hasUserReacted(reactions: any[], emoji: string): boolean {
    return reactions.some(r => r.emoji === emoji && r.userEmail === this.currentUser.email);
  }

  getReactionTooltip(reactions: any[], emoji: string): string {
    const users = reactions
      .filter(r => r.emoji === emoji)
      .map(r => r.userName || r.userEmail)
      .join(', ');
    return users;
  }

  // Reply methods
  startReply(message: Message) {
    this.replyingTo = message;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  // File upload methods
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedImage = null;
      this.imagePreview = null;
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      this.selectedFile = null;

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  cancelFileUpload() {
    this.selectedFile = null;
  }

  cancelImageUpload() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

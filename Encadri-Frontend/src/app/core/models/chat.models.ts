/**
 * Chat Models for Real-time Messaging
 * Matches backend C# models
 */

export interface Message {
  id?: string;
  projectId: string;
  senderEmail: string;
  senderName?: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  recipientEmail?: string;
  messageType: 'text' | 'system' | 'file' | 'image';
  createdDate?: Date;
  updatedDate?: Date;

  // Reactions
  reactionsJson?: string;
  reactions?: MessageReaction[];

  // Reply/Quote
  replyToMessageId?: string;
  replyToContent?: string;
  replyToSenderName?: string;

  // File/Image attachments
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;

  // Last seen
  lastSeenAt?: Date;
}

export interface ChatRoom {
  id?: string;
  name: string;
  projectId: string;
  roomType: 'OneToOne' | 'Group';
  participantsJson: string;
  createdDate?: Date;
  updatedDate?: Date;
  lastMessageDate?: Date;
}

export interface TypingIndicator {
  userEmail: string;
  userName: string;
  roomId: string;
  isTyping: boolean;
}

export interface ReadReceipt {
  messageId: string;
  userEmail: string;
  readAt: Date;
}

export interface SendMessageDto {
  content: string;
  projectId: string;
  roomId?: string;
  recipientEmail?: string;
  messageType?: 'text' | 'system' | 'file' | 'image';

  // Reply/Quote
  replyToMessageId?: string;
  replyToContent?: string;
  replyToSenderName?: string;

  // File/Image
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

export interface UserConnection {
  userEmail: string;
  userName: string;
  connectionId: string;
}

export interface ChatUser {
  email: string;
  name: string;
  isOnline: boolean;
  lastSeenAt?: Date;
}

export interface MessageReaction {
  messageId: string;
  emoji: string;
  userEmail: string;
  userName: string;
  timestamp: Date;
}

export interface LastSeenDto {
  userEmail: string;
  lastSeenAt: Date;
}

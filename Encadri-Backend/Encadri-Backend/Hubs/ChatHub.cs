using Microsoft.AspNetCore.SignalR;
using Encadri_Backend.Data;
using Encadri_Backend.Models;
using Encadri_Backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace Encadri_Backend.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time chat functionality
    /// Handles one-to-one and group messaging, typing indicators, and read receipts
    /// </summary>
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly Services.NotificationHelperService _notificationService;

        // Track online users and their connections
        private static readonly ConcurrentDictionary<string, UserConnectionDto> _connections = new();

        // Track users in rooms (roomId -> List of userEmails)
        private static readonly ConcurrentDictionary<string, HashSet<string>> _roomUsers = new();

        public ChatHub(ApplicationDbContext context, Services.NotificationHelperService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Called when a user connects
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var userEmail = httpContext?.Request.Query["userEmail"].ToString();
            var userName = httpContext?.Request.Query["userName"].ToString();

            if (!string.IsNullOrEmpty(userEmail))
            {
                var userConnection = new UserConnectionDto
                {
                    UserEmail = userEmail,
                    UserName = userName ?? userEmail,
                    ConnectionId = Context.ConnectionId
                };

                _connections[Context.ConnectionId] = userConnection;

                // Notify all clients that this user is now online
                await Clients.All.SendAsync("UserOnline", userEmail, userName);
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Called when a user disconnects
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_connections.TryRemove(Context.ConnectionId, out var userConnection))
            {
                // Remove user from all rooms
                foreach (var room in _roomUsers)
                {
                    room.Value.Remove(userConnection.UserEmail);
                }

                // Notify all clients that this user is now offline
                await Clients.All.SendAsync("UserOffline", userConnection.UserEmail);
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a specific chat room (for group or one-to-one chat)
        /// </summary>
        public async Task JoinRoom(string roomId, string userEmail)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            // Track room membership
            if (!_roomUsers.ContainsKey(roomId))
            {
                _roomUsers[roomId] = new HashSet<string>();
            }
            _roomUsers[roomId].Add(userEmail);

            // Notify room members
            await Clients.Group(roomId).SendAsync("UserJoinedRoom", roomId, userEmail);
        }

        /// <summary>
        /// Leave a specific chat room
        /// </summary>
        public async Task LeaveRoom(string roomId, string userEmail)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

            // Remove from tracking
            if (_roomUsers.ContainsKey(roomId))
            {
                _roomUsers[roomId].Remove(userEmail);
            }

            // Notify room members
            await Clients.Group(roomId).SendAsync("UserLeftRoom", roomId, userEmail);
        }

        /// <summary>
        /// Send a message to a room or specific user
        /// </summary>
        public async Task SendMessage(SendMessageDto messageDto)
        {
            if (!_connections.TryGetValue(Context.ConnectionId, out var sender))
            {
                return;
            }

            // Create message entity
            var message = new Message
            {
                Id = Guid.NewGuid().ToString(),
                ProjectId = messageDto.ProjectId,
                SenderEmail = sender.UserEmail,
                SenderName = sender.UserName,
                Content = messageDto.Content,
                MessageType = messageDto.MessageType,
                RecipientEmail = messageDto.RecipientEmail,
                IsRead = false,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow,
                // Reply/Quote fields
                ReplyToMessageId = messageDto.ReplyToMessageId,
                ReplyToContent = messageDto.ReplyToContent,
                ReplyToSenderName = messageDto.ReplyToSenderName,
                // File/Image fields
                FileUrl = messageDto.FileUrl,
                FileName = messageDto.FileName,
                FileSize = messageDto.FileSize,
                FileMimeType = messageDto.FileMimeType
            };

            // Save to database
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Send to appropriate recipients
            if (!string.IsNullOrEmpty(messageDto.RoomId))
            {
                // Send to everyone in the room (both sender and recipient)
                await Clients.Group(messageDto.RoomId).SendAsync("ReceiveMessage", message);
            }
            else if (!string.IsNullOrEmpty(messageDto.RecipientEmail) && messageDto.RecipientEmail != sender.UserEmail)
            {
                // Direct message (no room) - send to recipient and sender separately
                var recipientConnection = _connections.Values
                    .FirstOrDefault(c => c.UserEmail == messageDto.RecipientEmail);

                if (recipientConnection != null)
                {
                    // Send to recipient
                    await Clients.Client(recipientConnection.ConnectionId).SendAsync("ReceiveMessage", message);
                }

                // Send back to sender for confirmation
                await Clients.Caller.SendAsync("ReceiveMessage", message);
            }

            // ALWAYS send notification if there's a recipient (even if using room)
            if (!string.IsNullOrEmpty(messageDto.RecipientEmail) && messageDto.RecipientEmail != sender.UserEmail)
            {
                // Send notification to recipient (works even if they're not on chat page)
                var messagePreview = message.Content.Length > 50
                    ? message.Content.Substring(0, 50) + "..."
                    : message.Content;

                await _notificationService.NotifyNewMessage(
                    messageDto.RecipientEmail,
                    sender.UserName,
                    messagePreview,
                    message.ProjectId ?? message.Id
                );
            }
        }

        /// <summary>
        /// Send typing indicator
        /// </summary>
        public async Task SendTypingIndicator(string roomId, string userEmail, string userName, bool isTyping)
        {
            var typingDto = new TypingIndicatorDto
            {
                RoomId = roomId,
                UserEmail = userEmail,
                UserName = userName,
                IsTyping = isTyping
            };

            // Send to all users in the room except the sender
            await Clients.OthersInGroup(roomId).SendAsync("TypingIndicator", typingDto);
        }

        /// <summary>
        /// Mark message as read and send read receipt
        /// </summary>
        public async Task MarkMessageAsRead(string messageId, string userEmail)
        {
            var message = await _context.Messages.FindAsync(messageId);
            if (message != null && !message.IsRead)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var readReceipt = new ReadReceiptDto
                {
                    MessageId = messageId,
                    UserEmail = userEmail,
                    ReadAt = message.ReadAt.Value
                };

                // Notify the message sender
                var senderConnection = _connections.Values
                    .FirstOrDefault(c => c.UserEmail == message.SenderEmail);

                if (senderConnection != null)
                {
                    await Clients.Client(senderConnection.ConnectionId).SendAsync("MessageRead", readReceipt);
                }
            }
        }

        /// <summary>
        /// Get online users
        /// </summary>
        public async Task<List<UserConnectionDto>> GetOnlineUsers()
        {
            return await Task.FromResult(_connections.Values.ToList());
        }

        /// <summary>
        /// Get messages for a specific project/room or conversation between two users
        /// </summary>
        public async Task<List<Message>> GetMessages(string projectId, int limit = 50, string? currentUserEmail = null, string? otherUserEmail = null)
        {
            var query = _context.Messages.Where(m => m.ProjectId == projectId);

            // If both user emails are provided, filter to only show messages between these two users
            if (!string.IsNullOrEmpty(currentUserEmail) && !string.IsNullOrEmpty(otherUserEmail))
            {
                query = query.Where(m =>
                    (m.SenderEmail == currentUserEmail && m.RecipientEmail == otherUserEmail) ||
                    (m.SenderEmail == otherUserEmail && m.RecipientEmail == currentUserEmail)
                );
            }

            return await query
                .OrderByDescending(m => m.CreatedDate)
                .Take(limit)
                .OrderBy(m => m.CreatedDate)
                .ToListAsync();
        }

        /// <summary>
        /// Add or remove a reaction to a message
        /// </summary>
        public async Task ToggleReaction(MessageReactionDto reactionDto)
        {
            Console.WriteLine($"🎭 ToggleReaction called: MessageId={reactionDto.MessageId}, Emoji={reactionDto.Emoji}, User={reactionDto.UserEmail}");

            var message = await _context.Messages.FindAsync(reactionDto.MessageId);
            if (message == null)
            {
                Console.WriteLine($"❌ Message not found: {reactionDto.MessageId}");
                return;
            }

            // Parse existing reactions
            var reactions = new List<MessageReactionDto>();
            if (!string.IsNullOrEmpty(message.ReactionsJson))
            {
                reactions = System.Text.Json.JsonSerializer.Deserialize<List<MessageReactionDto>>(message.ReactionsJson) ?? new List<MessageReactionDto>();
            }

            // Check if user already reacted with this emoji
            var existingReaction = reactions.FirstOrDefault(r =>
                r.UserEmail == reactionDto.UserEmail && r.Emoji == reactionDto.Emoji);

            if (existingReaction != null)
            {
                // Remove reaction (toggle off)
                reactions.Remove(existingReaction);
            }
            else
            {
                // Add reaction
                reactions.Add(reactionDto);
            }

            // Update message
            message.ReactionsJson = System.Text.Json.JsonSerializer.Serialize(reactions);
            message.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Notify all clients in the room about the reaction
            // Create room ID with sorted emails to match frontend logic
            var emails = new[] { message.SenderEmail, message.RecipientEmail }.OrderBy(e => e).ToArray();
            var roomId = $"room-{emails[0]}-{emails[1]}";
            Console.WriteLine($"✅ Broadcasting reaction to room: {roomId}, Reactions count: {reactions.Count}");
            await Clients.Group(roomId).SendAsync("ReactionUpdated", message.Id, reactions);
        }

        /// <summary>
        /// Update last seen timestamp for a user
        /// </summary>
        public async Task UpdateLastSeen(string userEmail)
        {
            var lastSeenDto = new LastSeenDto
            {
                UserEmail = userEmail,
                LastSeenAt = DateTime.UtcNow
            };

            // Broadcast to all connected clients
            await Clients.All.SendAsync("UserLastSeenUpdated", lastSeenDto);
        }
    }
}

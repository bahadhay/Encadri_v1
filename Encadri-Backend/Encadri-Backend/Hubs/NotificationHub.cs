using Microsoft.AspNetCore.SignalR;
using Encadri_Backend.Data;
using Encadri_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Encadri_Backend.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time notifications
    /// </summary>
    public class NotificationHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private static readonly Dictionary<string, string> _userConnections = new();

        public NotificationHub(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Called when a client connects
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var userEmail = Context.GetHttpContext()?.Request.Query["userEmail"].ToString();

            if (!string.IsNullOrEmpty(userEmail))
            {
                _userConnections[userEmail] = Context.ConnectionId;
                Console.WriteLine($"🔔 Notification connection: {userEmail} -> {Context.ConnectionId}");

                // Send unread count on connect
                var unreadCount = await GetUnreadCount(userEmail);
                await Clients.Caller.SendAsync("UnreadCountUpdated", unreadCount);
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Called when a client disconnects
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userEmail = _userConnections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
            if (userEmail != null)
            {
                _userConnections.Remove(userEmail);
                Console.WriteLine($"🔕 Notification disconnected: {userEmail}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Get user's notifications
        /// </summary>
        public async Task<List<Notification>> GetNotifications(string userEmail, int limit = 20)
        {
            return await _context.Notifications
                .Where(n => n.UserEmail == userEmail)
                .OrderByDescending(n => n.CreatedDate)
                .Take(limit)
                .ToListAsync();
        }

        /// <summary>
        /// Get unread notification count
        /// </summary>
        public async Task<int> GetUnreadCount(string userEmail)
        {
            return await _context.Notifications
                .Where(n => n.UserEmail == userEmail && !n.IsRead)
                .CountAsync();
        }

        /// <summary>
        /// Mark notification as read
        /// </summary>
        public async Task MarkAsRead(string notificationId, string userEmail)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null && notification.UserEmail == userEmail)
            {
                notification.IsRead = true;
                notification.UpdatedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Send updated unread count
                var unreadCount = await GetUnreadCount(userEmail);
                await Clients.Caller.SendAsync("UnreadCountUpdated", unreadCount);

                Console.WriteLine($"✅ Notification marked as read: {notificationId}");
            }
        }

        /// <summary>
        /// Mark all notifications as read
        /// </summary>
        public async Task MarkAllAsRead(string userEmail)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserEmail == userEmail && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.UpdatedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Send updated unread count (should be 0)
            await Clients.Caller.SendAsync("UnreadCountUpdated", 0);

            Console.WriteLine($"✅ All notifications marked as read for: {userEmail}");
        }

        /// <summary>
        /// Delete a notification
        /// </summary>
        public async Task DeleteNotification(string notificationId, string userEmail)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null && notification.UserEmail == userEmail)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                // Send updated unread count
                var unreadCount = await GetUnreadCount(userEmail);
                await Clients.Caller.SendAsync("UnreadCountUpdated", unreadCount);

                Console.WriteLine($"🗑️ Notification deleted: {notificationId}");
            }
        }

        /// <summary>
        /// Send notification to a specific user (called from other parts of the app)
        /// </summary>
        public static async Task SendNotificationToUser(
            IHubContext<NotificationHub> hubContext,
            ApplicationDbContext context,
            string userEmail,
            string title,
            string message,
            string type,
            string priority = "Medium",
            string? link = null)
        {
            // Create notification in database
            var notification = new Notification
            {
                Id = Guid.NewGuid().ToString(),
                UserEmail = userEmail,
                Title = title,
                Message = message,
                Type = type,
                Priority = priority,
                Link = link,
                IsRead = false,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };

            context.Notifications.Add(notification);
            await context.SaveChangesAsync();

            Console.WriteLine($"📬 New notification created for {userEmail}: {title}");

            // Send real-time notification if user is connected
            if (_userConnections.TryGetValue(userEmail, out var connectionId))
            {
                await hubContext.Clients.Client(connectionId).SendAsync("NewNotification", notification);

                // Send updated unread count
                var unreadCount = await context.Notifications
                    .Where(n => n.UserEmail == userEmail && !n.IsRead)
                    .CountAsync();

                await hubContext.Clients.Client(connectionId).SendAsync("UnreadCountUpdated", unreadCount);

                Console.WriteLine($"✉️ Notification sent to connected user: {userEmail}");
            }
            else
            {
                Console.WriteLine($"📭 User not connected, notification saved to database: {userEmail}");
            }
        }
    }
}

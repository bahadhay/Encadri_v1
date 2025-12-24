namespace Encadri_Backend.Models.DTOs
{
    /// <summary>
    /// DTO for typing indicator events
    /// </summary>
    public class TypingIndicatorDto
    {
        public string UserEmail { get; set; }
        public string UserName { get; set; }
        public string RoomId { get; set; }
        public bool IsTyping { get; set; }
    }

    /// <summary>
    /// DTO for read receipt events
    /// </summary>
    public class ReadReceiptDto
    {
        public string MessageId { get; set; }
        public string UserEmail { get; set; }
        public DateTime ReadAt { get; set; }
    }

    /// <summary>
    /// DTO for sending messages through SignalR
    /// </summary>
    public class SendMessageDto
    {
        public string Content { get; set; }
        public string ProjectId { get; set; }
        public string? RoomId { get; set; }
        public string? RecipientEmail { get; set; }
        public string MessageType { get; set; } = "text";

        // Reply/Quote feature
        public string? ReplyToMessageId { get; set; }
        public string? ReplyToContent { get; set; }
        public string? ReplyToSenderName { get; set; }

        // File/Image attachments
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public string? FileMimeType { get; set; }
    }

    /// <summary>
    /// DTO for user connection info
    /// </summary>
    public class UserConnectionDto
    {
        public string UserEmail { get; set; }
        public string UserName { get; set; }
        public string ConnectionId { get; set; }
    }

    /// <summary>
    /// DTO for message reactions
    /// </summary>
    public class MessageReactionDto
    {
        public string MessageId { get; set; }
        public string Emoji { get; set; }
        public string UserEmail { get; set; }
        public string UserName { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// DTO for last seen status
    /// </summary>
    public class LastSeenDto
    {
        public string UserEmail { get; set; }
        public DateTime LastSeenAt { get; set; }
    }
}

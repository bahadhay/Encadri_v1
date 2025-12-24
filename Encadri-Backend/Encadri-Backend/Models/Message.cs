namespace Encadri_Backend.Models
{
    /// <summary>
    /// Message Model
    /// Represents a message between student and supervisor in a project
    /// Enhanced for real-time chat functionality with reactions, replies, and file attachments
    /// </summary>
    public class Message
    {
        public string? Id { get; set; }
        public string ProjectId { get; set; }
        public string SenderEmail { get; set; }
        public string? SenderName { get; set; }
        public string Content { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public string? RecipientEmail { get; set; }  // For one-to-one chat
        public string MessageType { get; set; } = "text"; // text, system, file, image
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }

        // Reactions feature - JSON array of {emoji, userEmail, userName, timestamp}
        public string? ReactionsJson { get; set; }

        // Reply/Quote feature
        public string? ReplyToMessageId { get; set; }
        public string? ReplyToContent { get; set; }
        public string? ReplyToSenderName { get; set; }

        // File/Image attachments
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public string? FileMimeType { get; set; }

        // Last seen tracking
        public DateTime? LastSeenAt { get; set; }
    }
}

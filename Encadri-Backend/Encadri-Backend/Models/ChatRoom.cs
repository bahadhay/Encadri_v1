namespace Encadri_Backend.Models
{
    /// <summary>
    /// ChatRoom Model
    /// Represents a chat room for one-to-one or group conversations
    /// </summary>
    public class ChatRoom
    {
        public string? Id { get; set; }
        public string Name { get; set; }
        public string ProjectId { get; set; }
        public string RoomType { get; set; } = "OneToOne"; // OneToOne, Group
        public string ParticipantsJson { get; set; } // JSON array of participant emails
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public DateTime? LastMessageDate { get; set; }
    }
}

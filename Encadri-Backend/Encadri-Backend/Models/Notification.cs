namespace Encadri_Backend.Models
{
    /// <summary>
    /// Notification Model
    /// Represents a system notification for a user
    /// </summary>
    public class Notification
    {
        public string? Id { get; set; }
        public string UserEmail { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; } // "project_status", "new_assignment", "deadline", "feedback", "meeting", "message", "system", "invitation"
        public bool IsRead { get; set; } = false;
        public string? Link { get; set; }
        public string Priority { get; set; } // "low", "normal", "high", "urgent"
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

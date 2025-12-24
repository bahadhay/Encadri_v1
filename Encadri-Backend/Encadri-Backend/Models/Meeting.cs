namespace Encadri_Backend.Models
{
    /// <summary>
    /// Meeting Model
    /// Represents a scheduled meeting between student and supervisor
    /// </summary>
    public class Meeting
    {
        public string? Id { get; set; }
        public string ProjectId { get; set; }
        public string? Title { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int? DurationMinutes { get; set; }
        public string? Location { get; set; }
        public string Status { get; set; } // "pending", "confirmed", "completed", "cancelled"
        public string? Agenda { get; set; }
        public string? Notes { get; set; }
        public string? RequestedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

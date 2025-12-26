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
        public string? MeetingNotes { get; set; } // Notes taken during the meeting
        public string? RequestedBy { get; set; }
        public string StudentEmail { get; set; }
        public string SupervisorEmail { get; set; }
        public string? MeetingLink { get; set; } // Azure Communication Services link or physical location
        public string MeetingType { get; set; } // "virtual", "in-person", "hybrid"
        public string? CancellationReason { get; set; } // Reason for cancelling the meeting
        public bool IsRecurring { get; set; } = false;
        public string? RecurrencePattern { get; set; } // "weekly", "biweekly", "monthly"
        public DateTime? RecurrenceEndDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

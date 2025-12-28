namespace Encadri_Backend.Models
{
    /// <summary>
    /// Milestone Model
    /// Represents a project milestone or deliverable
    /// </summary>
    public class Milestone
    {
        public string? Id { get; set; }
        public string ProjectId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } // "not_started", "in_progress", "completed", "overdue"
        public DateTime? CompletedDate { get; set; }
        public int? Order { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

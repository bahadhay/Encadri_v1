namespace Encadri_Backend.Models
{
    /// <summary>
    /// Submission Model
    /// Represents a student submission for a project
    /// </summary>
    public class Submission
    {
        public string? Id { get; set; }
        public string ProjectId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Type { get; set; } // "report", "presentation", "code", "documentation", "other"
        public string? FileUrl { get; set; }
        public string SubmittedBy { get; set; }
        public string Status { get; set; } // "pending", "reviewed", "approved", "needs_revision"
        public string? Feedback { get; set; }
        public double? Grade { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

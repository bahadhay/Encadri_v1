namespace Encadri_Backend.Models
{
    /// <summary>
    /// Project Model
    /// Represents an academic project (PFA, PFE, or Internship)
    /// </summary>
    public class Project
    {
        public string? Id { get; set; }
        public string Title { get; set; }
        public string Type { get; set; } // "PFA", "PFE", or "Internship"
        public string? Description { get; set; }
        public string? StudentEmail { get; set; }
        public string? StudentName { get; set; }
        public string? SupervisorEmail { get; set; }
        public string? SupervisorName { get; set; }
        public string Status { get; set; } // "proposed", "in_progress", "under_review", "completed", "archived"
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Company { get; set; }
        public List<string>? Technologies { get; set; }
        public List<string>? Objectives { get; set; }
        public double? FinalGrade { get; set; }
        public int? ProgressPercentage { get; set; }
        public string OwnerEmail { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

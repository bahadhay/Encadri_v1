namespace Encadri_Backend.Models
{
    /// <summary>
    /// Evaluation Model
    /// Represents a project evaluation by a supervisor
    /// </summary>
    public class Evaluation
    {
        public string? Id { get; set; }
        public string ProjectId { get; set; }
        public string EvaluatorEmail { get; set; }
        public string? EvaluatorName { get; set; }
        public double? ReportQualityScore { get; set; }
        public double? TechnicalImplementationScore { get; set; }
        public double? PresentationScore { get; set; }
        public double? ProfessionalConductScore { get; set; }
        public double? FinalGrade { get; set; }
        public string? Comments { get; set; }
        public DateTime? DefenseDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

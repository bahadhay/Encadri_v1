using System.ComponentModel.DataAnnotations;

namespace Encadri_Backend.Models.DTOs
{
    public class DocumentUploadDto
    {
        [Required]
        public string ProjectId { get; set; } = string.Empty;

        [Required]
        public IFormFile File { get; set; } = null!;

        [MaxLength(100)]
        public string Category { get; set; } = "Other";

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(200)]
        public string? Tags { get; set; }
    }
}

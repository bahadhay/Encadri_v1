using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Encadri_Backend.Models
{
    public class ProjectDocument
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string ProjectId { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string OriginalFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string BlobName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ContentType { get; set; }

        [Required]
        public long FileSize { get; set; }

        [MaxLength(100)]
        public string Category { get; set; } = "Other";

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? UploadedByEmail { get; set; }

        [MaxLength(200)]
        public string? UploadedByName { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastModifiedAt { get; set; }

        [MaxLength(500)]
        public string? BlobUrl { get; set; }

        public bool IsApproved { get; set; } = false;

        [MaxLength(100)]
        public string? ApprovedByEmail { get; set; }

        public DateTime? ApprovedAt { get; set; }

        [MaxLength(50)]
        public string? Version { get; set; }

        public int DownloadCount { get; set; } = 0;

        public bool IsDeleted { get; set; } = false;

        [MaxLength(200)]
        public string? Tags { get; set; }

        // Computed properties for frontend compatibility
        [NotMapped]
        [JsonPropertyName("fileName")]
        public string FileName => OriginalFileName;

        [NotMapped]
        [JsonPropertyName("fileType")]
        public string FileType => ContentType ?? "application/octet-stream";

        [NotMapped]
        [JsonPropertyName("fileExtension")]
        public string FileExtension => Path.GetExtension(OriginalFileName);

        [NotMapped]
        [JsonPropertyName("uploadedBy")]
        public string UploadedBy => UploadedByEmail ?? string.Empty;

        [NotMapped]
        [JsonPropertyName("uploadDate")]
        public DateTime UploadDate => UploadedAt;

        [NotMapped]
        [JsonPropertyName("approvedBy")]
        public string? ApprovedBy => ApprovedByEmail;

        [NotMapped]
        [JsonPropertyName("approvalDate")]
        public DateTime? ApprovalDate => ApprovedAt;
    }
}

namespace Encadri_Backend.Models
{
    public class Note
    {
        public string? Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty; // Markdown content
        public string? CategoryId { get; set; }
        public string? FolderId { get; set; }
        public string? Color { get; set; } // default, red, blue, green, yellow, purple, orange, pink
        public bool IsPinned { get; set; } = false;
        public List<string>? Tags { get; set; }
        public string UserEmail { get; set; } = string.Empty; // Private notes - user-specific
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

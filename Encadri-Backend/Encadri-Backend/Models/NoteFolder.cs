namespace Encadri_Backend.Models
{
    public class NoteFolder
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? CategoryId { get; set; } // Parent category (optional for root folders)
        public string? ParentFolderId { get; set; } // For nested folders
        public string? Color { get; set; } // default, red, blue, green, yellow, purple, orange, pink
        public string UserEmail { get; set; } = string.Empty;
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

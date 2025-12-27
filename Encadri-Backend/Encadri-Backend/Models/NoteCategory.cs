namespace Encadri_Backend.Models
{
    public class NoteCategory
    {
        public string? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; } // default, red, blue, green, yellow, purple, orange, pink
        public string? Icon { get; set; } // Icon name from IconComponent
        public string UserEmail { get; set; } = string.Empty;
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

namespace Encadri_Backend.Models.DTOs
{
    public class StorageInfoDto
    {
        public long TotalSizeBytes { get; set; }
        public int FileCount { get; set; }
        public long LimitBytes { get; set; } = 1_073_741_824; // 1 GB default
        public double UsagePercentage { get; set; }
        public Dictionary<string, int> FilesByCategory { get; set; } = new();
    }
}

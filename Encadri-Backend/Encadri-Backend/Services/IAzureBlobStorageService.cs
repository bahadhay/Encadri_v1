namespace Encadri_Backend.Services
{
    public interface IAzureBlobStorageService
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
        Task<Stream> DownloadFileAsync(string blobName);
        Task DeleteFileAsync(string blobName);
        Task<bool> FileExistsAsync(string blobName);
        Task<string> GetBlobSasUrlAsync(string blobName, int expiryMinutes = 60);
    }
}

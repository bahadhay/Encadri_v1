using Encadri_Backend.Models;
using Encadri_Backend.Models.DTOs;

namespace Encadri_Backend.Services
{
    public interface IDocumentService
    {
        Task<ProjectDocument> UploadDocumentAsync(DocumentUploadDto dto, string uploaderEmail, string uploaderName);
        Task<IEnumerable<ProjectDocument>> GetProjectDocumentsAsync(string projectId);
        Task<ProjectDocument?> GetDocumentByIdAsync(string id);
        Task<bool> DeleteDocumentAsync(string id);
        Task<StorageInfoDto> GetStorageInfoAsync(string projectId);
        Task<string> GetDownloadUrlAsync(string id);
    }
}

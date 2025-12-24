using Encadri_Backend.Data;
using Encadri_Backend.Models;
using Encadri_Backend.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Encadri_Backend.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IAzureBlobStorageService _blobStorageService;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(
            ApplicationDbContext context,
            IAzureBlobStorageService blobStorageService,
            ILogger<DocumentService> logger)
        {
            _context = context;
            _blobStorageService = blobStorageService;
            _logger = logger;
        }

        public async Task<ProjectDocument> UploadDocumentAsync(DocumentUploadDto dto, string uploaderEmail, string uploaderName)
        {
            try
            {
                // Upload to Azure Blob Storage
                using var stream = dto.File.OpenReadStream();
                var blobName = await _blobStorageService.UploadFileAsync(
                    stream,
                    dto.File.FileName,
                    dto.File.ContentType
                );

                // Generate SAS URL for the uploaded blob (with 1 hour expiry)
                var blobUrl = await _blobStorageService.GetBlobSasUrlAsync(blobName, 60); // 1 hour in minutes

                // Create database record
                var document = new ProjectDocument
                {
                    ProjectId = dto.ProjectId,
                    OriginalFileName = dto.File.FileName,
                    BlobName = blobName,
                    BlobUrl = blobUrl,
                    ContentType = dto.File.ContentType,
                    FileSize = dto.File.Length,
                    Category = dto.Category,
                    Description = dto.Description,
                    Tags = dto.Tags,
                    UploadedByEmail = uploaderEmail,
                    UploadedByName = uploaderName,
                    UploadedAt = DateTime.UtcNow
                };

                _context.Documents.Add(document);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Document uploaded successfully: {document.Id}");
                return document;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading document: {ex.Message}");
                throw;
            }
        }

        public async Task<IEnumerable<ProjectDocument>> GetProjectDocumentsAsync(string projectId)
        {
            var documents = await _context.Documents
                .Where(d => d.ProjectId == projectId && !d.IsDeleted)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();

            // Generate fresh SAS URLs for all documents
            foreach (var doc in documents)
            {
                if (!string.IsNullOrEmpty(doc.BlobName))
                {
                    doc.BlobUrl = await _blobStorageService.GetBlobSasUrlAsync(doc.BlobName, 60); // 1 hour expiry
                }
            }

            return documents;
        }

        public async Task<ProjectDocument?> GetDocumentByIdAsync(string id)
        {
            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

            // Generate fresh SAS URL if document exists
            if (document != null && !string.IsNullOrEmpty(document.BlobName))
            {
                document.BlobUrl = await _blobStorageService.GetBlobSasUrlAsync(document.BlobName, 60); // 1 hour expiry
            }

            return document;
        }

        public async Task<bool> DeleteDocumentAsync(string id)
        {
            try
            {
                var document = await _context.Documents.FindAsync(id);
                if (document == null)
                {
                    return false;
                }

                // Delete from Azure Blob Storage
                await _blobStorageService.DeleteFileAsync(document.BlobName);

                // Soft delete from database
                document.IsDeleted = true;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Document deleted successfully: {id}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting document: {ex.Message}");
                throw;
            }
        }

        public async Task<StorageInfoDto> GetStorageInfoAsync(string projectId)
        {
            var documents = await _context.Documents
                .Where(d => d.ProjectId == projectId && !d.IsDeleted)
                .ToListAsync();

            var totalSize = documents.Sum(d => d.FileSize);
            var fileCount = documents.Count;
            var limitBytes = 1_073_741_824L; // 1 GB

            var filesByCategory = documents
                .GroupBy(d => d.Category)
                .ToDictionary(g => g.Key, g => g.Count());

            return new StorageInfoDto
            {
                TotalSizeBytes = totalSize,
                FileCount = fileCount,
                LimitBytes = limitBytes,
                UsagePercentage = (double)totalSize / limitBytes * 100,
                FilesByCategory = filesByCategory
            };
        }

        public async Task<string> GetDownloadUrlAsync(string id)
        {
            var document = await GetDocumentByIdAsync(id);
            if (document == null)
            {
                throw new FileNotFoundException($"Document with ID {id} not found");
            }

            // Generate SAS URL with 1 hour expiry
            var sasUrl = await _blobStorageService.GetBlobSasUrlAsync(document.BlobName, 60);

            // Increment download count
            document.DownloadCount++;
            await _context.SaveChangesAsync();

            return sasUrl;
        }
    }
}

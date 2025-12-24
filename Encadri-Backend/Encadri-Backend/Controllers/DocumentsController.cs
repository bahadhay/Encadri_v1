using Encadri_Backend.Models.DTOs;
using Encadri_Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly IDocumentService _documentService;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(IDocumentService documentService, ILogger<DocumentsController> logger)
        {
            _documentService = documentService;
            _logger = logger;
        }

        // POST: api/documents/upload
        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] DocumentUploadDto dto)
        {
            try
            {
                // Get user info from request headers (adjust based on your auth system)
                var uploaderEmail = Request.Headers["X-User-Email"].ToString();
                var uploaderName = Request.Headers["X-User-Name"].ToString();

                if (string.IsNullOrEmpty(uploaderEmail))
                {
                    uploaderEmail = "unknown@encadri.com";
                    uploaderName = "Unknown User";
                }

                var document = await _documentService.UploadDocumentAsync(dto, uploaderEmail, uploaderName);
                return Ok(new
                {
                    success = true,
                    document = document,
                    message = "File uploaded successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading document");
                return StatusCode(500, new { success = false, message = "Error uploading document", error = ex.Message });
            }
        }

        // GET: api/documents/project/{projectId}
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectDocuments(string projectId)
        {
            try
            {
                var documents = await _documentService.GetProjectDocumentsAsync(projectId);
                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching project documents");
                return StatusCode(500, new { message = "Error fetching documents", error = ex.Message });
            }
        }

        // GET: api/documents/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDocument(string id)
        {
            try
            {
                var document = await _documentService.GetDocumentByIdAsync(id);
                if (document == null)
                {
                    return NotFound(new { message = "Document not found" });
                }

                return Ok(document);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document");
                return StatusCode(500, new { message = "Error fetching document", error = ex.Message });
            }
        }

        // GET: api/documents/{id}/download-url
        [HttpGet("{id}/download-url")]
        public async Task<IActionResult> GetDownloadUrl(string id)
        {
            try
            {
                var document = await _documentService.GetDocumentByIdAsync(id);
                if (document == null)
                {
                    return NotFound(new { message = "Document not found" });
                }

                var sasUrl = await _documentService.GetDownloadUrlAsync(id);

                return Ok(new
                {
                    url = sasUrl,
                    expiresAt = DateTime.UtcNow.AddHours(1),
                    blobName = document.BlobName,
                    fileName = document.OriginalFileName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating download URL");
                return StatusCode(500, new { message = "Error generating download URL", error = ex.Message });
            }
        }

        // DELETE: api/documents/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(string id)
        {
            try
            {
                var result = await _documentService.DeleteDocumentAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Document not found" });
                }

                return Ok(new { message = "Document deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document");
                return StatusCode(500, new { message = "Error deleting document", error = ex.Message });
            }
        }

        // GET: api/documents/project/{projectId}/storage-info
        [HttpGet("project/{projectId}/storage-info")]
        public async Task<IActionResult> GetStorageInfo(string projectId)
        {
            try
            {
                var storageInfo = await _documentService.GetStorageInfoAsync(projectId);
                return Ok(storageInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching storage info");
                return StatusCode(500, new { message = "Error fetching storage info", error = ex.Message });
            }
        }

        // GET: api/documents/project/{projectId}/storage (alias for compatibility)
        [HttpGet("project/{projectId}/storage")]
        public async Task<IActionResult> GetStorage(string projectId)
        {
            try
            {
                var storageInfo = await _documentService.GetStorageInfoAsync(projectId);
                // Return simplified format for frontend compatibility
                return Ok(new
                {
                    totalSize = storageInfo.TotalSizeBytes,
                    documentCount = storageInfo.FileCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching storage info");
                return StatusCode(500, new { message = "Error fetching storage info", error = ex.Message });
            }
        }
    }
}

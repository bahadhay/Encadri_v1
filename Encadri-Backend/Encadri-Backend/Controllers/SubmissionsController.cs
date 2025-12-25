using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;
using Encadri_Backend.Data;
using Encadri_Backend.Services;
using Encadri_Backend.Helpers;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubmissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationHelperService _notificationService;
        private readonly IAzureBlobStorageService _azureBlobStorageService;

        public SubmissionsController(
            ApplicationDbContext context,
            NotificationHelperService notificationService,
            IAzureBlobStorageService azureBlobStorageService)
        {
            _context = context;
            _notificationService = notificationService;
            _azureBlobStorageService = azureBlobStorageService;
        }

        /// <summary>
        /// Get all submissions filtered by user role
        /// Students see only their own submissions
        /// Supervisors see submissions from students in their projects
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Submission>>> GetAll(
            [FromQuery] string? projectId = null,
            [FromQuery] string? userEmail = null,
            [FromQuery] string? userRole = null)
        {
            var submissions = _context.Submissions.AsQueryable();

            // Filter by project if specified
            if (!string.IsNullOrEmpty(projectId))
            {
                submissions = submissions.Where(s => s.ProjectId == projectId);
            }

            // Filter by user role and email
            if (!string.IsNullOrEmpty(userEmail) && !string.IsNullOrEmpty(userRole))
            {
                if (userRole.ToLower() == "student")
                {
                    // Students see only their own submissions
                    submissions = submissions.Where(s => s.SubmittedBy == userEmail);
                }
                else if (userRole.ToLower() == "supervisor")
                {
                    // Supervisors see submissions from students in projects they supervise
                    var supervisedProjectIds = await _context.Projects
                        .Where(p => p.SupervisorEmail == userEmail)
                        .Select(p => p.Id)
                        .ToListAsync();

                    submissions = submissions.Where(s => supervisedProjectIds.Contains(s.ProjectId));
                }
            }

            return Ok(await submissions.OrderByDescending(s => s.CreatedDate).ToListAsync());
        }

        /// <summary>
        /// Get submission by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Submission>> GetById(string id)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null)
            {
                return NotFound();
            }
            return Ok(submission);
        }

        /// <summary>
        /// Create a new submission
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Submission>> Create([FromBody] Submission submission)
        {
            submission.Id = Guid.NewGuid().ToString();
            submission.CreatedDate = DateTime.UtcNow;
            submission.UpdatedDate = DateTime.UtcNow;
            submission.DueDate = DateTimeHelper.EnsureUtc(submission.DueDate);

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            // Get project to find supervisor
            var project = await _context.Projects.FindAsync(submission.ProjectId);
            if (project != null)
            {
                // Get student name
                var student = await _context.Users.FirstOrDefaultAsync(u => u.Email == submission.SubmittedBy);
                var studentName = student?.FullName ?? "A student";

                // Notify supervisor about new submission
                await _notificationService.NotifySubmissionCreated(
                    project.SupervisorEmail,
                    studentName,
                    submission.Title,
                    submission.Id
                );
            }

            return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
        }

        /// <summary>
        /// Update an existing submission
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Submission>> Update(string id, [FromBody] Submission updatedSubmission)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null)
            {
                return NotFound();
            }

            // Check if submission was evaluated (status changed or feedback/grade added)
            bool wasEvaluated = false;
            if (submission.Status != updatedSubmission.Status &&
                (updatedSubmission.Status == "Graded" || updatedSubmission.Status == "Reviewed"))
            {
                wasEvaluated = true;
            }
            else if (!string.IsNullOrEmpty(updatedSubmission.Feedback) &&
                     string.IsNullOrEmpty(submission.Feedback))
            {
                wasEvaluated = true;
            }

            submission.Title = updatedSubmission.Title;
            submission.Description = updatedSubmission.Description;
            submission.Type = updatedSubmission.Type;
            submission.FileUrl = updatedSubmission.FileUrl;
            submission.Status = updatedSubmission.Status;
            submission.Feedback = updatedSubmission.Feedback;
            submission.Grade = updatedSubmission.Grade;
            submission.DueDate = DateTimeHelper.EnsureUtc(updatedSubmission.DueDate);
            submission.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify student if submission was evaluated
            if (wasEvaluated)
            {
                await _notificationService.NotifySubmissionEvaluated(
                    submission.SubmittedBy,
                    submission.Title,
                    submission.Id
                );
            }

            return Ok(submission);
        }

        /// <summary>
        /// Delete a submission
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var submission = await _context.Submissions.FindAsync(id);
            if (submission == null)
            {
                return NotFound();
            }

            _context.Submissions.Remove(submission);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        /// <summary>
        /// Upload a file to Azure Blob Storage
        /// </summary>
        [HttpPost("upload")]
        public async Task<ActionResult<object>> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "No file uploaded." });
            }

            try
            {
                // Upload to Azure Blob Storage
                using (var stream = file.OpenReadStream())
                {
                    var blobName = await _azureBlobStorageService.UploadFileAsync(
                        stream,
                        file.FileName,
                        file.ContentType ?? "application/octet-stream"
                    );

                    // Generate a SAS URL that expires in 24 hours for immediate access
                    var sasUrl = await _azureBlobStorageService.GetBlobSasUrlAsync(blobName, 1440);

                    // Return both the blob name (to store in DB) and SAS URL (for immediate display)
                    return Ok(new
                    {
                        url = blobName,        // Store this in the database
                        sasUrl = sasUrl,       // Use this for immediate file access/display
                        fileName = file.FileName
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "File upload failed", details = ex.Message });
            }
        }

        /// <summary>
        /// Download a submission file from Azure Blob Storage
        /// </summary>
        [HttpGet("download/{blobName}")]
        public async Task<ActionResult> Download(string blobName)
        {
            try
            {
                if (!await _azureBlobStorageService.FileExistsAsync(blobName))
                {
                    return NotFound(new { error = "File not found" });
                }

                // Generate SAS URL for download
                var sasUrl = await _azureBlobStorageService.GetBlobSasUrlAsync(blobName, 60);

                // Redirect to the SAS URL
                return Redirect(sasUrl);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Download failed", details = ex.Message });
            }
        }

        /// <summary>
        /// Get temporary access URL for a submission file
        /// </summary>
        [HttpGet("file-url/{blobName}")]
        public async Task<ActionResult<object>> GetFileUrl(string blobName)
        {
            try
            {
                if (!await _azureBlobStorageService.FileExistsAsync(blobName))
                {
                    return NotFound(new { error = "File not found" });
                }

                // Generate SAS URL valid for 1 hour
                var sasUrl = await _azureBlobStorageService.GetBlobSasUrlAsync(blobName, 60);

                return Ok(new { url = sasUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to generate file URL", details = ex.Message });
            }
        }
    }
}

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
    public class MeetingRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationHelperService _notificationService;
        private readonly IAzureBlobStorageService _blobStorageService;

        public MeetingRequestsController(
            ApplicationDbContext context,
            NotificationHelperService notificationService,
            IAzureBlobStorageService blobStorageService)
        {
            _context = context;
            _notificationService = notificationService;
            _blobStorageService = blobStorageService;
        }

        /// <summary>
        /// Get all meeting requests (with optional filtering)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MeetingRequest>>> GetAll(
            [FromQuery] string? studentEmail = null,
            [FromQuery] string? supervisorEmail = null,
            [FromQuery] string? status = null,
            [FromQuery] string? projectId = null)
        {
            var requests = _context.MeetingRequests.AsQueryable();

            if (!string.IsNullOrEmpty(studentEmail))
                requests = requests.Where(r => r.StudentEmail == studentEmail);

            if (!string.IsNullOrEmpty(supervisorEmail))
                requests = requests.Where(r => r.SupervisorEmail == supervisorEmail);

            if (!string.IsNullOrEmpty(status))
                requests = requests.Where(r => r.Status == status);

            if (!string.IsNullOrEmpty(projectId))
                requests = requests.Where(r => r.ProjectId == projectId);

            return Ok(await requests.OrderByDescending(r => r.CreatedDate).ToListAsync());
        }

        /// <summary>
        /// Get meeting request by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<MeetingRequest>> GetById(string id)
        {
            var request = await _context.MeetingRequests.FindAsync(id);
            if (request == null)
                return NotFound();

            return Ok(request);
        }

        /// <summary>
        /// Create a new meeting request (Student)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<MeetingRequest>> Create([FromBody] MeetingRequest request)
        {
            request.Id = Guid.NewGuid().ToString();
            request.Status = "pending";
            request.CreatedDate = DateTime.UtcNow;
            request.UpdatedDate = DateTime.UtcNow;
            request.PreferredDate = DateTimeHelper.EnsureUtc(request.PreferredDate);

            _context.MeetingRequests.Add(request);
            await _context.SaveChangesAsync();

            // Get student name for notification
            var student = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.StudentEmail);
            var studentName = student?.FullName ?? request.StudentEmail;

            // Notify supervisor
            await _notificationService.NotifyMeetingRequestReceived(
                request.SupervisorEmail,
                studentName,
                request.Title ?? "Meeting",
                request.Id
            );

            return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
        }

        /// <summary>
        /// Approve meeting request and create meeting (Supervisor)
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<ActionResult<Meeting>> ApproveRequest(string id, [FromBody] ApproveRequestDto? dto)
        {
            var request = await _context.MeetingRequests.FindAsync(id);
            if (request == null)
                return NotFound();

            if (request.Status != "pending")
                return BadRequest("Only pending requests can be approved");

            // Use the scheduled date from DTO if provided, otherwise use the preferred date from request
            var scheduledDate = dto?.ScheduledDate ?? request.PreferredDate;

            // Create the meeting
            var meeting = new Meeting
            {
                Id = Guid.NewGuid().ToString(),
                ProjectId = request.ProjectId,
                Title = request.Title,
                ScheduledAt = DateTimeHelper.EnsureUtc(scheduledDate),
                DurationMinutes = request.DurationMinutes ?? 60,
                Agenda = request.Agenda,
                Status = "confirmed",
                RequestedBy = request.StudentEmail,
                StudentEmail = request.StudentEmail,
                SupervisorEmail = request.SupervisorEmail,
                MeetingType = "virtual",
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };

            _context.Meetings.Add(meeting);

            // Update request status
            request.Status = "approved";
            request.MeetingId = meeting.Id;
            request.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify student
            await _notificationService.NotifyMeetingRequestApproved(
                request.StudentEmail,
                request.Title ?? "Meeting",
                meeting.ScheduledAt,
                meeting.Id
            );

            return Ok(meeting);
        }

        public class ApproveRequestDto
        {
            public DateTime? ScheduledDate { get; set; }
        }

        /// <summary>
        /// Reject meeting request (Supervisor)
        /// </summary>
        [HttpPost("{id}/reject")]
        public async Task<ActionResult> RejectRequest(string id, [FromBody] RejectRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Reason))
                return BadRequest("Rejection reason is required");

            var request = await _context.MeetingRequests.FindAsync(id);
            if (request == null)
                return NotFound();

            if (request.Status != "pending")
                return BadRequest("Only pending requests can be rejected");

            request.Status = "rejected";
            request.RejectionReason = dto.Reason;
            request.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify student
            await _notificationService.NotifyMeetingRequestRejected(
                request.StudentEmail,
                request.Title ?? "Meeting",
                dto.Reason
            );

            return Ok();
        }

        public class RejectRequestDto
        {
            public string Reason { get; set; } = string.Empty;
        }

        /// <summary>
        /// Upload document for meeting request
        /// </summary>
        [HttpPost("{id}/upload-document")]
        public async Task<ActionResult> UploadDocument(string id, IFormFile file)
        {
            var request = await _context.MeetingRequests.FindAsync(id);
            if (request == null)
                return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            try
            {
                using var stream = file.OpenReadStream();
                var blobName = await _blobStorageService.UploadFileAsync(
                    stream,
                    file.FileName,
                    file.ContentType
                );

                // Add to document list
                if (request.DocumentUrls == null)
                    request.DocumentUrls = new List<string>();

                request.DocumentUrls.Add(blobName);
                request.UpdatedDate = DateTime.UtcNow;

                // Save document metadata
                var document = new MeetingDocument
                {
                    Id = Guid.NewGuid().ToString(),
                    MeetingRequestId = request.Id,
                    MeetingId = request.MeetingId ?? "",
                    FileName = file.FileName,
                    BlobUrl = blobName,
                    FileSize = file.Length,
                    ContentType = file.ContentType,
                    UploadedBy = request.StudentEmail,
                    CreatedDate = DateTime.UtcNow
                };

                _context.MeetingDocuments.Add(document);
                await _context.SaveChangesAsync();

                return Ok(new { blobName, documentId = document.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error uploading file: {ex.Message}");
            }
        }

        /// <summary>
        /// Delete meeting request
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var request = await _context.MeetingRequests.FindAsync(id);
            if (request == null)
                return NotFound();

            _context.MeetingRequests.Remove(request);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

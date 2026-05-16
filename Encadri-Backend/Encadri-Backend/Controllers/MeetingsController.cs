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
    public class MeetingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationHelperService _notificationService;

        public MeetingsController(ApplicationDbContext context, NotificationHelperService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Get all meetings (with optional filtering)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Meeting>>> GetAll(
            [FromQuery] string? projectId = null,
            [FromQuery] string? userEmail = null,
            [FromQuery] string? status = null,
            [FromQuery] bool upcomingOnly = false)
        {
            var meetings = _context.Meetings.AsQueryable();

            if (!string.IsNullOrEmpty(projectId))
                meetings = meetings.Where(m => m.ProjectId == projectId);

            if (!string.IsNullOrEmpty(userEmail))
                meetings = meetings.Where(m => m.StudentEmail == userEmail || m.SupervisorEmail == userEmail);

            if (!string.IsNullOrEmpty(status))
                meetings = meetings.Where(m => m.Status == status);

            var meetingList = await meetings.OrderByDescending(m => m.ScheduledAt).ToListAsync();

            // Apply grace period logic for upcomingOnly filter
            if (upcomingOnly)
            {
                meetingList = meetingList.Where(m => m.IsUpcoming()).ToList();
            }

            return Ok(meetingList);
        }

        /// <summary>
        /// Get meeting by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Meeting>> GetById(string id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
            {
                return NotFound();
            }
            return Ok(meeting);
        }

        /// <summary>
        /// Create a new meeting
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Meeting>> Create([FromBody] Meeting meeting)
        {
            meeting.Id = Guid.NewGuid().ToString();
            meeting.CreatedDate = DateTime.UtcNow;
            meeting.UpdatedDate = DateTime.UtcNow;
            meeting.ScheduledAt = DateTimeHelper.EnsureUtc(meeting.ScheduledAt);

            _context.Meetings.Add(meeting);
            await _context.SaveChangesAsync();

            // Get project participants to notify
            var project = await _context.Projects.FindAsync(meeting.ProjectId);
            if (project != null)
            {
                var participantEmails = new List<string> { project.SupervisorEmail };

                // Add all students from the project
                if (!string.IsNullOrEmpty(project.StudentEmail))
                {
                    participantEmails.Add(project.StudentEmail);
                }

                // Notify all participants about the meeting
                await _notificationService.NotifyMeetingScheduled(
                    participantEmails,
                    meeting.Title,
                    meeting.ScheduledAt,
                    meeting.Id
                );
            }

            return CreatedAtAction(nameof(GetById), new { id = meeting.Id }, meeting);
        }

        /// <summary>
        /// Update an existing meeting
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Meeting>> Update(string id, [FromBody] Meeting updatedMeeting)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
            {
                return NotFound();
            }

            meeting.Title = updatedMeeting.Title;
            meeting.ScheduledAt = DateTimeHelper.EnsureUtc(updatedMeeting.ScheduledAt);
            meeting.DurationMinutes = updatedMeeting.DurationMinutes;
            meeting.Location = updatedMeeting.Location;
            meeting.Status = updatedMeeting.Status;
            meeting.Agenda = updatedMeeting.Agenda;
            meeting.Notes = updatedMeeting.Notes;
            meeting.RequestedBy = updatedMeeting.RequestedBy;
            meeting.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(meeting);
        }

        /// <summary>
        /// Delete a meeting
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var meeting = await _context.Meetings.FindAsync(id);
            if (meeting == null)
            {
                return NotFound();
            }

            // Get project participants to notify about cancellation
            var project = await _context.Projects.FindAsync(meeting.ProjectId);
            if (project != null)
            {
                var participantEmails = new List<string> { project.SupervisorEmail };

                if (!string.IsNullOrEmpty(project.StudentEmail))
                {
                    participantEmails.Add(project.StudentEmail);
                }

                // Notify all participants about meeting cancellation
                await _notificationService.NotifyMeetingCancelled(
                    participantEmails,
                    meeting.Title
                );
            }

            _context.Meetings.Remove(meeting);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Bulk create meeting invitations for all students (Supervisor)
        /// </summary>
        [HttpPost("bulk-invite")]
        public async Task<ActionResult<List<Meeting>>> BulkInvite([FromBody] BulkMeetingInviteRequest request)
        {
            var supervisor = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.SupervisorEmail);
            if (supervisor == null || supervisor.UserRole != "supervisor")
                return BadRequest("Invalid supervisor");

            // Get all students assigned to this supervisor's projects
            var projects = await _context.Projects
                .Where(p => p.SupervisorEmail == request.SupervisorEmail && !string.IsNullOrEmpty(p.StudentEmail))
                .ToListAsync();

            var studentEmails = projects.Select(p => p.StudentEmail).Distinct().ToList();
            var createdMeetings = new List<Meeting>();

            foreach (var studentEmail in studentEmails)
            {
                var studentProject = projects.FirstOrDefault(p => p.StudentEmail == studentEmail);
                if (studentProject == null) continue;

                var meeting = new Meeting
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = studentProject.Id,
                    Title = request.Title,
                    ScheduledAt = DateTimeHelper.EnsureUtc(request.ScheduledAt),
                    DurationMinutes = request.DurationMinutes ?? 60,
                    Location = request.Location,
                    Agenda = request.Agenda,
                    Status = "pending",
                    StudentEmail = studentEmail,
                    SupervisorEmail = request.SupervisorEmail,
                    MeetingType = request.MeetingType ?? "virtual",
                    RequestedBy = request.SupervisorEmail,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                };

                _context.Meetings.Add(meeting);
                createdMeetings.Add(meeting);
            }

            await _context.SaveChangesAsync();

            // Send bulk notifications
            await _notificationService.NotifyBulkMeetingInvitation(
                studentEmails,
                request.Title,
                request.ScheduledAt,
                createdMeetings.FirstOrDefault()?.Id ?? ""
            );

            return Ok(createdMeetings);
        }

        /// <summary>
        /// Get upcoming meetings for a user (includes meetings in grace period)
        /// </summary>
        [HttpGet("upcoming/{userEmail}")]
        public async Task<ActionResult<IEnumerable<Meeting>>> GetUpcoming(string userEmail, [FromQuery] int hours = 168)
        {
            var now = DateTime.UtcNow;
            var futureTime = now.AddHours(hours);

            // Get meetings in the time window (with buffer for grace period)
            var meetings = await _context.Meetings
                .Where(m => (m.StudentEmail == userEmail || m.SupervisorEmail == userEmail)
                    && m.ScheduledAt <= futureTime
                    && m.Status != "cancelled")
                .OrderBy(m => m.ScheduledAt)
                .ToListAsync();

            // Filter using grace period logic (meetings that are upcoming OR in grace period)
            var upcomingMeetings = meetings.Where(m => m.IsUpcoming()).ToList();

            return Ok(upcomingMeetings);
        }

        /// <summary>
        /// Get meetings currently in progress (joinable now) for a user
        /// </summary>
        [HttpGet("in-progress/{userEmail}")]
        public async Task<ActionResult<IEnumerable<Meeting>>> GetInProgress(string userEmail)
        {
            var meetings = await _context.Meetings
                .Where(m => (m.StudentEmail == userEmail || m.SupervisorEmail == userEmail)
                    && m.Status != "cancelled"
                    && m.Status != "completed")
                .OrderBy(m => m.ScheduledAt)
                .ToListAsync();

            // Filter to only joinable meetings (can join early or in progress/grace period)
            var inProgressMeetings = meetings.Where(m => m.IsJoinable()).ToList();

            return Ok(inProgressMeetings);
        }
    }

    /// <summary>
    /// Bulk Meeting Invite Request DTO
    /// </summary>
    public class BulkMeetingInviteRequest
    {
        public string SupervisorEmail { get; set; }
        public string Title { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int? DurationMinutes { get; set; }
        public string? Location { get; set; }
        public string? Agenda { get; set; }
        public string? MeetingType { get; set; }
    }
}

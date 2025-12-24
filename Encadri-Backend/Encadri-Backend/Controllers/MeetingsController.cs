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
        /// Get all meetings
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Meeting>>> GetAll([FromQuery] string? projectId = null)
        {
            var meetings = _context.Meetings.AsQueryable();

            if (!string.IsNullOrEmpty(projectId))
            {
                meetings = meetings.Where(m => m.ProjectId == projectId);
            }

            return Ok(await meetings.ToListAsync());
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
    }
}

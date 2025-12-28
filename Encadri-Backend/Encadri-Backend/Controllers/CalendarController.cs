using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Data;
using Encadri_Backend.Helpers;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalendarController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CalendarController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all calendar events for a user (meetings, submissions, milestones)
        /// </summary>
        [HttpGet("events")]
        public async Task<ActionResult<IEnumerable<CalendarEvent>>> GetEvents(
            [FromQuery] string userEmail,
            [FromQuery] string? userRole = null,
            [FromQuery] DateTime? start = null,
            [FromQuery] DateTime? end = null)
        {
            if (string.IsNullOrEmpty(userEmail))
            {
                return BadRequest("userEmail is required");
            }

            var events = new List<CalendarEvent>();

            // Get user's projects
            var userProjects = await _context.Projects
                .Where(p => p.StudentEmail == userEmail || p.SupervisorEmail == userEmail)
                .Select(p => p.Id)
                .ToListAsync();

            // 1. Get Meetings
            var meetingsQuery = _context.Meetings
                .Where(m => m.StudentEmail == userEmail || m.SupervisorEmail == userEmail);

            if (start.HasValue)
                meetingsQuery = meetingsQuery.Where(m => m.ScheduledAt >= start.Value);
            if (end.HasValue)
                meetingsQuery = meetingsQuery.Where(m => m.ScheduledAt <= end.Value);

            var meetings = await meetingsQuery.ToListAsync();
            foreach (var meeting in meetings)
            {
                // Get project name
                var project = await _context.Projects.FindAsync(meeting.ProjectId);
                var projectName = project?.Title ?? "Unknown Project";

                events.Add(new CalendarEvent
                {
                    Id = meeting.Id,
                    Title = meeting.Title,
                    Start = meeting.ScheduledAt,
                    End = meeting.ScheduledAt.AddHours(1), // Default 1 hour duration
                    Type = "meeting",
                    Color = meeting.Status == "cancelled" ? "#9CA3AF" : "#3B82F6",
                    Description = meeting.Agenda,
                    Location = meeting.Location,
                    Status = meeting.Status,
                    ProjectId = meeting.ProjectId,
                    ProjectName = projectName
                });
            }

            // 2. Get Submission Deadlines
            var submissionsQuery = _context.Submissions
                .Where(s => userProjects.Contains(s.ProjectId) && s.DueDate.HasValue);

            if (start.HasValue)
                submissionsQuery = submissionsQuery.Where(s => s.DueDate >= start.Value);
            if (end.HasValue)
                submissionsQuery = submissionsQuery.Where(s => s.DueDate <= end.Value);

            var submissions = await submissionsQuery.ToListAsync();
            foreach (var submission in submissions)
            {
                var isPastDue = submission.DueDate < DateTime.UtcNow && submission.Status == "pending";

                // Get project name
                var project = await _context.Projects.FindAsync(submission.ProjectId);
                var projectName = project?.Title ?? "Unknown Project";

                events.Add(new CalendarEvent
                {
                    Id = submission.Id,
                    Title = $"📄 {submission.Title}",
                    Start = submission.DueDate.Value,
                    End = submission.DueDate.Value,
                    Type = "submission",
                    Color = isPastDue ? "#EF4444" : "#F97316",
                    Description = submission.Description,
                    Status = submission.Status,
                    ProjectId = submission.ProjectId,
                    ProjectName = projectName,
                    AllDay = true
                });
            }

            // 3. Get Milestone Deadlines with Project Names
            var milestonesQuery = _context.Milestones
                .Where(m => userProjects.Contains(m.ProjectId));

            if (start.HasValue)
                milestonesQuery = milestonesQuery.Where(m => m.DueDate >= start.Value);
            if (end.HasValue)
                milestonesQuery = milestonesQuery.Where(m => m.DueDate <= end.Value);

            var milestones = await milestonesQuery.ToListAsync();
            foreach (var milestone in milestones)
            {
                var isOverdue = milestone.DueDate < DateTime.UtcNow && milestone.Status != "completed";
                var isCompleted = milestone.Status == "completed";

                // Get project name
                var project = await _context.Projects.FindAsync(milestone.ProjectId);
                var projectName = project?.Title ?? "Unknown Project";

                events.Add(new CalendarEvent
                {
                    Id = milestone.Id,
                    Title = $"🎯 {milestone.Title}",
                    Start = milestone.DueDate,
                    End = milestone.DueDate,
                    Type = "milestone",
                    Color = isCompleted ? "#10B981" : (isOverdue ? "#EF4444" : "#8B5CF6"),
                    Description = milestone.Description,
                    Status = milestone.Status,
                    ProjectId = milestone.ProjectId,
                    ProjectName = projectName,
                    AllDay = true
                });
            }

            // Sort by start date
            return Ok(events.OrderBy(e => e.Start));
        }
    }

    /// <summary>
    /// Calendar Event DTO
    /// </summary>
    public class CalendarEvent
    {
        public string? Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public string Type { get; set; } = string.Empty; // meeting, submission, milestone
        public string Color { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Location { get; set; }
        public string? Status { get; set; }
        public string? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public bool AllDay { get; set; } = false;
    }
}

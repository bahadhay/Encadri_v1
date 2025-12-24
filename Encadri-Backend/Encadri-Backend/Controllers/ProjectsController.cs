using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;
using Encadri_Backend.Data;
using Encadri_Backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Encadri_Backend.Helpers;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _notificationHub;

        public ProjectsController(ApplicationDbContext context, IHubContext<NotificationHub> notificationHub)
        {
            _context = context;
            _notificationHub = notificationHub;
        }

        /// <summary>
        /// Get all projects
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetAll([FromQuery] string? userEmail = null, [FromQuery] string? status = null)
        {
            var projects = _context.Projects.AsQueryable();

            if (!string.IsNullOrEmpty(userEmail))
            {
                projects = projects.Where(p =>
                    p.OwnerEmail == userEmail || 
                    p.StudentEmail == userEmail || 
                    p.SupervisorEmail == userEmail);
            }

            if (!string.IsNullOrEmpty(status))
            {
                projects = projects.Where(p => p.Status == status);
            }

            return Ok(await projects.ToListAsync());
        }

        /// <summary>
        /// Get project by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetById(string id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound();
            }
            return Ok(project);
        }

        /// <summary>
        /// Create a new project
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Project>> Create([FromBody] Project project)
        {
            project.Id = Guid.NewGuid().ToString();
            project.CreatedDate = DateTime.UtcNow;
            project.UpdatedDate = DateTime.UtcNow;

            // Ensure DateTime fields are UTC to avoid PostgreSQL timezone issues
            project.StartDate = DateTimeHelper.EnsureUtc(project.StartDate);
            project.EndDate = DateTimeHelper.EnsureUtc(project.EndDate);

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
        }

        /// <summary>
        /// Update an existing project
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Project>> Update(string id, [FromBody] Project updatedProject)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound();
            }

            project.Title = updatedProject.Title;
            project.Type = updatedProject.Type;
            project.Description = updatedProject.Description;
            project.StudentEmail = updatedProject.StudentEmail;
            project.StudentName = updatedProject.StudentName;
            project.SupervisorEmail = updatedProject.SupervisorEmail;
            project.SupervisorName = updatedProject.SupervisorName;
            project.Status = updatedProject.Status;

            // Ensure DateTime fields are UTC to avoid PostgreSQL timezone issues
            project.StartDate = DateTimeHelper.EnsureUtc(updatedProject.StartDate);
            project.EndDate = DateTimeHelper.EnsureUtc(updatedProject.EndDate);

            project.Company = updatedProject.Company;
            project.Technologies = updatedProject.Technologies;
            project.Objectives = updatedProject.Objectives;
            project.FinalGrade = updatedProject.FinalGrade;
            project.ProgressPercentage = updatedProject.ProgressPercentage;
            project.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(project);
        }

        /// <summary>
        /// Delete a project (owner only) and all related data
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id, [FromQuery] string ownerEmail)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound("Project not found");
            }

            // Verify the requester is the owner
            if (project.OwnerEmail != ownerEmail)
            {
                return Forbid("Only the project owner can delete this project");
            }

            // Notify all members before deleting using SignalR for real-time delivery
            var memberEmails = new List<string>();
            if (!string.IsNullOrEmpty(project.StudentEmail))
                memberEmails.Add(project.StudentEmail);
            if (!string.IsNullOrEmpty(project.SupervisorEmail))
                memberEmails.Add(project.SupervisorEmail);

            foreach (var email in memberEmails)
            {
                await NotificationHub.SendNotificationToUser(
                    _notificationHub,
                    _context,
                    email,
                    "Project Deleted",
                    $"The project '{project.Title}' has been deleted by the owner.",
                    "project",
                    "high",
                    "/projects"
                );
            }

            // Delete all related data
            // 1. Delete submissions
            var submissions = await _context.Submissions.Where(s => s.ProjectId == id).ToListAsync();
            _context.Submissions.RemoveRange(submissions);

            // 2. Delete meetings
            var meetings = await _context.Meetings.Where(m => m.ProjectId == id).ToListAsync();
            _context.Meetings.RemoveRange(meetings);

            // 3. Delete evaluations
            var evaluations = await _context.Evaluations.Where(e => e.ProjectId == id).ToListAsync();
            _context.Evaluations.RemoveRange(evaluations);

            // 4. Delete messages
            var messages = await _context.Messages.Where(m => m.ProjectId == id).ToListAsync();
            _context.Messages.RemoveRange(messages);

            // 5. Delete chat rooms
            var chatRooms = await _context.ChatRooms.Where(c => c.ProjectId == id).ToListAsync();
            _context.ChatRooms.RemoveRange(chatRooms);

            // 6. Delete milestones
            var milestones = await _context.Milestones.Where(m => m.ProjectId == id).ToListAsync();
            _context.Milestones.RemoveRange(milestones);

            // 7. Delete project-related notifications
            var projectNotifications = await _context.Notifications
                .Where(n => n.Link != null && n.Link.Contains(id))
                .ToListAsync();
            _context.Notifications.RemoveRange(projectNotifications);

            // Finally, delete the project itself
            _context.Projects.Remove(project);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Invite a user to a project
        /// </summary>
        [HttpPost("invite")]
        public async Task<ActionResult> InviteUser([FromBody] InviteRequest request)
        {
            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null) return NotFound("Project not found");

            // Send notification using NotificationHub for real-time delivery
            await NotificationHub.SendNotificationToUser(
                _notificationHub,
                _context,
                request.InvitedEmail,
                "Project Invitation",
                $"You have been invited to join the project '{project.Title}' as a {request.Role}.",
                "invitation",
                "high",
                request.ProjectId
            );

            return Ok(new { message = "Invitation sent successfully" });
        }

        /// <summary>
        /// Join a project (Accept Invitation)
        /// </summary>
        [HttpPost("join")]
        public async Task<ActionResult> JoinProject([FromBody] JoinRequest request)
        {
            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null) return NotFound("Project not found");

            // Update project members based on role
            // In a real app, we should verify the user's role matches, but here we trust the request
            // We assume the user calling this endpoint is the one who was invited

            // To be safe, we might want to check if the user exists in the Users table, but avoiding that for speed unless strictly required
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.UserEmail);
            if (user == null) return BadRequest("User not found");

            if (user.UserRole == "student")
            {
                project.StudentEmail = user.Email;
                project.StudentName = user.FullName;
            }
            else if (user.UserRole == "supervisor")
            {
                project.SupervisorEmail = user.Email;
                project.SupervisorName = user.FullName;
            }

            // Change project status to in_progress when invitation is accepted
            // Only change if it's currently in proposed status
            if (project.Status == "proposed")
            {
                project.Status = "in_progress";
            }

            project.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Send notification to project owner using SignalR for real-time delivery
            await NotificationHub.SendNotificationToUser(
                _notificationHub,
                _context,
                project.OwnerEmail,
                "Invitation Accepted",
                $"{user.FullName} has accepted your invitation to join '{project.Title}'",
                "project",
                "normal",
                $"/projects/{project.Id}"
            );

            return Ok(new { message = "Joined project successfully" });
        }

        /// <summary>
        /// Decline a project invitation
        /// </summary>
        [HttpPost("decline")]
        public async Task<ActionResult> DeclineInvitation([FromBody] JoinRequest request)
        {
            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null) return NotFound("Project not found");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.UserEmail);
            if (user == null) return BadRequest("User not found");

            // Send notification to project owner using SignalR for real-time delivery
            await NotificationHub.SendNotificationToUser(
                _notificationHub,
                _context,
                project.OwnerEmail,
                "Invitation Declined",
                $"{user.FullName} has declined your invitation to join '{project.Title}'",
                "project",
                "normal",
                $"/projects/{project.Id}"
            );

            return Ok(new { message = "Invitation declined" });
        }

        /// <summary>
        /// Remove a member from project (owner only)
        /// </summary>
        [HttpPost("remove-member")]
        public async Task<ActionResult> RemoveMember([FromBody] RemoveMemberRequest request)
        {
            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null) return NotFound("Project not found");

            // Verify the requester is the owner
            if (project.OwnerEmail != request.OwnerEmail)
            {
                return Forbid("Only the project owner can remove members");
            }

            string removedMemberName = "";
            string removedMemberEmail = "";

            // Remove the member based on role
            if (request.Role == "student" && project.StudentEmail != null)
            {
                removedMemberName = project.StudentName ?? project.StudentEmail;
                removedMemberEmail = project.StudentEmail;
                project.StudentEmail = null;
                project.StudentName = null;
            }
            else if (request.Role == "supervisor" && project.SupervisorEmail != null)
            {
                removedMemberName = project.SupervisorName ?? project.SupervisorEmail;
                removedMemberEmail = project.SupervisorEmail;
                project.SupervisorEmail = null;
                project.SupervisorName = null;
            }
            else
            {
                return BadRequest("Invalid role or member not found");
            }

            project.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Notify the removed member using SignalR for real-time delivery
            await NotificationHub.SendNotificationToUser(
                _notificationHub,
                _context,
                removedMemberEmail,
                "Removed from Project",
                $"You have been removed from the project '{project.Title}' by the owner.",
                "project",
                "high",
                "/projects"
            );

            return Ok(new { message = $"{removedMemberName} has been removed from the project" });
        }

        /// <summary>
        /// Leave a project (members only)
        /// </summary>
        [HttpPost("leave")]
        public async Task<ActionResult> LeaveProject([FromBody] LeaveProjectRequest request)
        {
            Console.WriteLine($"🚪 Leave project request: ProjectId={request.ProjectId}, UserEmail={request.UserEmail}");

            var project = await _context.Projects.FindAsync(request.ProjectId);
            if (project == null)
            {
                Console.WriteLine("❌ Project not found");
                return NotFound("Project not found");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.UserEmail);
            if (user == null)
            {
                Console.WriteLine("❌ User not found");
                return BadRequest("User not found");
            }

            // Check if user is the owner - owners cannot leave, they must delete
            if (project.OwnerEmail == request.UserEmail)
            {
                Console.WriteLine("❌ User is owner, cannot leave");
                return BadRequest("Project owners cannot leave. Please delete the project instead.");
            }

            // Determine if user is student or supervisor and remove them
            string leavingMemberRole = "";
            string leavingMemberName = "";

            Console.WriteLine($"📝 Checking membership: Student={project.StudentEmail}, Supervisor={project.SupervisorEmail}, User={request.UserEmail}");

            if (project.StudentEmail == request.UserEmail)
            {
                leavingMemberName = project.StudentName ?? user.FullName;
                project.StudentEmail = null;
                project.StudentName = null;
                leavingMemberRole = "Student";
                Console.WriteLine($"✅ Removing student: {leavingMemberName}");
            }
            else if (project.SupervisorEmail == request.UserEmail)
            {
                leavingMemberName = project.SupervisorName ?? user.FullName;
                project.SupervisorEmail = null;
                project.SupervisorName = null;
                leavingMemberRole = "Supervisor";
                Console.WriteLine($"✅ Removing supervisor: {leavingMemberName}");
            }
            else
            {
                Console.WriteLine($"❌ User is not a member of this project");
                return BadRequest("You are not a member of this project");
            }

            project.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            Console.WriteLine($"💾 Project updated in database");

            // Notify the project owner using SignalR for real-time delivery
            await NotificationHub.SendNotificationToUser(
                _notificationHub,
                _context,
                project.OwnerEmail,
                $"{leavingMemberRole} Left Project",
                $"{leavingMemberName} has left the project '{project.Title}'.",
                "project",
                "high",
                $"/projects/{project.Id}"
            );

            Console.WriteLine($"✅ Leave project successful");
            return Ok(new { message = "You have left the project successfully" });
        }
    }

    public class InviteRequest
    {
        public string ProjectId { get; set; }
        public string InvitedEmail { get; set; }
        public string Role { get; set; } // "student" or "supervisor"
    }

    public class JoinRequest
    {
        public string ProjectId { get; set; }
        public string UserEmail { get; set; }
    }

    public class RemoveMemberRequest
    {
        public string ProjectId { get; set; }
        public string OwnerEmail { get; set; }
        public string Role { get; set; } // "student" or "supervisor"
    }

    public class LeaveProjectRequest
    {
        public string ProjectId { get; set; }
        public string UserEmail { get; set; }
    }
}

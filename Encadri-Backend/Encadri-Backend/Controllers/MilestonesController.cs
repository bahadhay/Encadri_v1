using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Data;
using Encadri_Backend.Models;
using Encadri_Backend.Helpers;
using Microsoft.AspNetCore.Authorization;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MilestonesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MilestonesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all milestones (filtered by user's accessible projects)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Milestone>>> GetAll([FromQuery] string? projectId = null, [FromQuery] string? userEmail = null)
        {
            var milestones = _context.Milestones.AsQueryable();

            // Filter by specific project if provided
            if (!string.IsNullOrEmpty(projectId))
            {
                milestones = milestones.Where(m => m.ProjectId == projectId);
            }

            // Filter by user's accessible projects if userEmail is provided
            if (!string.IsNullOrEmpty(userEmail))
            {
                // Join with Projects to filter milestones from projects the user has access to
                var userProjectIds = _context.Projects
                    .Where(p => p.OwnerEmail == userEmail ||
                               p.StudentEmail == userEmail ||
                               p.SupervisorEmail == userEmail)
                    .Select(p => p.Id);

                milestones = milestones.Where(m => userProjectIds.Contains(m.ProjectId));
            }

            return Ok(await milestones.OrderBy(m => m.Order ?? 0).ToListAsync());
        }

        /// <summary>
        /// Get milestone by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Milestone>> GetById(string id)
        {
            var milestone = await _context.Milestones.FindAsync(id);
            if (milestone == null)
            {
                return NotFound();
            }
            return Ok(milestone);
        }

        /// <summary>
        /// Create a new milestone
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Milestone>> Create([FromBody] Milestone milestone)
        {
            milestone.Id = Guid.NewGuid().ToString();
            milestone.CreatedDate = DateTime.UtcNow;
            milestone.UpdatedDate = DateTime.UtcNow;
            milestone.StartDate = DateTimeHelper.EnsureUtc(milestone.StartDate);
            milestone.DueDate = DateTimeHelper.EnsureUtc(milestone.DueDate);
            milestone.CompletedDate = DateTimeHelper.EnsureUtc(milestone.CompletedDate);
            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = milestone.Id }, milestone);
        }

        /// <summary>
        /// Update an existing milestone
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Milestone>> Update(string id, [FromBody] Milestone updatedMilestone)
        {
            var milestone = await _context.Milestones.FindAsync(id);
            if (milestone == null)
            {
                return NotFound();
            }

            milestone.Title = updatedMilestone.Title;
            milestone.Description = updatedMilestone.Description;
            milestone.StartDate = DateTimeHelper.EnsureUtc(updatedMilestone.StartDate);
            milestone.DueDate = DateTimeHelper.EnsureUtc(updatedMilestone.DueDate);
            milestone.Status = updatedMilestone.Status;
            milestone.CompletedDate = DateTimeHelper.EnsureUtc(updatedMilestone.CompletedDate);
            milestone.Order = updatedMilestone.Order;
            milestone.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(milestone);
        }

        /// <summary>
        /// Delete a milestone
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var milestone = await _context.Milestones.FindAsync(id);
            if (milestone == null)
            {
                return NotFound();
            }

            _context.Milestones.Remove(milestone);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

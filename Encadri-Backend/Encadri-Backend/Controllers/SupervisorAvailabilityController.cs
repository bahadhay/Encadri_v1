using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;
using Encadri_Backend.Data;
using Encadri_Backend.Helpers;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupervisorAvailabilityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SupervisorAvailabilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all availability slots (with optional supervisor filter)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupervisorAvailability>>> GetAll(
            [FromQuery] string? supervisorEmail = null,
            [FromQuery] bool activeOnly = true)
        {
            var availabilities = _context.SupervisorAvailabilities.AsQueryable();

            if (!string.IsNullOrEmpty(supervisorEmail))
                availabilities = availabilities.Where(a => a.SupervisorEmail == supervisorEmail);

            if (activeOnly)
                availabilities = availabilities.Where(a => a.IsActive);

            return Ok(await availabilities.OrderBy(a => a.DayOfWeek).ThenBy(a => a.StartTime).ToListAsync());
        }

        /// <summary>
        /// Get availability by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<SupervisorAvailability>> GetById(string id)
        {
            var availability = await _context.SupervisorAvailabilities.FindAsync(id);
            if (availability == null)
                return NotFound();

            return Ok(availability);
        }

        /// <summary>
        /// Get supervisor's weekly schedule
        /// </summary>
        [HttpGet("weekly/{supervisorEmail}")]
        public async Task<ActionResult<object>> GetWeeklySchedule(string supervisorEmail)
        {
            var availabilities = await _context.SupervisorAvailabilities
                .Where(a => a.SupervisorEmail == supervisorEmail && a.IsActive && a.IsRecurring)
                .OrderBy(a => a.DayOfWeek)
                .ThenBy(a => a.StartTime)
                .ToListAsync();

            var groupedByDay = availabilities.GroupBy(a => a.DayOfWeek)
                .Select(g => new
                {
                    Day = g.Key,
                    Slots = g.Select(a => new
                    {
                        a.Id,
                        StartTime = a.StartTime.ToString(@"hh\:mm"),
                        EndTime = a.EndTime.ToString(@"hh\:mm"),
                        a.MeetingType,
                        a.Location
                    })
                })
                .ToList();

            return Ok(groupedByDay);
        }

        /// <summary>
        /// Create availability slot (Supervisor)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<SupervisorAvailability>> Create([FromBody] SupervisorAvailability availability)
        {
            availability.Id = Guid.NewGuid().ToString();
            availability.IsActive = true;
            availability.CreatedDate = DateTime.UtcNow;
            availability.UpdatedDate = DateTime.UtcNow;

            if (availability.SpecificDate.HasValue)
                availability.SpecificDate = DateTimeHelper.EnsureUtc(availability.SpecificDate.Value);

            _context.SupervisorAvailabilities.Add(availability);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = availability.Id }, availability);
        }

        /// <summary>
        /// Bulk create weekly office hours (Supervisor)
        /// </summary>
        [HttpPost("bulk-create")]
        public async Task<ActionResult<IEnumerable<SupervisorAvailability>>> BulkCreate([FromBody] List<SupervisorAvailability> availabilities)
        {
            foreach (var availability in availabilities)
            {
                availability.Id = Guid.NewGuid().ToString();
                availability.IsActive = true;
                availability.CreatedDate = DateTime.UtcNow;
                availability.UpdatedDate = DateTime.UtcNow;

                if (availability.SpecificDate.HasValue)
                    availability.SpecificDate = DateTimeHelper.EnsureUtc(availability.SpecificDate.Value);
            }

            _context.SupervisorAvailabilities.AddRange(availabilities);
            await _context.SaveChangesAsync();

            return Ok(availabilities);
        }

        /// <summary>
        /// Update availability slot (Supervisor)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<SupervisorAvailability>> Update(string id, [FromBody] SupervisorAvailability updatedAvailability)
        {
            var availability = await _context.SupervisorAvailabilities.FindAsync(id);
            if (availability == null)
                return NotFound();

            availability.DayOfWeek = updatedAvailability.DayOfWeek;
            availability.StartTime = updatedAvailability.StartTime;
            availability.EndTime = updatedAvailability.EndTime;
            availability.IsRecurring = updatedAvailability.IsRecurring;
            availability.SpecificDate = updatedAvailability.SpecificDate.HasValue
                ? DateTimeHelper.EnsureUtc(updatedAvailability.SpecificDate.Value)
                : null;
            availability.Location = updatedAvailability.Location;
            availability.IsActive = updatedAvailability.IsActive;
            availability.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(availability);
        }

        /// <summary>
        /// Deactivate availability slot (Supervisor)
        /// </summary>
        [HttpPatch("{id}/deactivate")]
        public async Task<ActionResult> Deactivate(string id)
        {
            var availability = await _context.SupervisorAvailabilities.FindAsync(id);
            if (availability == null)
                return NotFound();

            availability.IsActive = false;
            availability.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok();
        }

        /// <summary>
        /// Delete availability slot (Supervisor)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var availability = await _context.SupervisorAvailabilities.FindAsync(id);
            if (availability == null)
                return NotFound();

            _context.SupervisorAvailabilities.Remove(availability);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Clear all availability for a supervisor
        /// </summary>
        [HttpDelete("clear/{supervisorEmail}")]
        public async Task<ActionResult> ClearAll(string supervisorEmail)
        {
            var availabilities = await _context.SupervisorAvailabilities
                .Where(a => a.SupervisorEmail == supervisorEmail)
                .ToListAsync();

            _context.SupervisorAvailabilities.RemoveRange(availabilities);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

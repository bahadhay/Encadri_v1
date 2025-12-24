using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Data;
using Encadri_Backend.Models;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all notifications
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetAll([FromQuery] string? userEmail = null, [FromQuery] bool? isRead = null)
        {
            var notifications = _context.Notifications.AsQueryable();

            if (!string.IsNullOrEmpty(userEmail))
            {
                notifications = notifications.Where(n => n.UserEmail == userEmail);
            }

            if (isRead.HasValue)
            {
                notifications = notifications.Where(n => n.IsRead == isRead.Value);
            }

            return Ok(await notifications.OrderByDescending(n => n.CreatedDate).ToListAsync());
        }

        /// <summary>
        /// Get notification by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Notification>> GetById(string id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }
            return Ok(notification);
        }

        /// <summary>
        /// Create a new notification
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Notification>> Create([FromBody] Notification notification)
        {
            notification.Id = Guid.NewGuid().ToString();
            notification.CreatedDate = DateTime.UtcNow;
            notification.UpdatedDate = DateTime.UtcNow;
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = notification.Id }, notification);
        }

        /// <summary>
        /// Mark notification as read
        /// </summary>
        [HttpPatch("{id}/read")]
        public async Task<ActionResult<Notification>> MarkAsRead(string id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            notification.IsRead = true;
            notification.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(notification);
        }

        /// <summary>
        /// Delete a notification
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Data;
using Encadri_Backend.Models;
using Encadri_Backend.Services;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationHelperService _notificationService;

        public MessagesController(ApplicationDbContext context, NotificationHelperService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Get all messages
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Message>>> GetAll([FromQuery] string? projectId = null)
        {
            var messages = _context.Messages.AsQueryable();

            if (!string.IsNullOrEmpty(projectId))
            {
                messages = messages.Where(m => m.ProjectId == projectId);
            }

            return Ok(await messages.OrderBy(m => m.CreatedDate).ToListAsync());
        }

        /// <summary>
        /// Get message by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Message>> GetById(string id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound();
            }
            return Ok(message);
        }

        /// <summary>
        /// Create a new message
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Message>> Create([FromBody] Message message)
        {
            message.Id = Guid.NewGuid().ToString();
            message.CreatedDate = DateTime.UtcNow;
            message.UpdatedDate = DateTime.UtcNow;
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            // Send notification to recipient if specified
            if (!string.IsNullOrEmpty(message.RecipientEmail))
            {
                var messagePreview = message.Content.Length > 50
                    ? message.Content.Substring(0, 50) + "..."
                    : message.Content;

                await _notificationService.NotifyNewMessage(
                    message.RecipientEmail,
                    message.SenderName ?? message.SenderEmail,
                    messagePreview,
                    message.ProjectId ?? message.Id
                );

                Console.WriteLine($"💬 Notification sent to {message.RecipientEmail} for message from {message.SenderName}");
            }

            return CreatedAtAction(nameof(GetById), new { id = message.Id }, message);
        }

        /// <summary>
        /// Mark message as read
        /// </summary>
        [HttpPatch("{id}/read")]
        public async Task<ActionResult<Message>> MarkAsRead(string id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound();
            }

            message.IsRead = true;
            message.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(message);
        }

        /// <summary>
        /// Delete a message
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null)
            {
                return NotFound();
            }

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

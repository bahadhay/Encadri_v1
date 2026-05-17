using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Services;
using Encadri_Backend.Data;
using Encadri_Backend.Hubs;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VideoCallController : ControllerBase
    {
        private readonly IAzureCommunicationService _acsService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ApplicationDbContext _context;

        public VideoCallController(
            IAzureCommunicationService acsService,
            IHubContext<NotificationHub> hubContext,
            ApplicationDbContext context)
        {
            _acsService = acsService;
            _hubContext = hubContext;
            _context = context;
        }

        /// <summary>
        /// Get an access token for joining a video call
        /// This token allows the user to join video calls using Azure Communication Services
        /// </summary>
        [HttpPost("token")]
        public async Task<ActionResult<object>> GetCallToken()
        {
            try
            {
                var token = await _acsService.CreateUserAndGetToken();

                return Ok(new
                {
                    token = token,
                    expiresIn = 86400 // Token valid for 24 hours
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Failed to generate call token",
                    message = ex.Message
                });
            }
        }

        /// <summary>
        /// Health check endpoint for video call service
        /// </summary>
        [HttpGet("health")]
        public ActionResult GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                service = "Azure Communication Services",
                message = "Video calling service is operational"
            });
        }

        /// <summary>
        /// Notify all meeting participants that supervisor has started the call
        /// This broadcasts a real-time SignalR message to all participants
        /// </summary>
        [HttpPost("notify-meeting-started/{meetingId}")]
        public async Task<ActionResult> NotifyMeetingStarted(string meetingId)
        {
            try
            {
                // Get meeting details
                var meeting = await _context.Meetings.FindAsync(meetingId);
                if (meeting == null)
                {
                    return NotFound(new { message = "Meeting not found" });
                }

                // Get all participant emails (supervisor + student)
                var participantEmails = new List<string>
                {
                    meeting.StudentEmail,
                    meeting.SupervisorEmail
                };

                // Broadcast via SignalR
                await NotificationHub.NotifyMeetingStarted(_hubContext, meetingId, participantEmails);

                Console.WriteLine($"✅ Meeting start notification broadcasted for meeting: {meetingId}");

                return Ok(new
                {
                    message = "Meeting start notification sent",
                    meetingId = meetingId,
                    participants = participantEmails.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to notify meeting start: {ex.Message}");
                return StatusCode(500, new
                {
                    error = "Failed to notify meeting start",
                    message = ex.Message
                });
            }
        }
    }
}

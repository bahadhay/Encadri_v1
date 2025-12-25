using Microsoft.AspNetCore.Mvc;
using Encadri_Backend.Services;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VideoCallController : ControllerBase
    {
        private readonly IAzureCommunicationService _acsService;

        public VideoCallController(IAzureCommunicationService acsService)
        {
            _acsService = acsService;
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
    }
}

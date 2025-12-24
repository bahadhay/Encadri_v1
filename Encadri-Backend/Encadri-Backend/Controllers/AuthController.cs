using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;
using Encadri_Backend.Data;
using Encadri_Backend.Services;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Login with email and password
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            // Find user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password hash
            if (user.PasswordHash == null || !PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Generate a simple token (in production, use JWT)
            var token = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{user.Email}:{DateTime.UtcNow.Ticks}")
            );

            // Return user data (PasswordHash is already excluded via JsonIgnore)
            return Ok(new LoginResponse
            {
                Token = token,
                User = user
            });
        }

        /// <summary>
        /// Get current authenticated user
        /// </summary>
        [HttpGet("me")]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            // In production, verify JWT token and get user from token
            // For demo, return the first user (PasswordHash excluded via JsonIgnore)
            var user = await _context.Users.FirstOrDefaultAsync();
            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(user);
        }

        /// <summary>
        /// Register a new user
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            // Hash the password
            var passwordHash = PasswordHasher.HashPassword(request.Password);

            var newUser = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = request.Email,
                FullName = request.FullName,
                UserRole = request.UserRole,
                AvatarUrl = request.AvatarUrl,
                PasswordHash = passwordHash,
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Generate a token for the new user
            var token = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{newUser.Email}:{DateTime.UtcNow.Ticks}")
            );

            // Return login response with token and user (PasswordHash excluded via JsonIgnore)
            return Ok(new LoginResponse
            {
                Token = token,
                User = newUser
            });
        }

        /// <summary>
        /// Update user profile
        /// </summary>
        [HttpPut("profile")]
        public async Task<ActionResult<User>> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var user = await _context.Users.FindAsync(request.Id);
            if (user == null)
            {
                return NotFound();
            }

            // Check if email is taken by another user
            if (user.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email is already in use" });
            }

            user.Email = request.Email;
            user.FullName = request.FullName;
            user.AvatarUrl = request.AvatarUrl;
            user.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(user);
        }
    }
}

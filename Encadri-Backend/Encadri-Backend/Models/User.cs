using System.Text.Json.Serialization;

namespace Encadri_Backend.Models
{
    /// <summary>
    /// User Model
    /// Represents a system user (student or supervisor)
    /// </summary>
    public class User
    {
        public string? Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string UserRole { get; set; } // "student" or "supervisor"
        public string? AvatarUrl { get; set; }

        [JsonIgnore] // Never send password hash to frontend
        public string? PasswordHash { get; set; }

        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }

    /// <summary>
    /// Login Request DTO
    /// </summary>
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    /// <summary>
    /// Login Response DTO
    /// </summary>
    public class LoginResponse
    {
        public string Token { get; set; }
        public User User { get; set; }
    }

    /// <summary>
    /// Register Request DTO
    /// </summary>
    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public string UserRole { get; set; } // "student" or "supervisor"
        public string? AvatarUrl { get; set; }
    }

    /// <summary>
    /// Update Profile Request DTO
    /// </summary>
    public class UpdateProfileRequest
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? AvatarUrl { get; set; }
    }
}

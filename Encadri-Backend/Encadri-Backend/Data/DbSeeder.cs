using Encadri_Backend.Models;
using Encadri_Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Encadri_Backend.Data
{
    /// <summary>
    /// Database Seeder - Adds test/sample data to the database
    /// </summary>
    public static class DbSeeder
    {
        public static async Task SeedDatabase(ApplicationDbContext context)
        {
            // Check if database already has data
            if (await context.Users.AnyAsync())
            {
                return; // Database already seeded
            }

            // Create test users with hashed passwords
            var users = new List<User>
            {
                new User
                {
                    Id = "1",
                    Email = "bahadhay@gmail.com",
                    FullName = "Bahaa Student",
                    UserRole = "student",
                    AvatarUrl = "https://ui-avatars.com/api/?name=Bahaa+Student&background=4f46e5&color=fff",
                    PasswordHash = PasswordHasher.HashPassword("password123"),
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new User
                {
                    Id = "2",
                    Email = "imenf4065@gmail.com",
                    FullName = "Dr. Imen Supervisor",
                    UserRole = "supervisor",
                    AvatarUrl = "https://ui-avatars.com/api/?name=Imen+Supervisor&background=4f46e5&color=fff",
                    PasswordHash = PasswordHasher.HashPassword("password123"),
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new User
                {
                    Id = "3",
                    Email = "alice@student.com",
                    FullName = "Alice Johnson",
                    UserRole = "student",
                    AvatarUrl = "https://ui-avatars.com/api/?name=Alice+Johnson&background=10b981&color=fff",
                    PasswordHash = PasswordHasher.HashPassword("password123"),
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new User
                {
                    Id = "4",
                    Email = "prof.martin@university.com",
                    FullName = "Prof. Martin",
                    UserRole = "supervisor",
                    AvatarUrl = "https://ui-avatars.com/api/?name=Prof+Martin&background=f59e0b&color=fff",
                    PasswordHash = PasswordHasher.HashPassword("password123"),
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };

            context.Users.AddRange(users);
            await context.SaveChangesAsync();

            // Create test projects
            var projects = new List<Project>
            {
                new Project
                {
                    Id = "p1",
                    Title = "E-commerce Platform Development",
                    Type = "PFE",
                    Description = "Development of a full-stack e-commerce platform with modern technologies",
                    StudentEmail = "student@test.com",
                    StudentName = "John Student",
                    SupervisorEmail = "supervisor@test.com",
                    SupervisorName = "Dr. Sarah Supervisor",
                    Status = "in_progress",
                    StartDate = new DateTime(2024, 1, 15),
                    EndDate = new DateTime(2024, 6, 30),
                    Technologies = new List<string> { "Angular", "ASP.NET Core", "MySQL" },
                    Objectives = new List<string> { "Build scalable architecture", "Implement payment gateway", "Create admin dashboard" },
                    ProgressPercentage = 65,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Project
                {
                    Id = "p2",
                    Title = "Machine Learning for Predictive Maintenance",
                    Type = "Internship",
                    Description = "Developing ML models for predictive maintenance in industrial equipment",
                    StudentEmail = "alice@student.com",
                    StudentName = "Alice Johnson",
                    SupervisorEmail = "prof.martin@university.com",
                    SupervisorName = "Prof. Martin",
                    Status = "in_progress",
                    StartDate = new DateTime(2024, 2, 1),
                    EndDate = new DateTime(2024, 7, 31),
                    Technologies = new List<string> { "Python", "TensorFlow", "scikit-learn" },
                    Objectives = new List<string> { "Collect and preprocess data", "Train ML models", "Deploy solution" },
                    ProgressPercentage = 40,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };

            context.Projects.AddRange(projects);
            await context.SaveChangesAsync();

            // Create milestones
            var milestones = new List<Milestone>
            {
                new Milestone
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Requirements Analysis",
                    Description = "Complete requirements gathering and analysis phase",
                    DueDate = new DateTime(2024, 2, 15),
                    Status = "completed",
                    CompletedDate = new DateTime(2024, 2, 10),
                    Order = 1,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Milestone
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "System Design",
                    Description = "Design system architecture and database schema",
                    DueDate = new DateTime(2024, 3, 15),
                    Status = "completed",
                    CompletedDate = new DateTime(2024, 3, 12),
                    Order = 2,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Milestone
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Backend Development",
                    Description = "Implement backend APIs and business logic",
                    DueDate = new DateTime(2024, 4, 30),
                    Status = "in_progress",
                    Order = 3,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Milestone
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Frontend Development",
                    Description = "Build user interface and integrate with backend",
                    DueDate = new DateTime(2024, 5, 31),
                    Status = "not_started",
                    Order = 4,
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };

            context.Milestones.AddRange(milestones);
            await context.SaveChangesAsync();

            // Create submissions
            var submissions = new List<Submission>
            {
                new Submission
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Requirements Document",
                    Type = "documentation",
                    SubmittedBy = "student@test.com",
                    Status = "approved",
                    DueDate = new DateTime(2024, 2, 15),
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Submission
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "System Architecture Design",
                    Type = "documentation",
                    SubmittedBy = "student@test.com",
                    Status = "reviewed",
                    Feedback = "Good design, please add more details on security aspects",
                    DueDate = new DateTime(2024, 3, 15),
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Submission
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Backend API Implementation",
                    Type = "code",
                    SubmittedBy = "student@test.com",
                    Status = "pending",
                    DueDate = new DateTime(2024, 4, 30),
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };

            context.Submissions.AddRange(submissions);
            await context.SaveChangesAsync();

            // Create meetings
            var meetings = new List<Meeting>
            {
                new Meeting
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Project Kickoff Meeting",
                    ScheduledAt = new DateTime(2024, 1, 20, 10, 0, 0),
                    DurationMinutes = 60,
                    Location = "Online - Zoom",
                    Status = "completed",
                    Agenda = "Discuss project scope and timeline",
                    Notes = "Project scope agreed, timeline confirmed",
                    RequestedBy = "supervisor@test.com",
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Meeting
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Mid-term Progress Review",
                    ScheduledAt = new DateTime(2024, 4, 1, 14, 0, 0),
                    DurationMinutes = 90,
                    Location = "Room 205",
                    Status = "completed",
                    Agenda = "Review progress and address challenges",
                    Notes = "Good progress, discussed technical challenges",
                    RequestedBy = "supervisor@test.com",
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                },
                new Meeting
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    Title = "Design Review Session",
                    ScheduledAt = DateTime.UtcNow.AddDays(7).Date.AddHours(10),
                    DurationMinutes = 60,
                    Location = "Online - Teams",
                    Status = "confirmed",
                    Agenda = "Review system architecture and design decisions",
                    RequestedBy = "student@test.com",
                    CreatedDate = DateTime.UtcNow,
                    UpdatedDate = DateTime.UtcNow
                }
            };

            context.Meetings.AddRange(meetings);
            await context.SaveChangesAsync();

            // Create messages
            var messages = new List<Message>
            {
                new Message
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    SenderEmail = "student@test.com",
                    SenderName = "John Student",
                    Content = "Hello Dr. Supervisor, I have completed the requirements document. Please review.",
                    IsRead = true,
                    CreatedDate = DateTime.UtcNow.AddDays(-10),
                    UpdatedDate = DateTime.UtcNow.AddDays(-10)
                },
                new Message
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    SenderEmail = "supervisor@test.com",
                    SenderName = "Dr. Sarah Supervisor",
                    Content = "Great work on the requirements! I have a few minor suggestions.",
                    IsRead = true,
                    CreatedDate = DateTime.UtcNow.AddDays(-9),
                    UpdatedDate = DateTime.UtcNow.AddDays(-9)
                },
                new Message
                {
                    Id = Guid.NewGuid().ToString(),
                    ProjectId = "p1",
                    SenderEmail = "student@test.com",
                    SenderName = "John Student",
                    Content = "I am currently working on the backend APIs. Will update you soon.",
                    IsRead = false,
                    CreatedDate = DateTime.UtcNow.AddDays(-2),
                    UpdatedDate = DateTime.UtcNow.AddDays(-2)
                }
            };

            context.Messages.AddRange(messages);
            await context.SaveChangesAsync();

            // Create notifications
            var notifications = new List<Notification>
            {
                new Notification
                {
                    Id = Guid.NewGuid().ToString(),
                    UserEmail = "student@test.com",
                    Title = "New Project Assigned",
                    Message = "You have been assigned to a new project: E-commerce Platform Development",
                    Type = "new_assignment",
                    Priority = "high",
                    IsRead = true,
                    CreatedDate = DateTime.UtcNow.AddDays(-30),
                    UpdatedDate = DateTime.UtcNow.AddDays(-30)
                },
                new Notification
                {
                    Id = Guid.NewGuid().ToString(),
                    UserEmail = "student@test.com",
                    Title = "Upcoming Deadline",
                    Message = "Your Backend API Implementation submission is due in 3 days",
                    Type = "deadline",
                    Priority = "urgent",
                    IsRead = false,
                    CreatedDate = DateTime.UtcNow.AddHours(-2),
                    UpdatedDate = DateTime.UtcNow.AddHours(-2)
                },
                new Notification
                {
                    Id = Guid.NewGuid().ToString(),
                    UserEmail = "supervisor@test.com",
                    Title = "New Submission",
                    Message = "John Student has submitted: System Architecture Design",
                    Type = "system",
                    Priority = "normal",
                    IsRead = true,
                    CreatedDate = DateTime.UtcNow.AddDays(-5),
                    UpdatedDate = DateTime.UtcNow.AddDays(-5)
                }
            };

            context.Notifications.AddRange(notifications);
            await context.SaveChangesAsync();

            Console.WriteLine("Database seeded successfully!");
        }
    }
}

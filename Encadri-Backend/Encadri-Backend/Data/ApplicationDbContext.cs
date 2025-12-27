using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;

namespace Encadri_Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets for all entities
        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Meeting> Meetings { get; set; }
        public DbSet<MeetingRequest> MeetingRequests { get; set; }
        public DbSet<SupervisorAvailability> SupervisorAvailabilities { get; set; }
        public DbSet<MeetingDocument> MeetingDocuments { get; set; }
        public DbSet<MeetingReminder> MeetingReminders { get; set; }
        public DbSet<Evaluation> Evaluations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Milestone> Milestones { get; set; }
        public DbSet<ChatRoom> ChatRooms { get; set; }
        public DbSet<ProjectDocument> Documents { get; set; }
        public DbSet<Note> Notes { get; set; }
        public DbSet<NoteCategory> NoteCategories { get; set; }
        public DbSet<NoteFolder> NoteFolders { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure entity relationships and constraints here
            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PasswordHash).HasColumnName("PasswordHash");
            });

            // Configure Project entity
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired();

                // Store Technologies and Objectives as JSON in MySQL
                entity.Property(e => e.Technologies)
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                        v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                    )
                    .HasColumnType("json");

                entity.Property(e => e.Objectives)
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                        v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                    )
                    .HasColumnType("json");
            });

            // Configure Submission entity
            modelBuilder.Entity<Submission>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Meeting entity
            modelBuilder.Entity<Meeting>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure MeetingRequest entity
            modelBuilder.Entity<MeetingRequest>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Store DocumentUrls as JSON
                entity.Property(e => e.DocumentUrls)
                    .HasConversion(
                        v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                        v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                    )
                    .HasColumnType("json");
            });

            // Configure SupervisorAvailability entity
            modelBuilder.Entity<SupervisorAvailability>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure MeetingDocument entity
            modelBuilder.Entity<MeetingDocument>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure MeetingReminder entity
            modelBuilder.Entity<MeetingReminder>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Evaluation entity
            modelBuilder.Entity<Evaluation>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Message entity
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Notification entity
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Milestone entity
            modelBuilder.Entity<Milestone>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure ChatRoom entity
            modelBuilder.Entity<ChatRoom>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });

            // Configure Note entity
            modelBuilder.Entity<Note>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired();
                entity.Property(e => e.Content).IsRequired();
                entity.Property(e => e.UserEmail).IsRequired();

                // Store Tags as JSON
                entity.Property(e => e.Tags)
                    .HasConversion(
                        v => v != null ? System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null) : null,
                        v => v != null ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) : null
                    )
                    .HasColumnType("json");
            });

            // Configure NoteCategory entity
            modelBuilder.Entity<NoteCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.UserEmail).IsRequired();
            });

            // Configure NoteFolder entity
            modelBuilder.Entity<NoteFolder>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.UserEmail).IsRequired();
            });
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Encadri_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddNotesFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Meetings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "Meetings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MeetingLink",
                table: "Meetings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeetingNotes",
                table: "Meetings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeetingType",
                table: "Meetings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndDate",
                table: "Meetings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrencePattern",
                table: "Meetings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StudentEmail",
                table: "Meetings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SupervisorEmail",
                table: "Meetings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "MeetingDocuments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MeetingId = table.Column<string>(type: "text", nullable: false),
                    MeetingRequestId = table.Column<string>(type: "text", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    BlobUrl = table.Column<string>(type: "text", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    UploadedBy = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingDocuments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MeetingReminders",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    MeetingId = table.Column<string>(type: "text", nullable: false),
                    RecipientEmail = table.Column<string>(type: "text", nullable: false),
                    MinutesBeforeMeeting = table.Column<int>(type: "integer", nullable: false),
                    IsSent = table.Column<bool>(type: "boolean", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ScheduledFor = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingReminders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MeetingRequests",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ProjectId = table.Column<string>(type: "text", nullable: false),
                    StudentEmail = table.Column<string>(type: "text", nullable: false),
                    SupervisorEmail = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Agenda = table.Column<string>(type: "text", nullable: true),
                    PreferredDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    MeetingType = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    MeetingId = table.Column<string>(type: "text", nullable: true),
                    DocumentUrls = table.Column<string>(type: "json", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NoteCategories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    UserEmail = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoteCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NoteFolders",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<string>(type: "text", nullable: true),
                    ParentFolderId = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    UserEmail = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NoteFolders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<string>(type: "text", nullable: true),
                    FolderId = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    Tags = table.Column<string>(type: "json", nullable: true),
                    UserEmail = table.Column<string>(type: "text", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SupervisorAvailabilities",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SupervisorEmail = table.Column<string>(type: "text", nullable: false),
                    DayOfWeek = table.Column<string>(type: "text", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    IsRecurring = table.Column<bool>(type: "boolean", nullable: false),
                    SpecificDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MeetingType = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupervisorAvailabilities", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MeetingDocuments");

            migrationBuilder.DropTable(
                name: "MeetingReminders");

            migrationBuilder.DropTable(
                name: "MeetingRequests");

            migrationBuilder.DropTable(
                name: "NoteCategories");

            migrationBuilder.DropTable(
                name: "NoteFolders");

            migrationBuilder.DropTable(
                name: "Notes");

            migrationBuilder.DropTable(
                name: "SupervisorAvailabilities");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "MeetingLink",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "MeetingNotes",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "MeetingType",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "RecurrenceEndDate",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "RecurrencePattern",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "StudentEmail",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "SupervisorEmail",
                table: "Meetings");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Encadri_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new columns to Meetings table
            migrationBuilder.AddColumn<string>(
                name: "MeetingNotes",
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

            migrationBuilder.AddColumn<string>(
                name: "MeetingLink",
                table: "Meetings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MeetingType",
                table: "Meetings",
                type: "text",
                nullable: false,
                defaultValue: "virtual");

            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "Meetings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RecurrencePattern",
                table: "Meetings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndDate",
                table: "Meetings",
                type: "timestamp with time zone",
                nullable: true);

            // Create MeetingRequests table
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

            // Create SupervisorAvailabilities table
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
                    Location = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupervisorAvailabilities", x => x.Id);
                });

            // Create MeetingDocuments table
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

            // Create MeetingReminders table
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "MeetingRequests");
            migrationBuilder.DropTable(name: "SupervisorAvailabilities");
            migrationBuilder.DropTable(name: "MeetingDocuments");
            migrationBuilder.DropTable(name: "MeetingReminders");

            migrationBuilder.DropColumn(name: "MeetingNotes", table: "Meetings");
            migrationBuilder.DropColumn(name: "StudentEmail", table: "Meetings");
            migrationBuilder.DropColumn(name: "SupervisorEmail", table: "Meetings");
            migrationBuilder.DropColumn(name: "MeetingLink", table: "Meetings");
            migrationBuilder.DropColumn(name: "MeetingType", table: "Meetings");
            migrationBuilder.DropColumn(name: "IsRecurring", table: "Meetings");
            migrationBuilder.DropColumn(name: "RecurrencePattern", table: "Meetings");
            migrationBuilder.DropColumn(name: "RecurrenceEndDate", table: "Meetings");
        }
    }
}

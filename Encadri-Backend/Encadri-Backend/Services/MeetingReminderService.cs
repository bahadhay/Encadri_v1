using Encadri_Backend.Data;
using Encadri_Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Encadri_Backend.Services
{
    /// <summary>
    /// Background Service for Meeting Reminders
    /// Sends notifications for upcoming meetings
    /// </summary>
    public class MeetingReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MeetingReminderService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1); // Check every 1 minute for reliable notifications

        public MeetingReminderService(
            IServiceProvider serviceProvider,
            ILogger<MeetingReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Meeting Reminder Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessMeetingReminders();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing meeting reminders: {Message}", ex.Message);
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Meeting Reminder Service stopped");
        }

        private async Task ProcessMeetingReminders()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<NotificationHelperService>();

            var now = DateTime.UtcNow;

            // Get upcoming meetings in the next 24 hours
            var upcomingMeetings = await context.Meetings
                .Where(m => m.ScheduledAt > now
                    && m.ScheduledAt <= now.AddHours(24)
                    && m.Status != "cancelled"
                    && m.Status != "completed")
                .ToListAsync();

            foreach (var meeting in upcomingMeetings)
            {
                // Define reminder intervals (in minutes before meeting)
                var reminderIntervals = new[] { 1440, 60, 15, 0 }; // 24 hours, 1 hour, 15 minutes, NOW

                foreach (var minutesBefore in reminderIntervals)
                {
                    var reminderTime = meeting.ScheduledAt.AddMinutes(-minutesBefore);

                    // Debug logging to trace reminder detection
                    _logger.LogDebug(
                        "Checking reminder for meeting {MeetingId} ({Title}): reminderTime={ReminderTime:yyyy-MM-dd HH:mm:ss}, now={Now:yyyy-MM-dd HH:mm:ss}, minutesBefore={MinutesBefore}",
                        meeting.Id, meeting.Title, reminderTime, now, minutesBefore
                    );

                    // Check if it's time to send this reminder (10-minute window to ensure reliability)
                    if (now >= reminderTime && now < reminderTime.AddMinutes(10))
                    {
                        // Check if reminder already sent
                        var reminderExists = await context.MeetingReminders
                            .AnyAsync(r => r.MeetingId == meeting.Id
                                && r.MinutesBeforeMeeting == minutesBefore
                                && r.IsSent);

                        if (!reminderExists)
                        {
                            // Send reminders to both student and supervisor
                            var recipients = new[] { meeting.StudentEmail, meeting.SupervisorEmail };

                            foreach (var recipient in recipients)
                            {
                                if (!string.IsNullOrEmpty(recipient))
                                {
                                    await notificationService.NotifyUpcomingMeeting(
                                        recipient,
                                        meeting.Title ?? "Meeting",
                                        meeting.ScheduledAt,
                                        minutesBefore,
                                        meeting.Id
                                    );

                                    // Record that reminder was sent
                                    var reminder = new MeetingReminder
                                    {
                                        Id = Guid.NewGuid().ToString(),
                                        MeetingId = meeting.Id,
                                        RecipientEmail = recipient,
                                        MinutesBeforeMeeting = minutesBefore,
                                        IsSent = true,
                                        SentAt = DateTime.UtcNow,
                                        ScheduledFor = reminderTime,
                                        CreatedDate = DateTime.UtcNow
                                    };

                                    context.MeetingReminders.Add(reminder);
                                }
                            }

                            await context.SaveChangesAsync();

                            _logger.LogInformation(
                                "Sent {MinutesBefore} minute reminder for meeting {MeetingId}",
                                minutesBefore,
                                meeting.Id
                            );
                        }
                    }
                }
            }

            // Auto-complete meetings that are past their scheduled time
            var pastMeetings = await context.Meetings
                .Where(m => m.ScheduledAt < now.AddHours(-2) // 2 hours past scheduled time
                    && m.Status == "confirmed")
                .ToListAsync();

            foreach (var meeting in pastMeetings)
            {
                meeting.Status = "completed";
                meeting.UpdatedDate = DateTime.UtcNow;
            }

            if (pastMeetings.Any())
            {
                await context.SaveChangesAsync();
                _logger.LogInformation("Auto-completed {Count} past meetings", pastMeetings.Count);
            }
        }
    }
}

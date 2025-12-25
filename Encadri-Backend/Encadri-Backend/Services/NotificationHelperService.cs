using Microsoft.AspNetCore.SignalR;
using Encadri_Backend.Data;
using Encadri_Backend.Hubs;
using Encadri_Backend.Models;

namespace Encadri_Backend.Services
{
    public class NotificationHelperService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ApplicationDbContext _context;

        public NotificationHelperService(
            IHubContext<NotificationHub> hubContext,
            ApplicationDbContext context)
        {
            _hubContext = hubContext;
            _context = context;
        }

        public async Task SendNotificationAsync(
            string userEmail,
            string title,
            string message,
            string type,
            string priority = "Medium",
            string? link = null)
        {
            await NotificationHub.SendNotificationToUser(
                _hubContext,
                _context,
                userEmail,
                title,
                message,
                type,
                priority,
                link
            );
        }

        // Project Notifications
        public async Task NotifyProjectCreated(string supervisorEmail, string projectTitle, string projectId)
        {
            await SendNotificationAsync(
                supervisorEmail,
                "New Project Created",
                $"Project '{projectTitle}' has been created successfully.",
                "project",
                "Low",
                $"/projects/{projectId}"
            );
        }

        public async Task NotifyProjectAssigned(string studentEmail, string projectTitle, string projectId)
        {
            await SendNotificationAsync(
                studentEmail,
                "Project Assigned",
                $"You have been assigned to project '{projectTitle}'.",
                "project",
                "High",
                $"/projects/{projectId}"
            );
        }

        public async Task NotifyProjectStatusChanged(string userEmail, string projectTitle, string newStatus, string projectId)
        {
            await SendNotificationAsync(
                userEmail,
                "Project Status Updated",
                $"Project '{projectTitle}' status changed to {newStatus}.",
                "project",
                "Medium",
                $"/projects/{projectId}"
            );
        }

        // Submission Notifications
        public async Task NotifySubmissionCreated(string supervisorEmail, string studentName, string submissionTitle, string submissionId)
        {
            await SendNotificationAsync(
                supervisorEmail,
                "New Submission",
                $"{studentName} submitted '{submissionTitle}' for review.",
                "submission",
                "High",
                $"/submissions/{submissionId}"
            );
        }

        public async Task NotifySubmissionEvaluated(string studentEmail, string submissionTitle, string submissionId)
        {
            await SendNotificationAsync(
                studentEmail,
                "Submission Evaluated",
                $"Your submission '{submissionTitle}' has been evaluated.",
                "evaluation",
                "High",
                $"/submissions/{submissionId}"
            );
        }

        public async Task NotifySubmissionApproved(string studentEmail, string submissionTitle, string submissionId)
        {
            await SendNotificationAsync(
                studentEmail,
                "Submission Approved",
                $"Congratulations! Your submission '{submissionTitle}' has been approved.",
                "success",
                "High",
                $"/submissions/{submissionId}"
            );
        }

        public async Task NotifySubmissionRejected(string studentEmail, string submissionTitle, string submissionId)
        {
            await SendNotificationAsync(
                studentEmail,
                "Submission Rejected",
                $"Your submission '{submissionTitle}' has been rejected. Please review the feedback.",
                "warning",
                "High",
                $"/submissions/{submissionId}"
            );
        }

        public async Task NotifySubmissionNeedsRevision(string studentEmail, string submissionTitle, string submissionId)
        {
            await SendNotificationAsync(
                studentEmail,
                "Revision Requested",
                $"Your submission '{submissionTitle}' needs revision. Please check the feedback and resubmit.",
                "warning",
                "High",
                $"/submissions/{submissionId}"
            );
        }

        // Meeting Notifications
        public async Task NotifyMeetingScheduled(List<string> participantEmails, string meetingTitle, DateTime meetingDate, string meetingId)
        {
            foreach (var email in participantEmails)
            {
                await SendNotificationAsync(
                    email,
                    "Meeting Scheduled",
                    $"A meeting '{meetingTitle}' has been scheduled for {meetingDate:MMM dd, yyyy HH:mm}.",
                    "meeting",
                    "Medium",
                    $"/meetings/{meetingId}"
                );
            }
        }

        public async Task NotifyMeetingReminder(string userEmail, string meetingTitle, DateTime meetingDate, string meetingId)
        {
            await SendNotificationAsync(
                userEmail,
                "Meeting Reminder",
                $"Reminder: Meeting '{meetingTitle}' starts in 30 minutes.",
                "meeting",
                "High",
                $"/meetings/{meetingId}"
            );
        }

        public async Task NotifyMeetingCancelled(List<string> participantEmails, string meetingTitle)
        {
            foreach (var email in participantEmails)
            {
                await SendNotificationAsync(
                    email,
                    "Meeting Cancelled",
                    $"The meeting '{meetingTitle}' has been cancelled.",
                    "warning",
                    "Medium"
                );
            }
        }

        // Evaluation Notifications
        public async Task NotifyEvaluationReceived(string studentEmail, string evaluationTitle, double score, string evaluationId)
        {
            await SendNotificationAsync(
                studentEmail,
                "New Evaluation",
                $"You received an evaluation '{evaluationTitle}' with score: {score}%.",
                "grade",
                "High",
                $"/evaluations/{evaluationId}"
            );
        }

        // Message Notifications
        public async Task NotifyNewMessage(string recipientEmail, string senderName, string messagePreview, string conversationId)
        {
            await SendNotificationAsync(
                recipientEmail,
                $"New message from {senderName}",
                messagePreview,
                "message",
                "Medium",
                $"/chat?conversation={conversationId}"
            );
        }

        // Deadline Notifications
        public async Task NotifyDeadlineApproaching(string userEmail, string taskTitle, DateTime deadline, string taskId)
        {
            var daysLeft = (deadline - DateTime.UtcNow).Days;
            await SendNotificationAsync(
                userEmail,
                "Deadline Approaching",
                $"'{taskTitle}' is due in {daysLeft} day(s) on {deadline:MMM dd, yyyy}.",
                "deadline",
                "High",
                $"/tasks/{taskId}"
            );
        }

        // Milestone Notifications
        public async Task NotifyMilestoneCompleted(string supervisorEmail, string studentName, string milestoneTitle, string projectId)
        {
            await SendNotificationAsync(
                supervisorEmail,
                "Milestone Completed",
                $"{studentName} completed milestone '{milestoneTitle}'.",
                "success",
                "Medium",
                $"/projects/{projectId}"
            );
        }

        // System Notifications
        public async Task NotifySystemAnnouncement(List<string> userEmails, string title, string message, string priority = "Medium")
        {
            foreach (var email in userEmails)
            {
                await SendNotificationAsync(
                    email,
                    title,
                    message,
                    "system",
                    priority
                );
            }
        }
    }
}

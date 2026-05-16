namespace Encadri_Backend.Models
{
    /// <summary>
    /// Meeting Model
    /// Represents a scheduled meeting between student and supervisor
    /// </summary>
    public class Meeting
    {
        public string? Id { get; set; }
        public string ProjectId { get; set; }
        public string? Title { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int? DurationMinutes { get; set; }
        public string? Location { get; set; }
        public string Status { get; set; } // "pending", "confirmed", "completed", "cancelled"
        public string? Agenda { get; set; }
        public string? Notes { get; set; }
        public string? MeetingNotes { get; set; } // Notes taken during the meeting
        public string? RequestedBy { get; set; }
        public string StudentEmail { get; set; }
        public string SupervisorEmail { get; set; }
        public string? MeetingLink { get; set; } // Azure Communication Services link or physical location
        public string MeetingType { get; set; } // "virtual", "in-person", "hybrid"
        public string? CancellationReason { get; set; } // Reason for cancelling the meeting
        public bool IsRecurring { get; set; } = false;
        public string? RecurrencePattern { get; set; } // "weekly", "biweekly", "monthly"
        public DateTime? RecurrenceEndDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }

        // Grace Period Configuration (minutes)
        private const int GRACE_PERIOD_MINUTES = 60; // Meeting stays active 60 min after start
        private const int EARLY_JOIN_MINUTES = 15;   // Can join 15 min before start

        /// <summary>
        /// Get the current status of the meeting based on time
        /// Returns: "scheduled", "can-join-early", "in-progress", "ended"
        /// </summary>
        public string GetCurrentStatus()
        {
            var now = DateTime.UtcNow;
            var startTime = ScheduledAt;
            var earlyJoinTime = startTime.AddMinutes(-EARLY_JOIN_MINUTES);
            var gracePeriodEnd = startTime.AddMinutes(GRACE_PERIOD_MINUTES);

            // Check if meeting is cancelled or completed manually
            if (Status == "cancelled" || Status == "completed")
            {
                return "ended";
            }

            // Scheduled (not yet in early join window)
            if (now < earlyJoinTime)
            {
                return "scheduled";
            }

            // Can join early (15 min before start)
            if (now >= earlyJoinTime && now < startTime)
            {
                return "can-join-early";
            }

            // In progress or grace period (from start time to grace period end)
            if (now >= startTime && now < gracePeriodEnd)
            {
                return "in-progress";
            }

            // Grace period expired
            return "ended";
        }

        /// <summary>
        /// Check if the meeting is currently joinable
        /// </summary>
        public bool IsJoinable()
        {
            var status = GetCurrentStatus();
            return status == "can-join-early" || status == "in-progress";
        }

        /// <summary>
        /// Check if meeting is in upcoming window (not yet started, including early join)
        /// </summary>
        public bool IsUpcoming()
        {
            var now = DateTime.UtcNow;
            var gracePeriodEnd = ScheduledAt.AddMinutes(GRACE_PERIOD_MINUTES);

            // Upcoming if scheduled time hasn't passed grace period yet
            return now < gracePeriodEnd && Status != "cancelled" && Status != "completed";
        }

        /// <summary>
        /// Check if meeting is in the past (grace period expired)
        /// </summary>
        public bool IsPast()
        {
            var now = DateTime.UtcNow;
            var gracePeriodEnd = ScheduledAt.AddMinutes(GRACE_PERIOD_MINUTES);

            return now >= gracePeriodEnd || Status == "cancelled" || Status == "completed";
        }
    }
}

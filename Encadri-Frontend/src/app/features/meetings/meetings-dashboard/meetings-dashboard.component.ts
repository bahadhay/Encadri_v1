import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { Meeting, MeetingRequest, SupervisorAvailability } from '../../../core/models/meeting.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-meetings-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, SkeletonCardComponent],
  templateUrl: './meetings-dashboard.component.html',
  styleUrls: ['./meetings-dashboard.component.css']
})
export class MeetingsDashboardComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  currentUser = this.authService.currentUser;
  upcomingMeetings = signal<Meeting[]>([]);
  pendingRequests = signal<MeetingRequest[]>([]);
  supervisorAvailability = signal<any[]>([]);

  // State
  activeTab = signal<'upcoming' | 'requests' | 'availability' | 'history'>('upcoming');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  highlightedMeetingId = signal<string | null>(null);

  // Cancel modal state
  showCancelModal = signal(false);
  meetingToCancel = signal<Meeting | null>(null);
  selectedCancellationReason = signal<string>('');
  customCancellationReason = signal<string>('');

  // Predefined cancellation reasons
  cancellationReasons = [
    'Schedule conflict',
    'No longer needed',
    'Illness or emergency',
    'Technical issues',
    'Rescheduling required',
    'Student/Supervisor unavailable',
    'Other'
  ];

  // Filters
  statusFilter = signal<string>('all');
  pastMeetings = signal<Meeting[]>([]);

  // Grace period configuration (must match backend)
  private readonly GRACE_PERIOD_MINUTES = 60;
  private readonly EARLY_JOIN_MINUTES = 15;

  ngOnInit() {
    // Check for meeting ID in route params (from notification links)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.highlightedMeetingId.set(params['id']);
        // Always show upcoming tab when coming from notification
        this.switchTab('upcoming');
      }
    });

    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      // Check for requestId (from meeting request notifications)
      if (params['requestId']) {
        // Switch to requests tab for supervisors
        this.switchTab('requests');
        return;
      }

      // Check for tab query parameter
      if (params['tab'] && !this.highlightedMeetingId()) {
        this.switchTab(params['tab']);
      }
    });

    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    const userEmail = this.currentUser()?.email;
    if (!userEmail) {
      this.loading.set(false);
      return;
    }

    // Load upcoming meetings
    this.meetingService.getUpcomingMeetings(userEmail, 168).subscribe({ // Next 7 days
      next: (meetings) => {
        this.upcomingMeetings.set(meetings);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load meetings:', err);
        const errorMsg = err.status === 0
          ? 'Cannot connect to server. Please check if the backend is running.'
          : err.error?.message || err.message || 'Failed to load meetings';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });

    // Load past meetings for history (respecting grace period)
    this.meetingService.getMeetings({ userEmail }).subscribe({
      next: (meetings) => {
        const now = new Date();
        this.pastMeetings.set(
          meetings.filter(m => {
            const gracePeriodEnd = new Date(m.scheduledAt);
            gracePeriodEnd.setMinutes(gracePeriodEnd.getMinutes() + this.GRACE_PERIOD_MINUTES);
            // Only show in history if grace period has expired OR meeting is cancelled/completed
            return now >= gracePeriodEnd || m.status === 'cancelled' || m.status === 'completed';
          })
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
        );
      },
      error: () => {}
    });

    // Load pending requests based on role
    if (this.isStudent()) {
      this.meetingService.getMeetingRequests({ studentEmail: userEmail, status: 'pending' }).subscribe({
        next: (requests) => this.pendingRequests.set(requests),
        error: () => {}
      });
    } else if (this.isSupervisor()) {
      this.meetingService.getMeetingRequests({ supervisorEmail: userEmail, status: 'pending' }).subscribe({
        next: (requests) => this.pendingRequests.set(requests),
        error: () => {}
      });

      // Load supervisor availability
      this.meetingService.getWeeklySchedule(userEmail).subscribe({
        next: (schedule) => this.supervisorAvailability.set(schedule),
        error: () => {}
      });
    }
  }

  isStudent(): boolean {
    return this.currentUser()?.userRole === 'student';
  }

  isSupervisor(): boolean {
    return this.currentUser()?.userRole === 'supervisor';
  }

  switchTab(tab: 'upcoming' | 'requests' | 'availability' | 'history') {
    this.activeTab.set(tab);
  }

  createMeetingRequest() {
    this.router.navigate(['/meetings/request-meeting']);
  }

  setAvailability() {
    this.router.navigate(['/meetings/set-availability']);
  }

  bulkInviteStudents() {
    this.router.navigate(['/meetings/bulk-invite']);
  }

  viewMeetingDetails(meetingId: string) {
    this.router.navigate(['/meetings', meetingId]);
  }

  approveMeetingRequest(request: MeetingRequest) {
    if (!request.id) return;

    this.success.set(null);
    this.error.set(null);

    this.meetingService.approveMeetingRequest(request.id, request.preferredDate).subscribe({
      next: (meeting) => {
        this.success.set('Meeting request approved successfully!');
        // Switch to upcoming tab to show the newly created meeting
        this.switchTab('upcoming');
        // Reload data to fetch the new meeting
        this.loadData();
        // Highlight the newly created meeting
        if (meeting && meeting.id) {
          this.highlightedMeetingId.set(meeting.id);
          // Auto-scroll to the meeting after a short delay
          setTimeout(() => {
            const element = document.getElementById(`meeting-${meeting.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
        // Clear success message after 5 seconds
        setTimeout(() => this.success.set(null), 5000);
      },
      error: (err) => {
        console.error('Failed to approve meeting request:', err);
        const errorMsg = err?.message || err?.error?.message || err?.title || 'Unknown error occurred';
        this.error.set('Failed to approve meeting request: ' + errorMsg);
        setTimeout(() => this.error.set(null), 5000);
      }
    });
  }

  rejectMeetingRequest(request: MeetingRequest) {
    if (!request.id) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    this.success.set(null);
    this.error.set(null);

    this.meetingService.rejectMeetingRequest(request.id, reason).subscribe({
      next: () => {
        this.success.set('Meeting request rejected');
        this.loadData();
        setTimeout(() => this.success.set(null), 5000);
      },
      error: (err) => {
        console.error('Failed to reject meeting request:', err);
        const errorMsg = err?.message || err?.error?.message || err?.title || 'Unknown error occurred';
        this.error.set('Failed to reject meeting request: ' + errorMsg);
        setTimeout(() => this.error.set(null), 5000);
      }
    });
  }

  cancelMeeting(meeting: Meeting) {
    // Open cancel modal instead of basic confirm
    this.meetingToCancel.set(meeting);
    this.showCancelModal.set(true);
    this.selectedCancellationReason.set('');
    this.customCancellationReason.set('');
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.meetingToCancel.set(null);
    this.selectedCancellationReason.set('');
    this.customCancellationReason.set('');
  }

  confirmCancelMeeting() {
    const meeting = this.meetingToCancel();
    if (!meeting) return;

    const selectedReason = this.selectedCancellationReason();
    if (!selectedReason) {
      this.error.set('Please select a cancellation reason');
      setTimeout(() => this.error.set(null), 3000);
      return;
    }

    // If "Other" is selected, require custom reason
    if (selectedReason === 'Other' && !this.customCancellationReason().trim()) {
      this.error.set('Please provide a cancellation reason');
      setTimeout(() => this.error.set(null), 3000);
      return;
    }

    const cancellationReason = selectedReason === 'Other'
      ? this.customCancellationReason().trim()
      : selectedReason;

    this.success.set(null);
    this.error.set(null);

    // Update meeting status to cancelled with reason
    this.meetingService.updateMeeting(meeting.id, {
      status: 'cancelled',
      cancellationReason: cancellationReason
    }).subscribe({
      next: () => {
        this.success.set('Meeting cancelled successfully');
        this.closeCancelModal();
        this.loadData();
        setTimeout(() => this.success.set(null), 5000);
      },
      error: (err) => {
        const errorMsg = err?.message || 'Failed to cancel meeting';
        this.error.set(errorMsg);
        setTimeout(() => this.error.set(null), 5000);
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'completed': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getTimeUntilMeeting(dateString: string): string {
    const now = new Date();
    const meetingDate = new Date(dateString);
    const diff = meetingDate.getTime() - now.getTime();

    // Calculate time boundaries based on grace period constants
    const earlyJoinTime = new Date(meetingDate.getTime() - this.EARLY_JOIN_MINUTES * 60000);
    const gracePeriodEnd = new Date(meetingDate.getTime() + this.GRACE_PERIOD_MINUTES * 60000);

    // Meeting has ended (past grace period)
    if (now >= gracePeriodEnd) {
      return 'Ended';
    }

    // Meeting is in progress (within grace period after start)
    if (now >= meetingDate && now < gracePeriodEnd) {
      const minutesInProgress = Math.floor((now.getTime() - meetingDate.getTime()) / (1000 * 60));
      if (minutesInProgress === 0) {
        return 'Starting now';
      }
      return `Started ${minutesInProgress}m ago`;
    }

    // Early join window (15 min before start)
    if (now >= earlyJoinTime && now < meetingDate) {
      const minutesUntilStart = Math.floor((meetingDate.getTime() - now.getTime()) / (1000 * 60));
      if (minutesUntilStart === 0) {
        return 'Starting now';
      }
      return `Starting in ${minutesUntilStart}m`;
    }

    // Future meeting (more than 15 min away)
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) {
      return `in ${minutes} minutes`;
    } else if (hours < 24) {
      return `in ${hours} hours`;
    } else {
      const days = Math.floor(hours / 24);
      return `in ${days} day${days > 1 ? 's' : ''}`;
    }
  }

  joinVideoCall(meetingId: string) {
    this.router.navigate(['/video-call', meetingId]);
  }

  /**
   * Get the current real-time status of a meeting based on grace period logic
   * Returns: 'scheduled' | 'can-join-early' | 'in-progress' | 'ended'
   */
  getMeetingCurrentStatus(meeting: Meeting): string {
    const now = new Date();
    const scheduledAt = new Date(meeting.scheduledAt);
    const earlyJoinTime = new Date(scheduledAt.getTime() - this.EARLY_JOIN_MINUTES * 60000);
    const gracePeriodEnd = new Date(scheduledAt.getTime() + this.GRACE_PERIOD_MINUTES * 60000);

    // Check if meeting is cancelled or completed manually
    if (meeting.status === 'cancelled' || meeting.status === 'completed') {
      return 'ended';
    }

    // Scheduled (not yet in early join window)
    if (now < earlyJoinTime) {
      return 'scheduled';
    }

    // Can join early (15 min before start)
    if (now >= earlyJoinTime && now < scheduledAt) {
      return 'can-join-early';
    }

    // In progress or grace period (from start time to grace period end)
    if (now >= scheduledAt && now < gracePeriodEnd) {
      return 'in-progress';
    }

    // Grace period expired
    return 'ended';
  }

  /**
   * Check if a meeting is currently joinable
   */
  isMeetingJoinable(meeting: Meeting): boolean {
    const status = this.getMeetingCurrentStatus(meeting);
    return status === 'can-join-early' || status === 'in-progress';
  }

  /**
   * Get badge styling for meeting current status
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'can-join-early': return 'status-can-join';
      case 'in-progress': return 'status-in-progress';
      case 'ended': return 'status-ended';
      default: return '';
    }
  }

  /**
   * Get human-readable status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'can-join-early': return 'Ready to Join';
      case 'in-progress': return 'In Progress';
      case 'ended': return 'Ended';
      default: return status;
    }
  }
}

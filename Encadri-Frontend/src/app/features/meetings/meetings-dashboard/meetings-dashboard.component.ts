import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { Meeting, MeetingRequest, SupervisorAvailability } from '../../../core/models/meeting.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-meetings-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
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

  // Filters
  statusFilter = signal<string>('all');
  pastMeetings = signal<Meeting[]>([]);

  ngOnInit() {
    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
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

    // Load past meetings for history
    this.meetingService.getMeetings({ userEmail }).subscribe({
      next: (meetings) => {
        const now = new Date();
        this.pastMeetings.set(
          meetings.filter(m => new Date(m.scheduledAt) < now)
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

    this.meetingService.approveMeetingRequest(request.id, request.preferredDate).subscribe({
      next: () => {
        alert('Meeting request approved successfully!');
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to approve meeting request:', err);
        const errorMsg = err?.message || err?.error?.message || err?.title || 'Unknown error occurred';
        alert('Failed to approve meeting request: ' + errorMsg);
      }
    });
  }

  rejectMeetingRequest(request: MeetingRequest) {
    if (!request.id) return;

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    this.meetingService.rejectMeetingRequest(request.id, reason).subscribe({
      next: () => {
        alert('Meeting request rejected');
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to reject meeting request:', err);
        const errorMsg = err?.message || err?.error?.message || err?.title || 'Unknown error occurred';
        alert('Failed to reject meeting request: ' + errorMsg);
      }
    });
  }

  cancelMeeting(meeting: Meeting) {
    if (!confirm(`Are you sure you want to cancel "${meeting.title}"?`)) return;

    this.meetingService.deleteMeeting(meeting.id).subscribe({
      next: () => {
        alert('Meeting cancelled successfully');
        this.loadData();
      },
      error: (err) => {
        alert('Failed to cancel meeting: ' + err.message);
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
}

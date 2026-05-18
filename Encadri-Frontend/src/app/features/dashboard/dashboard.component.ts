import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { SubmissionService } from '../../core/services/submission.service';
import { MeetingService } from '../../core/services/meeting.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { StatisticsService, DashboardStats } from '../../core/services/statistics.service';
import { Project } from '../../core/models/project.model';
import { Submission } from '../../core/models/submission.model';
import { Meeting } from '../../core/models/meeting.model';
import { Milestone } from '../../core/models/milestone.model';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface UnifiedActivity {
  type: 'meeting' | 'submission' | 'milestone';
  title: string;
  date: Date;
  projectId: string;
  status?: string;
  performedBy?: string; // User who performed the activity
  data: Meeting | Submission | Milestone;
}

interface GroupedActivities {
  today: UnifiedActivity[];
  yesterday: UnifiedActivity[];
  thisWeek: UnifiedActivity[];
  older: UnifiedActivity[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UiCardComponent, UiButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('gradeChart') gradeChartCanvas?: ElementRef<HTMLCanvasElement>;

  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private submissionService = inject(SubmissionService);
  private meetingService = inject(MeetingService);
  private milestoneService = inject(MilestoneService);
  private statisticsService = inject(StatisticsService);

  myProjects = signal<Project[]>([]);
  collaborations = signal<Project[]>([]);
  submissions = signal<Submission[]>([]);
  meetings = signal<Meeting[]>([]);
  milestones = signal<Milestone[]>([]);
  stats = signal<DashboardStats | null>(null);

  // Activity filters and controls
  activityFilter = signal<'all' | 'meeting' | 'submission' | 'milestone'>('all');
  showOlderActivities = signal<boolean>(false);

  private gradeChart?: Chart;

  // Real statistics computed from actual data
  activeProjectsCount = computed(() => {
    return this.myProjects().filter(p => p.status === 'in_progress').length +
           this.collaborations().filter(p => p.status === 'in_progress').length;
  });

  totalProjectsCount = computed(() => {
    return this.myProjects().length + this.collaborations().length;
  });

  completedProjectsCount = computed(() => {
    return this.myProjects().filter(p => p.status === 'completed').length +
           this.collaborations().filter(p => p.status === 'completed').length;
  });

  pendingReviewsCount = computed(() => {
    return this.submissions().filter(s => s.status === 'pending').length;
  });

  approvedSubmissionsCount = computed(() => {
    return this.submissions().filter(s => s.status === 'approved').length;
  });

  needsRevisionCount = computed(() => {
    return this.submissions().filter(s => s.status === 'needs_revision').length;
  });

  upcomingMeetingsCount = computed(() => {
    const now = new Date();
    const userProjectIds = [
      ...this.myProjects().map(p => p.id),
      ...this.collaborations().map(p => p.id)
    ];

    return this.meetings().filter(m =>
      new Date(m.scheduledAt) > now &&
      userProjectIds.includes(m.projectId)
    ).length;
  });

  upcomingMilestones = computed(() => {
    const now = new Date();
    return this.milestones()
      .filter(m => m.status !== 'completed' && new Date(m.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  });

  recentMeetings = computed(() => {
    const now = new Date();
    const userProjectIds = [
      ...this.myProjects().map(p => p.id),
      ...this.collaborations().map(p => p.id)
    ];

    return this.meetings()
      .filter(m => userProjectIds.includes(m.projectId))
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 3);
  });

  recentSubmissions = computed(() => {
    const allSubmissions = this.submissions();

    // For supervisors, filter submissions related to their projects
    if (this.isSupervisor) {
      const myProjectIds = this.myProjects().map(p => p.id);
      return allSubmissions
        .filter(s => myProjectIds.includes(s.projectId))
        .sort((a, b) => {
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
    }

    // For students, show all their submissions
    return allSubmissions
      .sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  });

  // All activities with user context
  allActivities = computed(() => {
    const userProjectIds = [
      ...this.myProjects().map(p => p.id),
      ...this.collaborations().map(p => p.id)
    ];

    const activities: UnifiedActivity[] = [];
    const now = new Date();

    // Add meetings
    this.meetings()
      .filter(m => userProjectIds.includes(m.projectId))
      .forEach(meeting => {
        const meetingDate = new Date(meeting.scheduledAt);
        if (meetingDate <= now) { // Only show past/present meetings
          activities.push({
            type: 'meeting',
            title: meeting.title || 'Meeting',
            date: meetingDate,
            projectId: meeting.projectId,
            status: meeting.status,
            performedBy: meeting.requestedBy || meeting.studentEmail,
            data: meeting
          });
        }
      });

    // Add submissions
    const submissions = this.isSupervisor
      ? this.submissions().filter(s => this.myProjects().map(p => p.id).includes(s.projectId))
      : this.submissions();

    submissions.forEach(submission => {
      const submissionDate = submission.submittedAt ? new Date(submission.submittedAt) : new Date(submission.createdDate || Date.now());
      activities.push({
        type: 'submission',
        title: submission.title || 'Submission',
        date: submissionDate,
        projectId: submission.projectId,
        status: submission.status,
        performedBy: submission.submittedBy,
        data: submission
      });
    });

    // Add completed milestones only (as activities)
    this.milestones()
      .filter(m => userProjectIds.includes(m.projectId) && m.status === 'completed' && m.completedDate)
      .forEach(milestone => {
        const completedDate = new Date(milestone.completedDate!);
        activities.push({
          type: 'milestone',
          title: milestone.title || 'Milestone',
          date: completedDate,
          projectId: milestone.projectId,
          status: milestone.status,
          data: milestone
        });
      });

    // Sort by date (most recent first)
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  // Grouped activities by time period
  groupedActivities = computed(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000);

    const filter = this.activityFilter();
    const filteredActivities = filter === 'all'
      ? this.allActivities()
      : this.allActivities().filter(a => a.type === filter);

    const grouped: GroupedActivities = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    filteredActivities.forEach(activity => {
      if (activity.date >= todayStart) {
        grouped.today.push(activity);
      } else if (activity.date >= yesterdayStart) {
        grouped.yesterday.push(activity);
      } else if (activity.date >= thisWeekStart) {
        grouped.thisWeek.push(activity);
      } else {
        grouped.older.push(activity);
      }
    });

    return grouped;
  });

  // Recent activities for display (7 days default)
  recentActivities = computed(() => {
    const grouped = this.groupedActivities();
    return [...grouped.today, ...grouped.yesterday, ...grouped.thisWeek];
  });

  // Active projects for display (in_progress status only)
  activeProjects = computed(() => {
    return this.myProjects()
      .concat(this.collaborations())
      .filter(p => p.status === 'in_progress')
      .slice(0, 5);
  });

  get user() {
    return this.authService.currentUser();
  }

  get isStudent() {
    return this.user?.userRole === 'student';
  }

  get isSupervisor() {
    return this.user?.userRole === 'supervisor';
  }

  ngOnInit() {
    this.loadProjects();
    this.loadSubmissions();
    this.loadMeetings();
    this.loadMilestones();
    this.loadStats();
  }

  ngAfterViewInit() {
    if (this.isStudent) {
      setTimeout(() => this.initGradeChart(), 100);
    }
  }

  loadProjects() {
    const currentUser = this.user;
    if (currentUser) {
      this.projectService.getProjects(currentUser.email).subscribe(projects => {
        this.myProjects.set(projects.filter(p => p.ownerEmail === currentUser.email));
        this.collaborations.set(projects.filter(p => p.ownerEmail !== currentUser.email));
      });
    }
  }

  loadSubmissions() {
    this.submissionService.getSubmissions().subscribe({
      next: (data) => this.submissions.set(data),
      error: (err) => console.error('Failed to load submissions', err)
    });
  }

  loadMeetings() {
    this.meetingService.getMeetings().subscribe({
      next: (data) => this.meetings.set(data),
      error: (err) => console.error('Failed to load meetings', err)
    });
  }

  loadMilestones() {
    this.milestoneService.getMilestones().subscribe({
      next: (data) => this.milestones.set(data),
      error: (err) => console.error('Failed to load milestones', err)
    });
  }

  loadStats() {
    this.statisticsService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Failed to load statistics', err)
    });
  }

  initGradeChart() {
    if (!this.gradeChartCanvas?.nativeElement) return;

    const ctx = this.gradeChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Sample data - replace with real data from stats
    const gradeTrend = this.stats()?.gradeTrend || [
      { label: 'Projet 1', grade: 14 },
      { label: 'Projet 2', grade: 15.5 },
      { label: 'Projet 3', grade: 16 },
      { label: 'Projet 4', grade: 17 },
      { label: 'Projet 5', grade: 16.5 }
    ];

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: gradeTrend.map(g => g.label),
        datasets: [{
          label: 'Évolution des notes',
          data: gradeTrend.map(g => g.grade),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Note: ${context.parsed.y}/20`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 20,
            ticks: {
              stepSize: 5
            }
          }
        }
      }
    };

    this.gradeChart = new Chart(ctx, config);
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'badge-yellow',
      'approved': 'badge-green',
      'needs_revision': 'badge-red',
      'in_progress': 'badge-blue',
      'completed': 'badge-green',
      'not_started': 'badge-gray',
      'overdue': 'badge-red'
    };
    return statusMap[status] || 'badge-gray';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'approved': 'Approuvée',
      'needs_revision': 'À réviser',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'not_started': 'Non démarré',
      'overdue': 'En retard',
      'proposed': 'Proposé',
      'under_review': 'En révision',
      'archived': 'Archivé'
    };
    return labels[status] || status;
  }

  getProgressNote(percentage: number): string {
    if (percentage === 0) return 'Just getting started';
    if (percentage < 25) return 'Early stages';
    if (percentage < 50) return 'Making progress';
    if (percentage === 50) return 'Halfway there';
    if (percentage < 75) return 'More than halfway';
    if (percentage < 90) return 'Almost done';
    if (percentage < 100) return 'Nearly complete';
    return 'Completed!';
  }

  getProjectTitle(projectId: string): string {
    const project = this.myProjects()
      .concat(this.collaborations())
      .find(p => p.id === projectId);
    return project?.title || 'Unknown Project';
  }

  getActivityTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'meeting': 'Réunion',
      'submission': 'Soumission',
      'milestone': 'Jalon'
    };
    return labels[type] || type;
  }

  getActivityTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'meeting': 'activity-type-meeting',
      'submission': 'activity-type-submission',
      'milestone': 'activity-type-milestone'
    };
    return classes[type] || 'activity-type-default';
  }

  // Get user name from email
  getUserName(email?: string): string {
    if (!email) return 'Unknown User';

    // Check if it's current user
    if (email === this.user?.email) {
      return 'You';
    }

    // Look up in projects for student/supervisor names
    const allProjects = [...this.myProjects(), ...this.collaborations()];
    for (const project of allProjects) {
      if (project.studentEmail === email && project.studentName) {
        return project.studentName;
      }
      if (project.supervisorEmail === email && project.supervisorName) {
        return project.supervisorName;
      }
    }

    // Return email name part if no match found
    return email.split('@')[0];
  }

  // Get relative time display
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  // Filter methods
  setActivityFilter(filter: 'all' | 'meeting' | 'submission' | 'milestone') {
    this.activityFilter.set(filter);
  }

  toggleShowOlder() {
    this.showOlderActivities.update(value => !value);
  }

  // Check if has older activities
  hasOlderActivities(): boolean {
    return this.groupedActivities().older.length > 0;
  }
}

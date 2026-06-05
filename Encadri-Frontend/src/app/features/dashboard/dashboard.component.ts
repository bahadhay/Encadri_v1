import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { SubmissionService } from '../../core/services/submission.service';
import { MeetingService } from '../../core/services/meeting.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { StatisticsService, DashboardStats } from '../../core/services/statistics.service';
import { DeadlineAggregationService } from '../../core/services/deadline-aggregation.service';
import { Project } from '../../core/models/project.model';
import { Submission } from '../../core/models/submission.model';
import { Meeting } from '../../core/models/meeting.model';
import { Milestone } from '../../core/models/milestone.model';
import { UnifiedDeadline } from '../../core/models/unified-deadline.model';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { register } from 'swiper/element/bundle';

Chart.register(...registerables);
register();

interface UnifiedActivity {
  type: 'meeting' | 'submission' | 'milestone';
  title: string;
  date: Date;
  projectId: string;
  status?: string;
  performedBy?: string;
  data: Meeting | Submission | Milestone;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UiCardComponent, UiButtonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('gradeChart') gradeChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('studentSwiper') studentSwiper?: ElementRef<any>;
  @ViewChild('supervisorSwiper') supervisorSwiper?: ElementRef<any>;

  // Track current slide index for pagination dots
  currentSlideIndex = signal<number>(0);

  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private submissionService = inject(SubmissionService);
  private meetingService = inject(MeetingService);
  private milestoneService = inject(MilestoneService);
  private statisticsService = inject(StatisticsService);
  private deadlineAggregationService = inject(DeadlineAggregationService);

  myProjects = signal<Project[]>([]);
  collaborations = signal<Project[]>([]);
  submissions = signal<Submission[]>([]);
  meetings = signal<Meeting[]>([]);
  milestones = signal<Milestone[]>([]);
  unifiedDeadlines = signal<UnifiedDeadline[]>([]);
  stats = signal<DashboardStats | null>(null);
  selectedDeadlineTab = signal<'week' | 'month' | 'all'>('week');

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

  // All upcoming deadlines (unfiltered) - combines milestones, meetings, and project end dates
  private allUpcomingDeadlines = computed(() => {
    const deadlines = this.unifiedDeadlines();
    console.log('🔍 All unified deadlines from signal:', deadlines);
    return deadlines;
  });

  // Filtered deadlines based on selected tab (replaces upcomingMilestones)
  upcomingDeadlines = computed(() => {
    const tab = this.selectedDeadlineTab();
    const allDeadlines = this.allUpcomingDeadlines();

    console.log(`🔖 Selected tab: "${tab}"`);
    console.log(`📋 All upcoming deadlines for tab filtering:`, allDeadlines);

    let filtered: UnifiedDeadline[];

    switch(tab) {
      case 'week':
        filtered = allDeadlines.filter(d => {
          const result = this.isThisWeek(new Date(d.dueDate));
          console.log(`  - "${d.title}" (${d.type}) is this week? ${result}`);
          return result;
        });
        break;
      case 'month':
        filtered = allDeadlines.filter(d => {
          const result = this.isThisMonth(new Date(d.dueDate));
          console.log(`  - "${d.title}" (${d.type}) is this month? ${result}`);
          return result;
        });
        break;
      case 'all':
        // Show ALL upcoming deadlines without date filtering
        filtered = allDeadlines;
        console.log(`  - Showing all ${filtered.length} upcoming deadlines`);
        break;
      default:
        filtered = allDeadlines;
    }

    console.log(`✨ Final filtered deadlines for "${tab}" tab:`, filtered);
    return filtered.slice(0, 10); // Increased to 10 for carousel
  });

  // Keep for backward compatibility in template (alias for upcomingDeadlines)
  upcomingMilestones = computed(() => {
    return this.upcomingDeadlines();
  });

  // Counts for tab badges (updated to use unified deadlines)
  weekDeadlinesCount = computed(() =>
    this.allUpcomingDeadlines().filter(d => this.isThisWeek(new Date(d.dueDate))).length
  );

  monthDeadlinesCount = computed(() =>
    this.allUpcomingDeadlines().filter(d => this.isThisMonth(new Date(d.dueDate))).length
  );

  allDeadlinesCount = computed(() =>
    this.allUpcomingDeadlines().length
  );

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

  // Recent activities - last 24 hours, max 3 items
  recentActivities = computed(() => {
    const userProjectIds = [
      ...this.myProjects().map(p => p.id),
      ...this.collaborations().map(p => p.id)
    ];

    const activities: UnifiedActivity[] = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Add meetings from last 24 hours
    this.meetings()
      .filter(m => userProjectIds.includes(m.projectId))
      .forEach(meeting => {
        const meetingDate = new Date(meeting.scheduledAt);
        if (meetingDate >= twentyFourHoursAgo && meetingDate <= now) {
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

    // Add submissions from last 24 hours
    const submissions = this.isSupervisor
      ? this.submissions().filter(s => this.myProjects().map(p => p.id).includes(s.projectId))
      : this.submissions();

    submissions.forEach(submission => {
      const submissionDate = submission.submittedAt ? new Date(submission.submittedAt) : new Date(submission.createdDate || Date.now());
      if (submissionDate >= twentyFourHoursAgo && submissionDate <= now) {
        activities.push({
          type: 'submission',
          title: submission.title || 'Submission',
          date: submissionDate,
          projectId: submission.projectId,
          status: submission.status,
          performedBy: submission.submittedBy,
          data: submission
        });
      }
    });

    // Add completed milestones from last 24 hours
    this.milestones()
      .filter(m => userProjectIds.includes(m.projectId) && m.status === 'completed' && m.completedDate)
      .forEach(milestone => {
        const completedDate = new Date(milestone.completedDate!);
        if (completedDate >= twentyFourHoursAgo && completedDate <= now) {
          activities.push({
            type: 'milestone',
            title: milestone.title || 'Milestone',
            date: completedDate,
            projectId: milestone.projectId,
            status: milestone.status,
            data: milestone
          });
        }
      });

    // Sort by date (most recent first) and take top 3
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 3);
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

  // Date helper methods for deadline filtering
  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isThisWeek(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    weekFromNow.setHours(23, 59, 59, 999); // End of the 7th day

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= today && checkDate <= weekFromNow;
  }

  private isThisMonth(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    monthFromNow.setHours(23, 59, 59, 999); // End of the 30th day

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= today && checkDate <= monthFromNow;
  }

  private getDaysUntil(date: Date): number {
    const today = new Date();
    const diffMs = date.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // Priority badge methods
  getPriorityBadgeClass(dueDate: string | Date): string {
    const daysUntil = this.getDaysUntil(new Date(dueDate));

    if (daysUntil < 2) return 'priority-urgent';
    if (daysUntil <= 7) return 'priority-soon';
    return 'priority-future';
  }

  getPriorityLabel(dueDate: string | Date): string {
    const daysUntil = this.getDaysUntil(new Date(dueDate));

    if (daysUntil === 0) return 'Due Today';
    if (daysUntil === 1) return 'Due Tomorrow';
    if (daysUntil < 2) return 'Urgent';
    if (daysUntil <= 7) return 'Soon';
    return 'Future';
  }

  // Tab selection method
  selectDeadlineTab(tab: 'week' | 'month' | 'all') {
    this.selectedDeadlineTab.set(tab);
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
        this.aggregateDeadlines();
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
    const currentUser = this.user;
    if (currentUser) {
      this.meetingService.getMeetings({ userEmail: currentUser.email }).subscribe({
        next: (data) => {
          this.meetings.set(data);
          this.aggregateDeadlines();
        },
        error: (err) => console.error('Failed to load meetings', err)
      });
    }
  }

  loadMilestones() {
    const currentUser = this.user;
    const userEmail = currentUser?.email;
    this.milestoneService.getMilestones(undefined, userEmail).subscribe({
      next: (data) => {
        console.log('📅 Loaded milestones:', data.length, data);
        this.milestones.set(data);
        this.aggregateDeadlines();
        console.log('📊 Upcoming deadlines after aggregation:', this.allUpcomingDeadlines());
      },
      error: (err) => console.error('Failed to load milestones', err)
    });
  }

  loadStats() {
    this.statisticsService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Failed to load statistics', err)
    });
  }

  /**
   * Aggregate all deadline types (milestones, meetings, project end dates)
   * Called after loading any of the source data
   */
  aggregateDeadlines() {
    const allProjects = [...this.myProjects(), ...this.collaborations()];
    const aggregated = this.deadlineAggregationService.aggregateDeadlines(
      this.milestones(),
      this.meetings(),
      allProjects
    );
    this.unifiedDeadlines.set(aggregated);
    console.log('📊 Aggregated deadlines:', aggregated);
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
      'pending': 'Pending',
      'approved': 'Approved',
      'needs_revision': 'Needs Revision',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'not_started': 'Not Started',
      'overdue': 'Overdue',
      'proposed': 'Proposed',
      'under_review': 'Under Review',
      'archived': 'Archived'
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
      'meeting': 'Meeting',
      'submission': 'Submission',
      'milestone': 'Milestone'
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

  // Deadline type formatting
  getDeadlineTypeLabel(type: 'milestone' | 'meeting' | 'project-end'): string {
    const labels = {
      'milestone': 'Milestone',
      'meeting': 'Meeting',
      'project-end': 'Project End'
    };
    return labels[type];
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  // Swiper navigation methods
  nextSlide() {
    const swiper = this.isSupervisor ? this.supervisorSwiper : this.studentSwiper;
    if (swiper?.nativeElement?.swiper) {
      swiper.nativeElement.swiper.slideNext();
    }
  }

  prevSlide() {
    const swiper = this.isSupervisor ? this.supervisorSwiper : this.studentSwiper;
    if (swiper?.nativeElement?.swiper) {
      swiper.nativeElement.swiper.slidePrev();
    }
  }

  // Navigate to specific slide when dot is clicked
  goToSlide(index: number) {
    const swiper = this.isSupervisor ? this.supervisorSwiper : this.studentSwiper;
    if (swiper?.nativeElement?.swiper) {
      swiper.nativeElement.swiper.slideTo(index);
    }
  }

  // Update current slide index when slide changes
  onSlideChange(event: any) {
    if (event?.detail?.[0]?.activeIndex !== undefined) {
      this.currentSlideIndex.set(event.detail[0].activeIndex);
    }
  }
}

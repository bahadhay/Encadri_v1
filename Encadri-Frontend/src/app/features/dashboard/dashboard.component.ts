import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { SubmissionService } from '../../core/services/submission.service';
import { MeetingService } from '../../core/services/meeting.service';
import { Project } from '../../core/models/project.model';
import { Submission } from '../../core/models/submission.model';
import { Meeting } from '../../core/models/meeting.model';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UiCardComponent, UiButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private submissionService = inject(SubmissionService);
  private meetingService = inject(MeetingService);

  myProjects = signal<Project[]>([]);
  collaborations = signal<Project[]>([]);
  submissions = signal<Submission[]>([]);
  meetings = signal<Meeting[]>([]);

  // Real statistics computed from actual data
  activeProjectsCount = computed(() => {
    return this.myProjects().filter(p => p.status === 'in_progress').length +
           this.collaborations().filter(p => p.status === 'in_progress').length;
  });

  pendingReviewsCount = computed(() => {
    return this.submissions().filter(s => s.status === 'pending').length;
  });

  upcomingMeetingsCount = computed(() => {
    const now = new Date();
    // Get all project IDs that the user is involved in
    const userProjectIds = [
      ...this.myProjects().map(p => p.id),
      ...this.collaborations().map(p => p.id)
    ];

    // Filter meetings: upcoming AND in user's projects
    return this.meetings().filter(m =>
      new Date(m.scheduledAt) > now &&
      userProjectIds.includes(m.projectId)
    ).length;
  });

  get user() {
    return this.authService.currentUser();
  }

  ngOnInit() {
    this.loadProjects();
    this.loadSubmissions();
    this.loadMeetings();
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
}

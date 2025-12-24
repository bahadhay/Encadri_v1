import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubmissionService } from '../../../core/services/submission.service';
import { AuthService } from '../../../core/services/auth.service';
import { Submission } from '../../../core/models/submission.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiCardComponent, UiButtonComponent],
  templateUrl: './submission-detail.component.html',
  styleUrls: ['./submission-detail.component.css']
})
export class SubmissionDetailComponent {
  private route = inject(ActivatedRoute);
  private submissionService = inject(SubmissionService);
  private authService = inject(AuthService);

  submission = signal<Submission | null>(null);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // Review form state
  reviewFeedback = signal<string>('');
  reviewGrade = signal<number | null>(null);
  submitting = signal<boolean>(false);

  // Check if current user is supervisor
  get isSupervisor(): boolean {
    return this.authService.currentUser()?.userRole === 'supervisor';
  }

  // Check if submission can be reviewed (pending or needs_revision status)
  get canReview(): boolean {
    const status = this.submission()?.status;
    return status === 'pending' || status === 'needs_revision';
  }

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadSubmission(id);
      }
    });
  }

  loadSubmission(id: string) {
    this.loading.set(true);
    this.submissionService.getSubmission(id).subscribe({
      next: (data) => {
        this.submission.set(data);
        // Pre-fill existing feedback and grade
        this.reviewFeedback.set(data.feedback || '');
        this.reviewGrade.set(data.grade || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load submission details');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  // Approve submission
  approveSubmission() {
    const sub = this.submission();
    if (!sub || !sub.id) return;

    if (confirm('Are you sure you want to approve this submission?')) {
      this.updateSubmissionStatus(sub.id, 'approved', this.reviewFeedback(), this.reviewGrade());
    }
  }

  // Reject submission
  rejectSubmission() {
    const sub = this.submission();
    if (!sub || !sub.id) return;

    const feedback = this.reviewFeedback();
    if (!feedback.trim()) {
      alert('Please provide feedback explaining why this submission is rejected.');
      return;
    }

    if (confirm('Are you sure you want to reject this submission?')) {
      this.updateSubmissionStatus(sub.id, 'rejected', feedback, null);
    }
  }

  // Request revision
  requestRevision() {
    const sub = this.submission();
    if (!sub || !sub.id) return;

    const feedback = this.reviewFeedback();
    if (!feedback.trim()) {
      alert('Please provide feedback explaining what needs to be revised.');
      return;
    }

    if (confirm('Request revisions from the student?')) {
      this.updateSubmissionStatus(sub.id, 'needs_revision', feedback, null);
    }
  }

  // Save feedback and grade without changing status
  saveFeedback() {
    const sub = this.submission();
    if (!sub || !sub.id) return;

    this.updateSubmissionStatus(sub.id, 'reviewed', this.reviewFeedback(), this.reviewGrade());
  }

  // Update submission with new status, feedback, and grade
  private updateSubmissionStatus(id: string, status: string, feedback: string, grade: number | null) {
    this.submitting.set(true);

    const currentSubmission = this.submission();
    if (!currentSubmission) {
      console.error('No submission data available');
      this.submitting.set(false);
      return;
    }

    // Create full submission object with updates (remove submittedAt as backend doesn't have it)
    const { submittedAt, ...submissionData } = currentSubmission;
    const updates: Submission = {
      ...submissionData,
      status: status as any,
      feedback: feedback,
      grade: grade || undefined,
      updatedDate: new Date().toISOString()
    };

    console.log('Updating submission with:', updates);

    this.submissionService.updateSubmission(id, updates).subscribe({
      next: (updated) => {
        console.log('Submission updated successfully:', updated);
        this.submission.set(updated);
        this.reviewFeedback.set(updated.feedback || '');
        this.reviewGrade.set(updated.grade || null);
        this.submitting.set(false);
        alert(`Submission ${status} successfully!`);
      },
      error: (err) => {
        console.error('Failed to update submission - Full error:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error body:', err.error);
        this.submitting.set(false);
        alert(`Failed to update submission: ${err.error?.message || err.message || 'Unknown error'}`);
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_revision': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ').toUpperCase();
  }
}

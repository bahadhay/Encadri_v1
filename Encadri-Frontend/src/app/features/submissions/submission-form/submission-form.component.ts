import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SubmissionService } from '../../../core/services/submission.service';
import { AuthService } from '../../../core/services/auth.service';
import { Submission } from '../../../core/models/submission.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';

@Component({
  selector: 'app-submission-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiCardComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './submission-form.component.html',
  styleUrls: ['./submission-form.component.css']
})
export class SubmissionFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private submissionService = inject(SubmissionService);
  private authService = inject(AuthService);

  projectId: string | null = null;
  loading = false;
  error = '';

  // Form Model
  submission: Partial<Submission> = {
    title: '',
    type: 'report',
    description: '',
    fileUrl: '',
    status: 'pending'
  };



  isDragging = false;
  uploading = false;
  fileName: string | null = null; // Store file name for display

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    this.uploading = true;
    this.error = '';
    this.fileName = file.name; // Capture file name

    this.submissionService.uploadFile(file).subscribe({
      next: (response) => {
        this.submission.fileUrl = response.url; // Backend returns relative URL, should be proxied correctly
        this.uploading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'File upload failed.';
        this.uploading = false;
      }
    });
  }

  removeFile() {
    this.submission.fileUrl = '';
    this.fileName = null;
  }

  onSubmit() {
    if (!this.submission.title || !this.submission.description || !this.projectId) {
      this.error = 'Please fill in all required fields.';
      return;
    }

    this.loading = true;
    this.error = '';

    const currentUser = this.authService.currentUser();

    const submissionData = {
      ...this.submission,
      projectId: this.projectId,
      submittedBy: currentUser ? currentUser.email : 'Unknown', // Using email as per backend expectation
      submittedAt: new Date().toISOString()
    };

    this.submissionService.createSubmission(submissionData).subscribe({
      next: () => {
         this.router.navigate(['/projects', this.projectId], { queryParams: { tab: 'submissions' } });
      },
      error: (err) => {
        this.error = 'Failed to submit. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
  }
}

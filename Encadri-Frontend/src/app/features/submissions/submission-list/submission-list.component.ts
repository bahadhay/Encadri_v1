import { Component, inject, Input, OnChanges, OnInit, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubmissionService } from '../../../core/services/submission.service';
import { AuthService } from '../../../core/services/auth.service';
import { Submission } from '../../../core/models/submission.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-submission-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiCardComponent, UiButtonComponent, UiInputComponent, ModalComponent],
  templateUrl: './submission-list.component.html',
  styleUrls: ['./submission-list.component.css']
})
export class SubmissionListComponent implements OnInit, OnChanges {
  private submissionService = inject(SubmissionService);
  private authService = inject(AuthService);

  @Input() projectId?: string;

  submissions = signal<Submission[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');

  // Modal state
  isModalOpen = signal<boolean>(false);
  formLoading = signal<boolean>(false);
  formError = signal<string>('');

  // Form data
  submission: Partial<Submission> = this.getEmptySubmission();
  isDragging = false;
  uploading = false;
  fileName: string | null = null;

  getEmptySubmission(): Partial<Submission> {
    return {
      title: '',
      type: 'report',
      description: '',
      fileUrl: '',
      status: 'pending'
    };
  }

  ngOnInit() {
    // Load all submissions when component initializes (for standalone /submissions route)
    if (!this.projectId) {
      this.loadSubmissions();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Load submissions for specific project when projectId input changes
    if (changes['projectId'] && this.projectId) {
      this.loadSubmissions();
    }
  }

  loadSubmissions() {
    this.loading.set(true);
    this.submissionService.getSubmissions(this.projectId).subscribe({
      next: (data) => {
        this.submissions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load submissions', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.submission = this.getEmptySubmission();
    this.fileName = null;
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
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
    this.formError.set('');
    this.fileName = file.name;

    this.submissionService.uploadFile(file).subscribe({
      next: (response) => {
        this.submission.fileUrl = response.url;
        this.uploading = false;
      },
      error: (err) => {
        console.error(err);
        this.formError.set('File upload failed.');
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
      this.formError.set('Please fill in all required fields.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    const currentUser = this.authService.currentUser();

    const submissionData = {
      ...this.submission,
      projectId: this.projectId,
      submittedBy: currentUser ? currentUser.email : 'Unknown',
      submittedAt: new Date().toISOString()
    };

    this.submissionService.createSubmission(submissionData).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.closeModal();
        this.loadSubmissions();
      },
      error: (err) => {
        this.formError.set('Failed to submit. Please try again.');
        this.formLoading.set(false);
        console.error(err);
      }
    });
  }

  get filteredSubmissions() {
    return this.submissions().filter(s =>
      s.title.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      s.submittedBy.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ').toUpperCase();
  }
}

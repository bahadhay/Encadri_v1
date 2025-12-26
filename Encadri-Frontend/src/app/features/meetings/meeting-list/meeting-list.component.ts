import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { Meeting } from '../../../core/models/meeting.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiCardComponent, UiButtonComponent, UiInputComponent, ModalComponent],
  templateUrl: './meeting-list.component.html',
  styleUrls: ['./meeting-list.component.css']
})
export class MeetingListComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);

  @Input() projectId?: string;

  meetings = signal<Meeting[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');

  // Modal state
  isModalOpen = signal<boolean>(false);
  formLoading = signal<boolean>(false);
  formError = signal<string>('');

  // Form data
  meeting: Partial<Meeting> = this.getEmptyMeeting();
  scheduledDate = '';
  scheduledTime = '';

  getEmptyMeeting(): Partial<Meeting> {
    return {
      title: '',
      durationMinutes: 60,
      location: 'Online',
      status: 'pending',
      agenda: '',
      notes: '',
      meetingType: 'virtual'
    };
  }

  ngOnInit() {
    this.loadMeetings();
  }

  loadMeetings() {
    this.loading.set(true);
    this.meetingService.getMeetings(this.projectId ? { projectId: this.projectId } : undefined).subscribe({
      next: (data) => {
        this.meetings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load meetings', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.meeting = this.getEmptyMeeting();
    this.scheduledDate = '';
    this.scheduledTime = '';
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onSubmit() {
    if (!this.meeting.title || !this.scheduledDate || !this.scheduledTime || !this.projectId) {
      this.formError.set('Please fill in all required fields.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    const currentUser = this.authService.currentUser();
    const scheduledAt = new Date(`${this.scheduledDate}T${this.scheduledTime}`).toISOString();

    const meetingData = {
      ...this.meeting,
      projectId: this.projectId,
      scheduledAt: scheduledAt,
      requestedBy: currentUser ? currentUser.email : 'Unknown'
    };

    this.meetingService.createMeeting(meetingData).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.closeModal();
        this.loadMeetings();
      },
      error: (err) => {
        this.formError.set('Failed to schedule meeting. Please try again.');
        this.formLoading.set(false);
        console.error(err);
      }
    });
  }

  get filteredMeetings() {
    return this.meetings().filter(m =>
      m.title.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      (m.location && m.location.toLowerCase().includes(this.searchTerm().toLowerCase()))
    );
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ').toUpperCase();
  }
}

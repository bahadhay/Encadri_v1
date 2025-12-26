import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { Meeting } from '../../../core/models/meeting.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';

@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiCardComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './meeting-form.component.html',
  styleUrls: ['./meeting-form.component.css']
})
export class MeetingFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);

  projectId: string | null = null;
  loading = false;
  error = '';

  // Form Model
  meeting: Partial<Meeting> = {
    title: '',
    durationMinutes: 60,
    location: 'Online',
    status: 'pending',
    agenda: '',
    meetingType: 'virtual'
  };

  // Date/Time inputs
  scheduledDate = '';
  scheduledTime = '';

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
    });
  }

  onSubmit() {
    if (!this.meeting.title || !this.scheduledDate || !this.scheduledTime || !this.projectId) {
      this.error = 'Please fill in all required fields.';
      return;
    }

    this.loading = true;
    this.error = '';

    const currentUser = this.authService.currentUser();
    const scheduledAt = new Date(`${this.scheduledDate}T${this.scheduledTime}`).toISOString();

    const meetingData = {
      ...this.meeting,
      projectId: this.projectId,
      scheduledAt: scheduledAt,
      requestedBy: currentUser ? currentUser.email : 'Unknown'
    };

    // The backend endpoint is general, but logically this is linked to a project
    this.meetingService.createMeeting(meetingData).subscribe({
      next: () => {
         this.router.navigate(['/projects', this.projectId], { queryParams: { tab: 'meetings' } });
      },
      error: (err) => {
        this.error = 'Failed to schedule meeting. Please try again.';
        this.loading = false;
        console.error(err);
      }
    });
  }
}

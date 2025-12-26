import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { BulkMeetingInvite } from '../../../core/models/meeting.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-bulk-invite',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="bulk-invite-container">
      <div class="header">
        <h1>
          <app-icon name="group" [size]="32"></app-icon>
          Bulk Invite Students
        </h1>
        <p>Send meeting invitations to multiple students at once</p>
      </div>

      @if (error()) {
        <div class="alert alert-error">
          <app-icon name="error" [size]="20"></app-icon>
          {{ error() }}
        </div>
      }

      @if (success()) {
        <div class="alert alert-success">
          <app-icon name="check" [size]="20"></app-icon>
          {{ success() }}
        </div>
      }

      <div class="form-card">
        <h2>Meeting Details</h2>

        <div class="form-group">
          <label>Meeting Title *</label>
          <input type="text" [(ngModel)]="invite.title" placeholder="e.g., Weekly Progress Meeting">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input type="date" [(ngModel)]="scheduledDate">
          </div>

          <div class="form-group">
            <label>Time *</label>
            <input type="time" [(ngModel)]="scheduledTime">
          </div>
        </div>

        <div class="form-group">
          <label>Duration (minutes)</label>
          <input type="number" [(ngModel)]="invite.durationMinutes" min="15" step="15" placeholder="60">
        </div>

        <div class="form-group">
          <label>Location</label>
          <input type="text" [(ngModel)]="invite.location" placeholder="e.g., Office 301 or Online">
        </div>

        <div class="form-group">
          <label>Meeting Type</label>
          <select [(ngModel)]="invite.meetingType">
            <option value="virtual">Virtual</option>
            <option value="in-person">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div class="form-group">
          <label>Agenda</label>
          <textarea [(ngModel)]="invite.agenda" rows="4" placeholder="What will be discussed in this meeting?"></textarea>
        </div>

        <div class="info-box">
          <app-icon name="info" [size]="20"></app-icon>
          <p>This meeting invitation will be sent to all students you supervise.</p>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button class="btn btn-primary" (click)="sendInvitations()" [disabled]="loading() || !isValid()">
            {{ loading() ? 'Sending...' : 'Send Invitations' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bulk-invite-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h1 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .alert-error {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .alert-success {
      background-color: #d1fae5;
      color: #065f46;
    }

    .form-card {
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-card h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .info-box {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin: 1.5rem 0;
      color: #1e40af;
    }

    .info-box app-icon {
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-secondary {
      background-color: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background-color: #e5e7eb;
    }
  `]
})
export class BulkInviteComponent {
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  scheduledDate = '';
  scheduledTime = '';

  invite: BulkMeetingInvite = {
    supervisorEmail: this.currentUser()?.email || '',
    title: '',
    scheduledAt: '',
    durationMinutes: 60,
    location: '',
    agenda: '',
    meetingType: 'virtual'
  };

  isValid(): boolean {
    return !!(this.invite.title && this.scheduledDate && this.scheduledTime);
  }

  sendInvitations() {
    if (!this.isValid()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const scheduledAt = new Date(`${this.scheduledDate}T${this.scheduledTime}`).toISOString();
    const inviteData = { ...this.invite, scheduledAt };

    this.meetingService.bulkInviteStudents(inviteData).subscribe({
      next: (meetings) => {
        this.success.set(`Successfully sent ${meetings.length} meeting invitation(s)`);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/meetings']), 2000);
      },
      error: (err) => {
        this.error.set('Failed to send invitations. Please try again.');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/meetings']);
  }
}

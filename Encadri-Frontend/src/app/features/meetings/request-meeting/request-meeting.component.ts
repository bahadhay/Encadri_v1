import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { MeetingRequest } from '../../../core/models/meeting.model';
import { Project } from '../../../core/models/project.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-request-meeting',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="request-meeting-container">
      <div class="header">
        <h1>
          <app-icon name="calendar" [size]="32"></app-icon>
          Request Meeting
        </h1>
        <p>Request a meeting with your supervisor</p>
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
        <h2>Meeting Request Details</h2>

        <div class="form-group">
          <label>Select Project *</label>
          @if (loadingProjects()) {
            <p class="loading-text">Loading your projects...</p>
          } @else if (projects().length === 0) {
            <p class="info-text">No projects found. Please create a project first.</p>
          } @else {
            <select [(ngModel)]="selectedProjectId" (change)="onProjectChange()">
              <option value="">-- Select a project --</option>
              @for (project of projects(); track project.id) {
                <option [value]="project.id">{{ project.title }}</option>
              }
            </select>
          }
        </div>

        @if (selectedProject()) {
          <div class="project-info">
            <app-icon name="info" [size]="16"></app-icon>
            <span>Supervisor: {{ selectedProject()?.supervisorEmail }}</span>
          </div>
        }

        @if (loadingSlots()) {
          <p class="loading-text">Loading supervisor availability...</p>
        }

        @if (availableSlots().length > 0 && !loadingSlots()) {
          <div class="availability-info">
            <h3>Supervisor's Office Hours:</h3>
            <p class="hint-text">💡 Click on a time slot to auto-fill the date and time</p>
            <div class="slots-list">
              @for (daySlot of availableSlots(); track daySlot.day) {
                <div class="day-slot">
                  <strong>{{ daySlot.day }}:</strong>
                  @for (slot of daySlot.slots; track slot.id) {
                    <button
                      type="button"
                      class="time-badge"
                      [class.selected]="isSlotSelected(daySlot.day, slot.id)"
                      (click)="selectTimeSlot(daySlot.day, slot)">
                      {{ slot.startTime }} - {{ slot.endTime }}
                      @if (slot.location) {
                        <span class="location-hint">📍 {{ slot.location }}</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        }

        <div class="form-group">
          <label>Meeting Title</label>
          <input type="text" [(ngModel)]="request.title" placeholder="e.g., Progress Update">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Preferred Date *</label>
            <input type="date" [(ngModel)]="preferredDate">
          </div>

          <div class="form-group">
            <label>Preferred Time *</label>
            <input type="time" [(ngModel)]="preferredTime">
          </div>
        </div>

        <div class="form-group">
          <label>Duration (minutes)</label>
          <input type="number" [(ngModel)]="request.durationMinutes" min="15" step="15" placeholder="30">
        </div>

        <div class="form-group">
          <label>Agenda *</label>
          <textarea [(ngModel)]="request.agenda" rows="4" placeholder="What would you like to discuss?"></textarea>
        </div>

        <div class="info-box">
          <app-icon name="info" [size]="20"></app-icon>
          <p>Your supervisor will review this request and either approve or suggest an alternative time.</p>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button class="btn btn-primary" (click)="submitRequest()" [disabled]="loading() || !isValid()">
            {{ loading() ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .request-meeting-container {
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
    .form-group textarea {
      padding: 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .form-group input:focus,
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

    .loading-text {
      color: #6b7280;
      font-style: italic;
      margin: 0;
      padding: 0.625rem;
    }

    .info-text {
      color: #6b7280;
      margin: 0;
      padding: 0.625rem;
    }

    .project-info {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 0.375rem;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: #0369a1;
      font-size: 0.875rem;
    }

    .availability-info {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .availability-info h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #166534;
      margin-bottom: 0.75rem;
    }

    .slots-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .day-slot {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .day-slot strong {
      color: #166534;
      min-width: 100px;
    }

    .time-badge {
      background-color: #dcfce7;
      border: 1px solid #86efac;
      color: #166534;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.813rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .time-badge:hover {
      background-color: #bbf7d0;
      border-color: #4ade80;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(22, 101, 52, 0.1);
    }

    .time-badge.selected {
      background-color: #22c55e;
      border-color: #16a34a;
      color: white;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
    }

    .time-badge.selected:hover {
      background-color: #16a34a;
      transform: translateY(-1px);
    }

    .location-hint {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    .hint-text {
      color: #15803d;
      font-size: 0.875rem;
      margin: 0;
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
export class RequestMeetingComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  loading = signal(false);
  loadingProjects = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  projects = signal<Project[]>([]);
  selectedProjectId = '';
  selectedProject = signal<Project | null>(null);
  availableSlots = signal<any[]>([]);
  loadingSlots = signal(false);
  selectedSlot = signal<{day: string, slotId: string} | null>(null);

  preferredDate = '';
  preferredTime = '';
  selectedDayOfWeek = '';

  request: Partial<MeetingRequest> = {
    studentEmail: this.currentUser()?.email || '',
    supervisorEmail: '',
    projectId: '',
    title: '',
    agenda: '',
    durationMinutes: 30,
    status: 'pending'
  };

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loadingProjects.set(true);
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        // Filter to show only projects where user is a student
        const userEmail = this.currentUser()?.email;
        const userProjects = projects.filter(p => p.studentEmail === userEmail);
        this.projects.set(userProjects);
        this.loadingProjects.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load projects');
        this.loadingProjects.set(false);
      }
    });
  }

  onProjectChange() {
    const project = this.projects().find(p => p.id === this.selectedProjectId);
    if (project) {
      this.selectedProject.set(project);
      this.request.projectId = project.id;
      this.request.supervisorEmail = project.supervisorEmail;

      // Load supervisor's availability
      if (project.supervisorEmail) {
        this.loadSupervisorAvailability(project.supervisorEmail);
      }
    } else {
      this.selectedProject.set(null);
      this.request.projectId = '';
      this.request.supervisorEmail = '';
      this.availableSlots.set([]);
    }
  }

  loadSupervisorAvailability(supervisorEmail: string) {
    this.loadingSlots.set(true);
    this.meetingService.getWeeklySchedule(supervisorEmail).subscribe({
      next: (schedule) => {
        this.availableSlots.set(schedule);
        this.loadingSlots.set(false);
      },
      error: (err) => {
        console.error('Failed to load availability:', err);
        this.availableSlots.set([]);
        this.loadingSlots.set(false);
      }
    });
  }

  selectTimeSlot(day: string, slot: any) {
    this.selectedSlot.set({day, slotId: slot.id});

    // Calculate the next occurrence of this day
    const targetDate = this.getNextDayOfWeek(day);

    // Format date as YYYY-MM-DD for the input
    this.preferredDate = targetDate.toISOString().split('T')[0];

    // Set the start time
    this.preferredTime = slot.startTime;
  }

  getNextDayOfWeek(dayName: string): Date {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(dayName);

    const today = new Date();
    const currentDay = today.getDay();

    // Calculate days until target day
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
      daysUntil += 7; // Get next week's occurrence
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);

    return nextDate;
  }

  isSlotSelected(day: string, slotId: string): boolean {
    const selected = this.selectedSlot();
    return selected?.day === day && selected?.slotId === slotId;
  }

  isValid(): boolean {
    return !!(
      this.request.supervisorEmail &&
      this.request.projectId &&
      this.request.agenda &&
      this.preferredDate &&
      this.preferredTime
    );
  }

  submitRequest() {
    if (!this.isValid()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const preferredDate = new Date(`${this.preferredDate}T${this.preferredTime}`).toISOString();
    const requestData = { ...this.request, preferredDate };

    this.meetingService.createMeetingRequest(requestData).subscribe({
      next: () => {
        this.success.set('Meeting request submitted successfully!');
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/meetings']), 2000);
      },
      error: (err) => {
        this.error.set('Failed to submit meeting request. Please try again.');
        this.loading.set(false);
      }
    });
  }

  cancel() {
    this.router.navigate(['/meetings']);
  }
}

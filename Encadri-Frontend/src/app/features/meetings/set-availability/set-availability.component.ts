import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupervisorAvailability } from '../../../core/models/meeting.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-set-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './set-availability.component.html',
  styleUrls: ['./set-availability.component.css']
})
export class SetAvailabilityComponent implements OnInit {
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  availabilities = signal<Partial<SupervisorAvailability>[]>([]);

  ngOnInit() {
    this.loadAvailability();
  }

  loadAvailability() {
    const userEmail = this.currentUser()?.email;
    if (!userEmail) return;

    this.loading.set(true);
    this.meetingService.getAvailability({ supervisorEmail: userEmail, activeOnly: true }).subscribe({
      next: (data) => {
        this.availabilities.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load availability');
        this.loading.set(false);
      }
    });
  }

  addTimeSlot() {
    const userEmail = this.currentUser()?.email;
    if (!userEmail) return;

    this.availabilities.update(slots => [
      ...slots,
      {
        supervisorEmail: userEmail,
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        isRecurring: true,
        location: 'Office',
        isActive: true
      }
    ]);
  }

  removeTimeSlot(index: number) {
    const slot = this.availabilities()[index];
    if (slot.id) {
      // If it's saved, delete it from backend
      this.meetingService.deleteAvailability(slot.id).subscribe({
        next: () => {
          this.availabilities.update(slots => slots.filter((_, i) => i !== index));
          this.success.set('Time slot removed');
        },
        error: () => {
          this.error.set('Failed to remove time slot');
        }
      });
    } else {
      // Just remove from local array
      this.availabilities.update(slots => slots.filter((_, i) => i !== index));
    }
  }

  saveAvailability() {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const newSlots = this.availabilities().filter(slot => !slot.id);

    if (newSlots.length === 0) {
      this.success.set('Availability updated');
      this.loading.set(false);
      return;
    }

    // Validate that all required fields are filled
    for (const slot of newSlots) {
      if (!slot.dayOfWeek || !slot.startTime || !slot.endTime || !slot.supervisorEmail) {
        this.error.set('Please fill in all time slot fields');
        this.loading.set(false);
        return;
      }
    }

    // Format the slots to ensure proper TimeSpan format for .NET backend
    const formattedSlots = newSlots.map(slot => ({
      ...slot,
      startTime: this.formatTimeForBackend(slot.startTime!),
      endTime: this.formatTimeForBackend(slot.endTime!)
    }));

    console.log('Sending availability data:', formattedSlots);

    this.meetingService.bulkCreateAvailability(formattedSlots).subscribe({
      next: () => {
        this.success.set('Availability saved successfully');
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/meetings']), 1500);
      },
      error: (err) => {
        console.error('Failed to save availability:', err);
        console.error('Error details:', err.error);

        let errorMsg = 'Failed to save availability';

        // Try to extract detailed error message
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error.errors) {
            // Validation errors
            const validationErrors = Object.values(err.error.errors).flat();
            errorMsg = validationErrors.join(', ');
          } else if (err.error.title) {
            errorMsg = err.error.title;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          }
        }

        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  // Convert HH:mm to TimeSpan format that .NET expects (HH:mm:ss)
  formatTimeForBackend(time: string): string {
    if (time.split(':').length === 2) {
      return `${time}:00`; // Add seconds
    }
    return time;
  }

  clearAllAvailability() {
    if (!confirm('Are you sure you want to clear all availability?')) return;

    const userEmail = this.currentUser()?.email;
    if (!userEmail) return;

    this.meetingService.clearAllAvailability(userEmail).subscribe({
      next: () => {
        this.availabilities.set([]);
        this.success.set('All availability cleared');
      },
      error: () => {
        this.error.set('Failed to clear availability');
      }
    });
  }

  cancel() {
    this.router.navigate(['/meetings']);
  }

  updateSlot(index: number, field: string, value: any) {
    this.availabilities.update(slots => {
      const updated = [...slots];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }
}

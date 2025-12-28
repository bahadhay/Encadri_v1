import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CalendarService, CalendarEvent } from '../../core/services/calendar.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiCardComponent,
    UiButtonComponent,
    IconComponent
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  private calendarService = inject(CalendarService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  currentDate = signal<Date>(new Date());
  events = signal<CalendarEvent[]>([]);
  loading = signal<boolean>(false);
  selectedEvent = signal<CalendarEvent | null>(null);

  // Computed values
  currentMonth = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get starting day (Sunday)
    const startingDayOfWeek = firstDay.getDay();

    // Calculate days to show
    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate).filter(e => e.type !== 'milestone') // Exclude milestones
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(year, month, day);
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate).filter(e => e.type !== 'milestone') // Exclude milestones
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate).filter(e => e.type !== 'milestone') // Exclude milestones
      });
    }

    return days;
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.loading.set(true);

    // Load 3 months window for calendar view
    const date = this.currentDate();
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);

    this.calendarService.getEvents(currentUser.email, currentUser.userRole, start, end).subscribe({
      next: (events) => {
        // Convert string dates to Date objects and filter out milestones
        const processedEvents = events
          .filter(e => e.type !== 'milestone') // Only show meetings and submissions
          .map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          }));
        this.events.set(processedEvents);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load calendar events', err);
        this.toastService.error('Failed to load calendar events');
        this.loading.set(false);
      }
    });
  }

  previousMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.loadEvents();
  }

  nextMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.loadEvents();
  }

  today() {
    this.currentDate.set(new Date());
    this.loadEvents();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    return this.events().filter(event => {
      const eventStart = new Date(event.start);
      return this.isSameDate(eventStart, date);
    });
  }

  selectEvent(event: CalendarEvent) {
    this.selectedEvent.set(event);
  }

  closeEventDetail() {
    this.selectedEvent.set(null);
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'meeting': return 'calendar_month';
      case 'submission': return 'description';
      case 'milestone': return 'flag';
      default: return 'event';
    }
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  navigateToEvent(event: CalendarEvent) {
    // This will be implemented based on event type
    this.toastService.info(`Navigate to ${event.type}: ${event.title}`);
  }
}

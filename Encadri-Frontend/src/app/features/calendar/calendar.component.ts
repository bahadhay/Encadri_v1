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
  viewMode = signal<'calendar' | 'timeline' | 'gantt'>('timeline');

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
        events: this.getEventsForDate(dayDate)
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(year, month, day);
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate)
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
        events: this.getEventsForDate(dayDate)
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

    // For timeline and gantt views, load all events (past and future)
    // For calendar view, load 3 months window
    const viewMode = this.viewMode();
    let start: Date;
    let end: Date;

    if (viewMode === 'calendar') {
      const date = this.currentDate();
      start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    } else {
      // Load 6 months past and 12 months future for timeline/gantt
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 12, 0);
    }

    this.calendarService.getEvents(currentUser.email, currentUser.userRole, start, end).subscribe({
      next: (events) => {
        // Convert string dates to Date objects
        const processedEvents = events.map(event => ({
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

  setViewMode(mode: 'calendar' | 'timeline' | 'gantt') {
    this.viewMode.set(mode);
    this.loadEvents();
  }

  // Timeline view: events sorted by date with month headers
  timelineEvents = computed(() => {
    const events = this.events().sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // Group by month
    const grouped: { [key: string]: CalendarEvent[] } = {};
    events.forEach(event => {
      const date = new Date(event.start);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(event);
    });

    return Object.entries(grouped).map(([key, events]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month, 1);
      return {
        monthYear: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        events
      };
    });
  });

  // Gantt view: milestones grouped by project with timeline positioning
  ganttData = computed(() => {
    const milestones = this.events().filter(e => e.type === 'milestone');

    // Get current year
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1); // Jan 1
    const yearEnd = new Date(currentYear, 11, 31); // Dec 31

    // Group by project NAME
    const grouped: { [key: string]: CalendarEvent[] } = {};
    milestones.forEach(milestone => {
      const projectName = milestone.projectName || 'Unknown Project';
      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }
      grouped[projectName].push(milestone);
    });

    // Calculate positions and widths for each milestone
    return Object.entries(grouped).map(([projectName, milestones]) => {
      const milestonesWithPosition = milestones.map(milestone => {
        const endDate = new Date(milestone.start); // DueDate
        // Calculate start date (assume 2 weeks duration)
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 14);

        const startPosition = this.calculatePosition(startDate, yearStart, yearEnd);
        const endPosition = this.calculatePosition(endDate, yearStart, yearEnd);
        const width = endPosition - startPosition;

        return {
          ...milestone,
          position: startPosition,
          width: width,
          calculatedStart: startDate,
          calculatedEnd: endDate
        };
      });

      return {
        projectName,
        milestones: milestonesWithPosition.sort((a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
        )
      };
    });
  });

  // Generate 52 weeks for timeline header
  timelineWeeks = computed(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const weeks: any[] = [];

    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(yearStart);
      weekStart.setDate(yearStart.getDate() + (i * 7));

      weeks.push({
        weekNumber: i + 1,
        label: `W${i + 1}`,
        fullLabel: `Week ${i + 1}`,
        startDate: weekStart
      });
    }

    return weeks;
  });

  calculatePosition(date: Date, yearStart: Date, yearEnd: Date): number {
    const dateTime = date.getTime();
    const startTime = yearStart.getTime();
    const endTime = yearEnd.getTime();
    const totalDuration = endTime - startTime;
    const elapsed = dateTime - startTime;
    return (elapsed / totalDuration) * 100;
  }

  formatDateShort(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

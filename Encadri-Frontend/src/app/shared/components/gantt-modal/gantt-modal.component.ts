import { Component, inject, signal, computed, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService, CalendarEvent } from '../../../core/services/calendar.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-gantt-modal',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent
  ],
  templateUrl: './gantt-modal.component.html',
  styleUrls: ['./gantt-modal.component.css']
})
export class GanttModalComponent implements OnInit {
  @Input() projectId!: string;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private calendarService = inject(CalendarService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  events = signal<CalendarEvent[]>([]);
  loading = signal<boolean>(false);
  selectedEvent = signal<CalendarEvent | null>(null);

  ngOnInit() {
    if (this.projectId) {
      this.loadMilestones();
    }
  }

  loadMilestones() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.loading.set(true);

    // Load 6 months past and 12 months future for Gantt view
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);

    this.calendarService.getEvents(currentUser.email, currentUser.userRole, start, end).subscribe({
      next: (events) => {
        // Convert string dates to Date objects and filter only milestones
        const processedEvents = events
          .filter(e => e.type === 'milestone')
          .map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          }));
        this.events.set(processedEvents);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load milestones for Gantt chart', err);
        this.toastService.error('Failed to load milestones');
        this.loading.set(false);
      }
    });
  }

  // Gantt view: milestones grouped by project with timeline positioning
  ganttData = computed(() => {
    const milestones = this.events().filter(e => e.type === 'milestone');

    if (milestones.length === 0) {
      return [];
    }

    // Find min and max dates across all milestones
    const allDates = milestones.flatMap(m => [new Date(m.start), new Date(m.end)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Add padding (2 weeks before first, 2 weeks after last)
    const timelineStart = new Date(minDate);
    timelineStart.setDate(timelineStart.getDate() - 14);
    const timelineEnd = new Date(maxDate);
    timelineEnd.setDate(timelineEnd.getDate() + 14);

    // Group by project NAME
    const grouped: { [key: string]: CalendarEvent[] } = {};
    milestones.forEach(milestone => {
      const projectName = milestone.projectName || 'Unknown Project';
      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }
      grouped[projectName].push(milestone);
    });

    // Calculate positions and widths for each milestone using actual dates
    return Object.entries(grouped).map(([projectName, milestones]) => {
      const milestonesWithPosition = milestones.map(milestone => {
        const startDate = new Date(milestone.start);
        const endDate = new Date(milestone.end);

        const startPosition = this.calculatePosition(startDate, timelineStart, timelineEnd);
        const endPosition = this.calculatePosition(endDate, timelineStart, timelineEnd);
        let width = endPosition - startPosition;

        // Ensure minimum width of 3% for visibility
        if (width < 3) {
          width = 3;
        }

        return {
          ...milestone,
          position: startPosition,
          width: width,
          timelineStart,
          timelineEnd
        };
      });

      return {
        projectName,
        milestones: milestonesWithPosition.sort((a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
        ),
        timelineStart,
        timelineEnd
      };
    });
  });

  // Generate adaptive weeks for timeline header based on milestone dates
  timelineWeeks = computed(() => {
    const ganttData = this.ganttData();

    if (ganttData.length === 0) {
      return [];
    }

    // Use the timeline from first project (all should be same)
    const firstProject = ganttData[0];
    if (!firstProject.timelineStart || !firstProject.timelineEnd) {
      return [];
    }

    const timelineStart = new Date(firstProject.timelineStart);
    const timelineEnd = new Date(firstProject.timelineEnd);

    // Calculate number of weeks needed
    const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.ceil(totalDays / 7);

    const weeks: any[] = [];
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(timelineStart);
      weekStart.setDate(timelineStart.getDate() + (i * 7));

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

  selectEvent(event: CalendarEvent) {
    this.selectedEvent.set(event);
  }

  closeEventDetail() {
    this.selectedEvent.set(null);
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'meeting': return 'calendar_month';
      case 'submission': return 'description';
      case 'milestone': return 'flag';
      default: return 'event';
    }
  }

  closeModal() {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent) {
    this.closeModal();
  }

  onModalContentClick(event: MouseEvent) {
    event.stopPropagation();
  }
}

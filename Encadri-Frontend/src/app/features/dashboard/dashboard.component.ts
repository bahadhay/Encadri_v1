import { Component, inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StatisticsService, DashboardStats } from '../../core/services/statistics.service';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, UiCardComponent, UiButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private statisticsService = inject(StatisticsService);

  @ViewChild('submissionChart') submissionChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('gradeTrendChart') gradeTrendChartCanvas?: ElementRef<HTMLCanvasElement>;

  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(true);
  error = signal<string>('');

  private submissionChart?: Chart;
  private gradeTrendChart?: Chart;

  get user() {
    return this.authService.currentUser();
  }

  get isStudent() {
    return this.user?.userRole?.toLowerCase() === 'student';
  }

  get isSupervisor() {
    return this.user?.userRole?.toLowerCase() === 'supervisor';
  }

  ngOnInit() {
    this.loadDashboardStats();
  }

  ngAfterViewInit() {
    // Charts will be created after data is loaded
  }

  loadDashboardStats() {
    this.loading.set(true);
    this.statisticsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
        // Wait for view to update before creating charts
        setTimeout(() => this.createCharts(data), 0);
      },
      error: (err) => {
        console.error('Failed to load dashboard statistics', err);
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
      }
    });
  }

  createCharts(stats: DashboardStats) {
    this.createSubmissionChart(stats);
    if (this.isStudent) {
      this.createGradeTrendChart(stats);
    }
  }

  createSubmissionChart(stats: DashboardStats) {
    if (!this.submissionChartCanvas || stats.totalSubmissions === 0) return;

    // Destroy existing chart if it exists
    if (this.submissionChart) {
      this.submissionChart.destroy();
    }

    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];

    if (stats.approvedSubmissions > 0) {
      labels.push('Approved');
      data.push(stats.approvedSubmissions);
      colors.push('#10b981');
    }
    if (stats.pendingSubmissions > 0) {
      labels.push('Pending');
      data.push(stats.pendingSubmissions);
      colors.push('#f59e0b');
    }
    if (stats.rejectedSubmissions > 0) {
      labels.push('Rejected');
      data.push(stats.rejectedSubmissions);
      colors.push('#ef4444');
    }
    if (stats.reviewedSubmissions && stats.reviewedSubmissions > 0) {
      labels.push('Reviewed');
      data.push(stats.reviewedSubmissions);
      colors.push('#3b82f6');
    }
    if (stats.needsRevisionSubmissions && stats.needsRevisionSubmissions > 0) {
      labels.push('Needs Revision');
      data.push(stats.needsRevisionSubmissions);
      colors.push('#f97316');
    }

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          }
        }
      }
    };

    this.submissionChart = new Chart(this.submissionChartCanvas.nativeElement, config);
  }

  createGradeTrendChart(stats: DashboardStats) {
    if (!this.gradeTrendChartCanvas || !stats.gradeTrend || stats.gradeTrend.length === 0) return;

    // Destroy existing chart if it exists
    if (this.gradeTrendChart) {
      this.gradeTrendChart.destroy();
    }

    const labels = stats.gradeTrend.map((item: any) => {
      const title = item.title || 'Submission';
      return title.length > 15 ? title.substring(0, 15) + '...' : title;
    });

    const grades = stats.gradeTrend.map((item: any) => item.grade || 0);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Grade (out of 20)',
          data: grades,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 20,
            ticks: {
              stepSize: 5
            }
          }
        }
      }
    };

    this.gradeTrendChart = new Chart(this.gradeTrendChartCanvas.nativeElement, config);
  }

  getProgressColor(percentage: number): string {
    if (percentage < 25) return '#ef4444'; // Red
    if (percentage < 50) return '#f59e0b'; // Orange
    if (percentage < 75) return '#3b82f6'; // Blue
    return '#10b981'; // Green
  }

  getProgressText(percentage: number): string {
    if (percentage < 25) return 'Just started';
    if (percentage < 50) return 'Making progress';
    if (percentage < 75) return 'Halfway there';
    if (percentage < 100) return 'Almost done';
    return 'Completed';
  }

  ngOnDestroy() {
    // Clean up charts
    if (this.submissionChart) {
      this.submissionChart.destroy();
    }
    if (this.gradeTrendChart) {
      this.gradeTrendChart.destroy();
    }
  }
}

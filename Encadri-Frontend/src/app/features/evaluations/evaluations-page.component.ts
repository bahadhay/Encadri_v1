import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EvaluationService } from '../../core/services/evaluation.service';
import { Evaluation } from '../../core/models/evaluation.model';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-evaluations-page',
  standalone: true,
  imports: [CommonModule, RouterModule, UiCardComponent, UiButtonComponent, SkeletonCardComponent],
  template: `
    <div class="evaluations-page">
      <div class="page-header">
        <h1>All Evaluations</h1>
        <p class="page-description">View and manage all project evaluations</p>
      </div>

      <div class="evaluations-content">
        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-grid">
          <app-skeleton-card *ngFor="let i of [1,2,3,4]"></app-skeleton-card>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && evaluations().length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>No Evaluations Yet</h3>
          <p>Evaluations will appear here once they are created for projects.</p>
        </div>

        <!-- Evaluations Grid -->
        <div *ngIf="!loading() && evaluations().length > 0" class="evaluations-grid">
          <app-ui-card *ngFor="let evaluation of evaluations()">
            <div class="evaluation-card">
              <div class="evaluation-header">
                <h3 class="evaluation-title">Project Evaluation</h3>
                <span class="evaluation-grade" [class.excellent]="(evaluation.finalGrade || 0) >= 80"
                                               [class.good]="(evaluation.finalGrade || 0) >= 60 && (evaluation.finalGrade || 0) < 80"
                                               [class.average]="(evaluation.finalGrade || 0) < 60">
                  {{ evaluation.finalGrade || 0 }}/100
                </span>
              </div>

              <div class="evaluation-details">
                <div class="detail-row">
                  <span class="detail-label">Project ID:</span>
                  <span class="detail-value">{{ evaluation.projectId }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Evaluator:</span>
                  <span class="detail-value">{{ evaluation.evaluatorName || evaluation.evaluatorEmail }}</span>
                </div>
                <div class="detail-row" *ngIf="evaluation.defenseDate">
                  <span class="detail-label">Defense Date:</span>
                  <span class="detail-value">{{ evaluation.defenseDate | date:'medium' }}</span>
                </div>
              </div>

              <div class="evaluation-scores">
                <div class="score-item">
                  <span class="score-label">Report Quality</span>
                  <span class="score-value">{{ evaluation.reportQualityScore || 0 }}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">Technical</span>
                  <span class="score-value">{{ evaluation.technicalImplementationScore || 0 }}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">Presentation</span>
                  <span class="score-value">{{ evaluation.presentationScore || 0 }}</span>
                </div>
                <div class="score-item">
                  <span class="score-label">Conduct</span>
                  <span class="score-value">{{ evaluation.professionalConductScore || 0 }}</span>
                </div>
              </div>

              <div class="evaluation-comments" *ngIf="evaluation.comments">
                <h4>Comments</h4>
                <p>{{ evaluation.comments }}</p>
              </div>

              <div class="evaluation-actions">
                <app-ui-button
                  [routerLink]="['/projects', evaluation.projectId]"
                  variant="outline"
                  size="sm">
                  View Project
                </app-ui-button>
              </div>
            </div>
          </app-ui-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .evaluations-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .page-description {
      color: #718096;
      font-size: 1rem;
    }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #718096;
    }

    .evaluations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .evaluation-card {
      padding: 1.5rem;
    }

    .evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .evaluation-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2d3748;
      margin: 0;
    }

    .evaluation-grade {
      font-size: 1.5rem;
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background-color: #edf2f7;
      color: #4a5568;
    }

    .evaluation-grade.excellent {
      background-color: #c6f6d5;
      color: #22543d;
    }

    .evaluation-grade.good {
      background-color: #bee3f8;
      color: #2c5282;
    }

    .evaluation-grade.average {
      background-color: #fed7d7;
      color: #742a2a;
    }

    .evaluation-details {
      margin-bottom: 1.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f7fafc;
    }

    .detail-label {
      font-weight: 500;
      color: #4a5568;
    }

    .detail-value {
      color: #2d3748;
    }

    .evaluation-scores {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f7fafc;
      border-radius: 0.5rem;
    }

    .score-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .score-label {
      font-size: 0.875rem;
      color: #718096;
      margin-bottom: 0.25rem;
    }

    .score-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #2d3748;
    }

    .evaluation-comments {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: #f7fafc;
      border-radius: 0.5rem;
    }

    .evaluation-comments h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 0.5rem;
    }

    .evaluation-comments p {
      font-size: 0.875rem;
      color: #2d3748;
      line-height: 1.5;
      margin: 0;
    }

    .evaluation-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    @media (max-width: 768px) {
      .evaluations-page {
        padding: 1rem;
      }

      .page-header h1 {
        font-size: 1.5rem;
      }

      .evaluations-grid {
        grid-template-columns: 1fr;
      }

      .evaluation-scores {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EvaluationsPageComponent implements OnInit {
  private evaluationService = inject(EvaluationService);

  evaluations = signal<Evaluation[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadAllEvaluations();
  }

  loadAllEvaluations() {
    this.loading.set(true);
    // Call getEvaluations without projectId to get all evaluations
    this.evaluationService.getEvaluations().subscribe({
      next: (data) => {
        this.evaluations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load evaluations', err);
        this.loading.set(false);
      }
    });
  }
}

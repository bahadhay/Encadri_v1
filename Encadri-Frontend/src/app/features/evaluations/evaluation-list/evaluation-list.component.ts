import { Component, inject, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Evaluation } from '../../../core/models/evaluation.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-evaluation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiCardComponent, UiButtonComponent, ModalComponent, SkeletonCardComponent],
  templateUrl: './evaluation-list.component.html',
  styleUrls: ['./evaluation-list.component.css']
})
export class EvaluationListComponent implements OnChanges {
  private evaluationService = inject(EvaluationService);
  private authService = inject(AuthService);

  @Input() projectId!: string;

  evaluations = signal<Evaluation[]>([]);
  loading = signal<boolean>(true);

  // Modal state
  isModalOpen = signal<boolean>(false);
  formLoading = signal<boolean>(false);
  formError = signal<string>('');

  // Form data
  evaluation: Partial<Evaluation> = this.getEmptyEvaluation();

  getEmptyEvaluation(): Partial<Evaluation> {
    return {
      reportQualityScore: 0,
      technicalImplementationScore: 0,
      presentationScore: 0,
      professionalConductScore: 0,
      finalGrade: 0,
      comments: '',
      defenseDate: ''
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['projectId'] && this.projectId) {
      this.loadEvaluations();
    }
  }

  loadEvaluations() {
    this.loading.set(true);
    this.evaluationService.getEvaluations(this.projectId).subscribe({
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

  openCreateModal() {
    this.evaluation = this.getEmptyEvaluation();
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  calculateGrade() {
    const total =
      (this.evaluation.reportQualityScore || 0) +
      (this.evaluation.technicalImplementationScore || 0) +
      (this.evaluation.presentationScore || 0) +
      (this.evaluation.professionalConductScore || 0);

    this.evaluation.finalGrade = total;
  }

  onSubmit() {
    if (!this.projectId) {
      this.formError.set('Project ID is required.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    const currentUser = this.authService.currentUser();

    const evaluationData = {
      ...this.evaluation,
      projectId: this.projectId,
      evaluatedBy: currentUser ? currentUser.email : 'Unknown',
      evaluatedAt: new Date().toISOString()
    };

    this.evaluationService.createEvaluation(evaluationData).subscribe({
      next: () => {
        this.formLoading.set(false);
        this.closeModal();
        this.loadEvaluations();
      },
      error: (err) => {
        this.formError.set('Failed to submit evaluation. Please try again.');
        this.formLoading.set(false);
        console.error(err);
      }
    });
  }
}

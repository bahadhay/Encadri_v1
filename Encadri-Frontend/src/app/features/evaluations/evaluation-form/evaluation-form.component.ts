import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Evaluation } from '../../../core/models/evaluation.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiCardComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './evaluation-form.component.html',
  styleUrls: ['./evaluation-form.component.css']
})
export class EvaluationFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private evaluationService = inject(EvaluationService);
  private authService = inject(AuthService);

  projectId: string | null = null;
  loading = false;
  error = '';

  evaluation: Partial<Evaluation> = {
    reportQualityScore: 0,
    technicalImplementationScore: 0,
    presentationScore: 0,
    professionalConductScore: 0,
    finalGrade: 0,
    comments: ''
  };

  evaluationId: string | null = null;
  isEditMode = false;

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      this.evaluationId = params.get('evaluationId');
      
      if (this.evaluationId) {
        this.isEditMode = true;
        this.loadEvaluation(this.evaluationId);
      }
    });
  }

  loadEvaluation(id: string) {
    this.loading = true;
    this.evaluationService.getEvaluation(id).subscribe({
      next: (data) => {
        this.evaluation = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load evaluation';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Helper to sum scores, assuming they are out of 5 and final grade is out of 20
  calculateGrade() {
    this.evaluation.finalGrade = (this.evaluation.reportQualityScore || 0) + 
                                 (this.evaluation.technicalImplementationScore || 0) + 
                                 (this.evaluation.presentationScore || 0) + 
                                 (this.evaluation.professionalConductScore || 0);
  }

  onSubmit() {
    if (!this.projectId) {
      this.error = 'Project ID missing.';
      return;
    }

    this.loading = true;
    this.error = '';

    const currentUser = this.authService.currentUser();
    const now = new Date().toISOString();

    if (this.isEditMode && this.evaluationId) {
       const updateData = {
        ...this.evaluation,
        updatedDate: now
      };
      
      this.evaluationService.updateEvaluation(this.evaluationId, updateData).subscribe({
        next: () => {
           this.router.navigate(['/projects', this.projectId], { queryParams: { tab: 'evaluations' } });
        },
        error: (err) => {
          this.error = 'Failed to update evaluation.';
          this.loading = false;
          console.error(err);
        }
      });
    } else {
        const createData = {
          ...this.evaluation,
          projectId: this.projectId,
          evaluatorEmail: currentUser ? currentUser.email : 'unknown',
          evaluatorName: currentUser ? currentUser.fullName : 'Unknown Evaluator',
          createdDate: now
        };

        this.evaluationService.createEvaluation(createData).subscribe({
          next: () => {
           this.router.navigate(['/projects', this.projectId], { queryParams: { tab: 'evaluations' } });
          },
          error: (err) => {
            this.error = 'Failed to submit evaluation. Please try again.';
            this.loading = false;
            console.error(err);
          }
        });
    }
  }
}

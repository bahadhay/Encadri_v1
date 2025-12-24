import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Evaluation } from '../models/evaluation.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private apiService = inject(ApiService);
  private readonly BASE_PATH = '/evaluations';

  getEvaluations(projectId?: string): Observable<Evaluation[]> {
    const params = projectId ? { projectId } : undefined;
    return this.apiService.get<Evaluation[]>(this.BASE_PATH, params);
  }

  getEvaluation(id: string): Observable<Evaluation> {
    return this.apiService.get<Evaluation>(`${this.BASE_PATH}/${id}`);
  }

  createEvaluation(evaluation: Partial<Evaluation>): Observable<Evaluation> {
    return this.apiService.post<Evaluation>(this.BASE_PATH, evaluation);
  }

  updateEvaluation(id: string, evaluation: Partial<Evaluation>): Observable<Evaluation> {
    return this.apiService.put<Evaluation>(`${this.BASE_PATH}/${id}`, evaluation);
  }

  deleteEvaluation(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.BASE_PATH}/${id}`);
  }
}

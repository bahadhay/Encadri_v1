import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Subtask } from '../models/subtask.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubtaskService {
  private apiService = inject(ApiService);
  private readonly BASE_PATH = '/subtasks';

  getSubtasks(milestoneId: string): Observable<Subtask[]> {
    return this.apiService.get<Subtask[]>(`${this.BASE_PATH}?milestoneId=${milestoneId}`);
  }

  getSubtask(id: string): Observable<Subtask> {
    return this.apiService.get<Subtask>(`${this.BASE_PATH}/${id}`);
  }

  createSubtask(subtask: Partial<Subtask>): Observable<Subtask> {
    return this.apiService.post<Subtask>(this.BASE_PATH, subtask);
  }

  updateSubtask(id: string, subtask: Partial<Subtask>): Observable<Subtask> {
    return this.apiService.put<Subtask>(`${this.BASE_PATH}/${id}`, subtask);
  }

  toggleSubtask(id: string, isCompleted: boolean): Observable<Subtask> {
    return this.apiService.patch<Subtask>(`${this.BASE_PATH}/${id}`, { isCompleted });
  }

  deleteSubtask(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.BASE_PATH}/${id}`);
  }
}

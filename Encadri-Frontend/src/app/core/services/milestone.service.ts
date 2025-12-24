import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Milestone } from '../models/milestone.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MilestoneService {
  private apiService = inject(ApiService);
  private readonly BASE_PATH = '/milestones';

  getMilestones(projectId?: string): Observable<Milestone[]> {
    const params = projectId ? { projectId } : undefined;
    return this.apiService.get<Milestone[]>(this.BASE_PATH, params);
  }

  getMilestone(id: string): Observable<Milestone> {
    return this.apiService.get<Milestone>(`${this.BASE_PATH}/${id}`);
  }

  createMilestone(milestone: Partial<Milestone>): Observable<Milestone> {
    return this.apiService.post<Milestone>(this.BASE_PATH, milestone);
  }

  updateMilestone(id: string, milestone: Partial<Milestone>): Observable<Milestone> {
    return this.apiService.put<Milestone>(`${this.BASE_PATH}/${id}`, milestone);
  }

  deleteMilestone(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.BASE_PATH}/${id}`);
  }
}

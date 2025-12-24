import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Project } from '../models/project.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiService = inject(ApiService);
  private readonly BASE_PATH = '/projects';

  getProjects(userEmail?: string): Observable<Project[]> {
    let url = this.BASE_PATH;
    if (userEmail) {
      url += `?userEmail=${userEmail}`;
    }
    return this.apiService.get<Project[]>(url);
  }

  getProject(id: string): Observable<Project> {
    return this.apiService.get<Project>(`${this.BASE_PATH}/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.apiService.post<Project>(this.BASE_PATH, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return this.apiService.put<Project>(`${this.BASE_PATH}/${id}`, project);
  }

  updateProjectProgress(id: string, progressPercentage: number): Observable<Project> {
    return this.apiService.patch<Project>(`${this.BASE_PATH}/${id}`, { progressPercentage });
  }

  deleteProject(id: string, ownerEmail: string): Observable<void> {
    return this.apiService.delete<void>(`${this.BASE_PATH}/${id}?ownerEmail=${ownerEmail}`);
  }

  inviteUser(projectId: string, invitedEmail: string, role: string): Observable<any> {
    return this.apiService.post(`${this.BASE_PATH}/invite`, { projectId, invitedEmail, role });
  }

  joinProject(projectId: string, userEmail: string): Observable<any> {
    return this.apiService.post(`${this.BASE_PATH}/join`, { projectId, userEmail });
  }

  declineInvitation(projectId: string, userEmail: string): Observable<any> {
    return this.apiService.post(`${this.BASE_PATH}/decline`, { projectId, userEmail });
  }

  removeMember(projectId: string, ownerEmail: string, role: 'student' | 'supervisor'): Observable<any> {
    return this.apiService.post(`${this.BASE_PATH}/remove-member`, { projectId, ownerEmail, role });
  }

  leaveProject(projectId: string, userEmail: string): Observable<any> {
    return this.apiService.post(`${this.BASE_PATH}/leave`, { projectId, userEmail });
  }
}

import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Submission } from '../models/submission.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private readonly BASE_PATH = '/submissions';

  getSubmissions(projectId?: string): Observable<Submission[]> {
    const currentUser = this.authService.currentUser();
    const params: any = {};

    if (projectId) {
      params.projectId = projectId;
    }

    // Add user email and role for filtering
    if (currentUser) {
      params.userEmail = currentUser.email;
      params.userRole = currentUser.userRole;
    }

    return this.apiService.get<Submission[]>(this.BASE_PATH, params);
  }

  getSubmission(id: string): Observable<Submission> {
    return this.apiService.get<Submission>(`${this.BASE_PATH}/${id}`);
  }

  createSubmission(submission: Partial<Submission>): Observable<Submission> {
    return this.apiService.post<Submission>(this.BASE_PATH, submission);
  }

  updateSubmission(id: string, submission: Partial<Submission>): Observable<Submission> {
    return this.apiService.put<Submission>(`${this.BASE_PATH}/${id}`, submission);
  }

  deleteSubmission(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  uploadFile(file: File): Observable<{ url: string; sasUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.post<{ url: string; sasUrl: string; fileName: string }>(`${this.BASE_PATH}/upload`, formData);
  }

  getFileUrl(blobName: string): Observable<{ url: string }> {
    return this.apiService.get<{ url: string }>(`${this.BASE_PATH}/file-url/${blobName}`);
  }

  downloadFile(blobName: string): string {
    // Returns the download endpoint URL
    return `${this.apiService['baseUrl']}${this.BASE_PATH}/download/${blobName}`;
  }
}

import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Meeting } from '../models/meeting.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private apiService = inject(ApiService);
  private readonly BASE_PATH = '/meetings';

  getMeetings(projectId?: string): Observable<Meeting[]> {
    const params = projectId ? { projectId } : undefined;
    return this.apiService.get<Meeting[]>(this.BASE_PATH, params);
  }

  getMeeting(id: string): Observable<Meeting> {
    return this.apiService.get<Meeting>(`${this.BASE_PATH}/${id}`);
  }

  createMeeting(meeting: Partial<Meeting>): Observable<Meeting> {
    return this.apiService.post<Meeting>(this.BASE_PATH, meeting);
  }

  updateMeeting(id: string, meeting: Partial<Meeting>): Observable<Meeting> {
    return this.apiService.put<Meeting>(`${this.BASE_PATH}/${id}`, meeting);
  }

  deleteMeeting(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.BASE_PATH}/${id}`);
  }
}

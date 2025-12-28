import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date | string;
  end: Date | string;
  type: string; // 'meeting' | 'submission' | 'milestone'
  color: string;
  description?: string;
  location?: string;
  status?: string;
  projectId?: string;
  allDay?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/calendar`;

  getEvents(userEmail: string, userRole?: string, start?: Date, end?: Date): Observable<CalendarEvent[]> {
    let params = new HttpParams().set('userEmail', userEmail);

    if (userRole) {
      params = params.set('userRole', userRole);
    }
    if (start) {
      params = params.set('start', start.toISOString());
    }
    if (end) {
      params = params.set('end', end.toISOString());
    }

    return this.http.get<CalendarEvent[]>(`${this.apiUrl}/events`, { params });
  }
}

import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Meeting, MeetingRequest, SupervisorAvailability, BulkMeetingInvite } from '../models/meeting.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private apiService = inject(ApiService);
  private readonly MEETINGS_PATH = '/meetings';
  private readonly REQUESTS_PATH = '/meetingrequests';
  private readonly AVAILABILITY_PATH = '/supervisoravailability';

  // ===== Meetings =====
  getMeetings(params?: {
    projectId?: string;
    userEmail?: string;
    status?: string;
    upcomingOnly?: boolean;
  }): Observable<Meeting[]> {
    return this.apiService.get<Meeting[]>(this.MEETINGS_PATH, params);
  }

  getMeeting(id: string): Observable<Meeting> {
    return this.apiService.get<Meeting>(`${this.MEETINGS_PATH}/${id}`);
  }

  getUpcomingMeetings(userEmail: string, hours: number = 24): Observable<Meeting[]> {
    return this.apiService.get<Meeting[]>(`${this.MEETINGS_PATH}/upcoming/${userEmail}`, { hours });
  }

  createMeeting(meeting: Partial<Meeting>): Observable<Meeting> {
    return this.apiService.post<Meeting>(this.MEETINGS_PATH, meeting);
  }

  updateMeeting(id: string, meeting: Partial<Meeting>): Observable<Meeting> {
    return this.apiService.put<Meeting>(`${this.MEETINGS_PATH}/${id}`, meeting);
  }

  deleteMeeting(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.MEETINGS_PATH}/${id}`);
  }

  bulkInviteStudents(invite: BulkMeetingInvite): Observable<Meeting[]> {
    return this.apiService.post<Meeting[]>(`${this.MEETINGS_PATH}/bulk-invite`, invite);
  }

  // ===== Meeting Requests =====
  getMeetingRequests(params?: {
    studentEmail?: string;
    supervisorEmail?: string;
    status?: string;
    projectId?: string;
  }): Observable<MeetingRequest[]> {
    return this.apiService.get<MeetingRequest[]>(this.REQUESTS_PATH, params);
  }

  getMeetingRequest(id: string): Observable<MeetingRequest> {
    return this.apiService.get<MeetingRequest>(`${this.REQUESTS_PATH}/${id}`);
  }

  createMeetingRequest(request: Partial<MeetingRequest>): Observable<MeetingRequest> {
    return this.apiService.post<MeetingRequest>(this.REQUESTS_PATH, request);
  }

  approveMeetingRequest(id: string, scheduledDate?: string): Observable<Meeting> {
    // Send as an object with scheduledDate property (or null to use preferred date)
    const body = scheduledDate ? { scheduledDate } : null;
    return this.apiService.post<Meeting>(`${this.REQUESTS_PATH}/${id}/approve`, body);
  }

  rejectMeetingRequest(id: string, reason: string): Observable<void> {
    // Send as an object with reason property
    return this.apiService.post<void>(`${this.REQUESTS_PATH}/${id}/reject`, { reason });
  }

  uploadMeetingDocument(requestId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.post(`${this.REQUESTS_PATH}/${requestId}/upload-document`, formData);
  }

  deleteMeetingRequest(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.REQUESTS_PATH}/${id}`);
  }

  // ===== Supervisor Availability =====
  getAvailability(params?: {
    supervisorEmail?: string;
    activeOnly?: boolean;
  }): Observable<SupervisorAvailability[]> {
    return this.apiService.get<SupervisorAvailability[]>(this.AVAILABILITY_PATH, params);
  }

  getWeeklySchedule(supervisorEmail: string): Observable<any> {
    return this.apiService.get(`${this.AVAILABILITY_PATH}/weekly/${supervisorEmail}`);
  }

  createAvailability(availability: Partial<SupervisorAvailability>): Observable<SupervisorAvailability> {
    return this.apiService.post<SupervisorAvailability>(this.AVAILABILITY_PATH, availability);
  }

  bulkCreateAvailability(availabilities: Partial<SupervisorAvailability>[]): Observable<SupervisorAvailability[]> {
    return this.apiService.post<SupervisorAvailability[]>(`${this.AVAILABILITY_PATH}/bulk-create`, availabilities);
  }

  updateAvailability(id: string, availability: Partial<SupervisorAvailability>): Observable<SupervisorAvailability> {
    return this.apiService.put<SupervisorAvailability>(`${this.AVAILABILITY_PATH}/${id}`, availability);
  }

  deactivateAvailability(id: string): Observable<void> {
    return this.apiService.patch<void>(`${this.AVAILABILITY_PATH}/${id}/deactivate`, {});
  }

  deleteAvailability(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.AVAILABILITY_PATH}/${id}`);
  }

  clearAllAvailability(supervisorEmail: string): Observable<void> {
    return this.apiService.delete<void>(`${this.AVAILABILITY_PATH}/clear/${supervisorEmail}`);
  }
}

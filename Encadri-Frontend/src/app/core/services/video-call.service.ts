import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CallTokenResponse {
  token: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {
  private apiService = inject(ApiService);

  /**
   * Get an access token for joining video calls
   */
  getCallToken(): Observable<CallTokenResponse> {
    return this.apiService.post<CallTokenResponse>('/videocall/token', {});
  }

  /**
   * Check if video call service is healthy
   */
  checkHealth(): Observable<any> {
    return this.apiService.get('/videocall/health');
  }

  /**
   * Notify all participants that the meeting has started
   * Called by supervisor when starting the call
   */
  notifyMeetingStarted(meetingId: string): Observable<any> {
    return this.apiService.post(`/videocall/notify-meeting-started/${meetingId}`, {});
  }
}

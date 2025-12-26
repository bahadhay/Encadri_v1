export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  scheduledAt: string; // ISO Date
  durationMinutes: number;
  location?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  agenda?: string;
  notes?: string;
  meetingNotes?: string;
  requestedBy?: string;
  studentEmail: string;
  supervisorEmail: string;
  meetingLink?: string;
  meetingType: 'virtual' | 'in-person' | 'hybrid';
  cancellationReason?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface MeetingRequest {
  id?: string;
  projectId: string;
  studentEmail: string;
  supervisorEmail: string;
  title?: string;
  agenda?: string;
  preferredDate: string;
  durationMinutes?: number;
  meetingType?: 'virtual' | 'in-person';
  location?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  meetingId?: string;
  documentUrls?: string[];
  createdDate?: string;
  updatedDate?: string;
}

export interface SupervisorAvailability {
  id?: string;
  supervisorEmail: string;
  dayOfWeek: string;
  startTime: string; // HH:mm format
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
  meetingType?: 'virtual' | 'in-person' | 'both';
  location?: string;
  isActive?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface MeetingDocument {
  id?: string;
  meetingId?: string;
  meetingRequestId?: string;
  fileName: string;
  blobUrl: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  createdDate?: string;
}

export interface BulkMeetingInvite {
  supervisorEmail: string;
  title: string;
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  agenda?: string;
  meetingType?: string;
}

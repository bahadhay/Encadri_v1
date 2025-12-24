export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  scheduledAt: string; // ISO Date
  durationMinutes: number;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'confirmed';
  agenda?: string;
  notes?: string;
  requestedBy?: string;
  createdDate?: string;
  updatedDate?: string;
}

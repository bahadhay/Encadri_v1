export interface Submission {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  type: 'report' | 'presentation' | 'code' | 'documentation' | 'other';
  submittedBy: string;
  submittedAt?: string; // Backend uses CreatedDate
  dueDate?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'needs_revision';
  fileUrl?: string;
  feedback?: string;
  grade?: number;
  createdDate?: string;
  updatedDate?: string;
}

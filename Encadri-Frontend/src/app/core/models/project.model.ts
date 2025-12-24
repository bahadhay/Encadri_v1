export interface Project {
  id: string;
  title: string;
  type: 'PFA' | 'PFE' | 'Internship';
  description: string;
  studentEmail?: string;
  studentName?: string;
  supervisorEmail?: string;
  supervisorName?: string;
  status: 'proposed' | 'in_progress' | 'under_review' | 'completed' | 'archived';
  company?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  objectives: string[];
  progressPercentage: number;
  ownerEmail?: string;
  createdDate?: string;
  updatedDate?: string;
}

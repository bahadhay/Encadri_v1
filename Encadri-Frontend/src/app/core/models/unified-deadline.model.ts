import { Milestone } from './milestone.model';
import { Meeting } from './meeting.model';
import { Project } from './project.model';

/**
 * Unified deadline interface combining milestones, meetings, and project end dates
 * Used for centralized deadline tracking in dashboard
 */
export interface UnifiedDeadline {
  id: string;
  type: 'milestone' | 'meeting' | 'project-end';

  // Common properties
  title: string;
  dueDate: Date;
  projectId: string;
  projectTitle?: string;

  // Status varies by type
  status: string;

  // Visual differentiation
  icon: string;

  // Optional metadata
  description?: string;

  // Reference to source data
  sourceData: Milestone | Meeting | Project;
}

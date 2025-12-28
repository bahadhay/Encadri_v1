import { Subtask } from './subtask.model';

export interface Milestone {
  id?: string;
  projectId: string;
  title: string;
  description?: string;
  startDate?: Date | string;
  dueDate: Date | string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  completedDate?: Date | string | null;
  order?: number;
  createdDate?: Date | string;
  updatedDate?: Date | string;
  subtasks?: Subtask[];
}

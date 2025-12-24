export interface Subtask {
  id?: string;
  milestoneId: string;
  title: string;
  isCompleted: boolean;
  order?: number;
  createdDate?: Date | string;
  updatedDate?: Date | string;
}

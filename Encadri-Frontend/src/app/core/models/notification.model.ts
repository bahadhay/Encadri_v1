export interface Notification {
  id?: string;
  userEmail: string;
  type: 'milestone_due' | 'meeting_scheduled' | 'submission_graded' | 'evaluation_added' | 'project_update' | 'comment_added' | 'invitation' | string;
  title: string;
  message: string;
  relatedEntityId?: string; // project ID, milestone ID, etc.
  relatedEntityType?: 'project' | 'milestone' | 'meeting' | 'submission' | 'evaluation';
  isRead: boolean;
  link?: string; // Where to navigate when clicked (same as actionUrl)
  actionUrl?: string; // Alternative name for link
  priority: string; // 'low' | 'medium' | 'high'
  createdDate?: Date | string;
  updatedDate?: Date | string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  milestoneDueReminders: boolean;
  meetingReminders: boolean;
  submissionUpdates: boolean;
  evaluationUpdates: boolean;
  dailyDigest: boolean;
}

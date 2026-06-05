import { Injectable } from '@angular/core';
import { UnifiedDeadline } from '../models/unified-deadline.model';
import { Milestone } from '../models/milestone.model';
import { Meeting } from '../models/meeting.model';
import { Project } from '../models/project.model';

/**
 * Service for aggregating deadlines from multiple sources
 * Combines milestones, meetings, and project end dates into unified deadline objects
 */
@Injectable({
  providedIn: 'root'
})
export class DeadlineAggregationService {

  /**
   * Aggregate all deadlines from milestones, meetings, and projects
   * @param milestones - Array of project milestones
   * @param meetings - Array of scheduled meetings
   * @param projects - Array of projects with end dates
   * @returns Sorted array of unified deadlines (upcoming only)
   */
  aggregateDeadlines(
    milestones: Milestone[],
    meetings: Meeting[],
    projects: Project[]
  ): UnifiedDeadline[] {
    const deadlines: UnifiedDeadline[] = [];

    // Convert milestones to unified deadlines
    deadlines.push(...this.convertMilestones(milestones));

    // Convert meetings to unified deadlines
    deadlines.push(...this.convertMeetings(meetings));

    // Convert project end dates to unified deadlines
    deadlines.push(...this.convertProjects(projects));

    // Filter to upcoming only and sort by date
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return deadlines
      .filter(d => {
        const dDate = new Date(d.dueDate);
        dDate.setHours(0, 0, 0, 0);
        return dDate >= now;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Convert milestones to unified deadline format
   * Excludes completed milestones
   */
  private convertMilestones(milestones: Milestone[]): UnifiedDeadline[] {
    return milestones
      .filter(m => m.status !== 'completed')
      .map(m => ({
        id: m.id || '',
        type: 'milestone' as const,
        title: m.title,
        dueDate: new Date(m.dueDate),
        projectId: m.projectId,
        status: m.status,
        icon: '📋',
        description: m.description,
        sourceData: m
      }));
  }

  /**
   * Convert meetings to unified deadline format
   * Excludes cancelled and completed meetings
   */
  private convertMeetings(meetings: Meeting[]): UnifiedDeadline[] {
    return meetings
      .filter(m => m.status !== 'cancelled' && m.status !== 'completed')
      .map(m => ({
        id: m.id,
        type: 'meeting' as const,
        title: m.title,
        dueDate: new Date(m.scheduledAt),
        projectId: m.projectId,
        status: m.status,
        icon: '📞',
        description: m.agenda,
        sourceData: m
      }));
  }

  /**
   * Convert project end dates to unified deadline format
   * Only includes projects with end dates that are not completed or archived
   */
  private convertProjects(projects: Project[]): UnifiedDeadline[] {
    return projects
      .filter(p =>
        p.endDate &&
        p.status !== 'completed' &&
        p.status !== 'archived'
      )
      .map(p => ({
        id: p.id,
        type: 'project-end' as const,
        title: `${p.title} - End Date`,
        dueDate: new Date(p.endDate!),
        projectId: p.id,
        projectTitle: p.title,
        status: p.status,
        icon: '🎯',
        description: `${p.type} deadline`,
        sourceData: p
      }));
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { ToastService } from '../../../core/services/toast.service';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { SubmissionListComponent } from '../../submissions/submission-list/submission-list.component';
import { MeetingListComponent } from '../../meetings/meeting-list/meeting-list.component';
import { EvaluationListComponent } from '../../evaluations/evaluation-list/evaluation-list.component';
import { MilestoneListComponent } from '../../milestones/milestone-list/milestone-list.component';
import { DocumentRepositoryComponent } from '../../documents/document-repository/document-repository.component';
import { SkeletonProfileComponent } from '../../../shared/components/skeleton-profile/skeleton-profile.component';
import { MilestoneService } from '../../../core/services/milestone.service';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, UiCardComponent, UiButtonComponent, UiInputComponent, SubmissionListComponent, MeetingListComponent, EvaluationListComponent, MilestoneListComponent, DocumentRepositoryComponent, SkeletonProfileComponent],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private milestoneService = inject(MilestoneService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  project = signal<Project | null>(null);
  loading = signal<boolean>(true);
  error = signal<string>('');
  activeTab = signal<'overview' | 'submissions' | 'meetings' | 'evaluations' | 'milestones' | 'documents' | 'messages'>('overview');
  milestoneProgress = signal<number>(0);

  private currentProjectId: string | null = null;

  // Invite Modal State
  showInviteModal = false;
  inviteRole: 'student' | 'supervisor' | null = null;
  inviteEmailControl = new FormControl('', [Validators.required, Validators.email]);
  inviting = false;

  // Loading states
  leavingProject = false;
  deletingProject = false;

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        // Check if this is a different project or same project (refresh)
        const isDifferentProject = this.currentProjectId !== id;
        this.currentProjectId = id;

        if (isDifferentProject) {
          // New project - reset to overview
          this.activeTab.set('overview');
          this.saveActiveTab('overview', id);
        } else {
          // Same project (refresh) - restore saved tab
          const savedTab = this.getSavedTab(id);
          this.activeTab.set(savedTab);
        }

        this.loadProject(id);
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab && ['submissions', 'meetings', 'evaluations', 'milestones', 'documents', 'messages', 'overview'].includes(tab)) {
        this.activeTab.set(tab as any);
        if (this.currentProjectId) {
          this.saveActiveTab(tab as any, this.currentProjectId);
        }
      }
    });
  }

  // Get saved tab from localStorage for specific project
  private getSavedTab(projectId: string): 'overview' | 'submissions' | 'meetings' | 'evaluations' | 'milestones' | 'documents' | 'messages' {
    try {
      const savedTab = localStorage.getItem(`project-${projectId}-active-tab`);
      if (savedTab && ['overview', 'submissions', 'meetings', 'evaluations', 'milestones', 'documents', 'messages'].includes(savedTab)) {
        return savedTab as any;
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }
    return 'overview';
  }

  // Save active tab to localStorage for specific project
  private saveActiveTab(tab: string, projectId: string) {
    try {
      localStorage.setItem(`project-${projectId}-active-tab`, tab);
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  // Set active tab and save to localStorage
  setActiveTab(tab: 'overview' | 'submissions' | 'meetings' | 'evaluations' | 'milestones' | 'documents' | 'messages') {
    this.activeTab.set(tab);
    if (this.currentProjectId) {
      this.saveActiveTab(tab, this.currentProjectId);
    }
  }

  loadProject(id: string) {
    this.loading.set(true);
    this.projectService.getProject(id).subscribe({
      next: (data) => {
        this.project.set(data);
        this.loading.set(false);
        this.loadMilestoneProgress(id);
      },
      error: (err) => {
        this.error.set('Failed to load project details');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  loadMilestoneProgress(projectId: string) {
    console.log('Loading milestone progress for project:', projectId);
    this.milestoneService.getMilestones(projectId).subscribe({
      next: (milestones) => {
        let progress = 0;

        if (milestones.length > 0) {
          const completedCount = milestones.filter(m => m.status === 'completed').length;
          progress = Math.round((completedCount / milestones.length) * 100);
          console.log(`Progress calculation: ${completedCount}/${milestones.length} = ${progress}%`);
        } else {
          console.log('No milestones found, progress = 0%');
        }

        this.milestoneProgress.set(progress);

        // Update local project state to trigger UI refresh
        const currentProject = this.project();
        if (currentProject) {
          console.log(`Updating UI: project progress ${currentProject.progressPercentage}% -> ${progress}%`);
          this.project.set({...currentProject, progressPercentage: progress});

          // Try to update backend - use full project update with all required fields
          if (currentProject.progressPercentage !== progress) {
            const updatedProject = {
              ...currentProject,
              progressPercentage: progress
            };

            this.projectService.updateProject(projectId, updatedProject).subscribe({
              next: (updated) => {
                console.log('Backend updated successfully with progress:', updated.progressPercentage);
                this.project.set(updated);
              },
              error: (err) => {
                console.warn('Backend update failed, trying PATCH method:', err);
                // Fallback to PATCH if PUT fails
                this.projectService.updateProjectProgress(projectId, progress).subscribe({
                  next: (updated) => {
                    console.log('PATCH successful');
                    this.project.set(updated);
                  },
                  error: (patchErr) => {
                    console.error('Both PUT and PATCH failed:', patchErr);
                  }
                });
              }
            });
          }
        }
      },
      error: (err) => {
        console.error('Failed to load milestones', err);
      }
    });
  }

  onMilestonesChanged() {
    console.log('onMilestonesChanged called - updating project progress');
    const currentProject = this.project();
    if (currentProject) {
      this.loadMilestoneProgress(currentProject.id || '');
    } else {
      console.warn('No current project found');
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'proposed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ').toUpperCase();
  }

  getProgressStatus(percentage: number): string {
    if (percentage === 0) return 'Not started';
    if (percentage < 25) return 'Just beginning';
    if (percentage < 50) return 'Making progress';
    if (percentage < 75) return 'Halfway there';
    if (percentage < 100) return 'Almost done';
    return 'Completed';
  }

  canInvite(role: 'student' | 'supervisor'): boolean {
    const user = this.authService.currentUser();
    const p = this.project();
    
    // Debug logging
    console.log('canInvite check:', { 
      userRole: user?.userRole, 
      targetRole: role, 
      projectStudent: p?.studentEmail, 
      projectSupervisor: p?.supervisorEmail 
    });

    if (!user || !p) return false;

    // Supervisor can invite Student
    if (user.userRole === 'supervisor' && role === 'student' && !p.studentEmail) return true;
    
    // Student can invite Supervisor
    if (user.userRole === 'student' && role === 'supervisor' && !p.supervisorEmail) return true;

    return false;
  }

  openInviteModal(role: 'student' | 'supervisor') {
    this.inviteRole = role;
    this.inviteEmailControl.setValue('');
    this.showInviteModal = true;
  }

  closeInviteModal() {
    this.showInviteModal = false;
    this.inviteRole = null;
  }

  sendInvitation() {
    if (this.inviteEmailControl.invalid || !this.inviteRole || !this.project()) return;

    this.inviting = true;
    const projectId = this.project()!.id!;
    const email = this.inviteEmailControl.value!;
    const roleName = this.inviteRole === 'student' ? 'Student' : 'Supervisor';

    this.projectService.inviteUser(projectId, email, this.inviteRole).subscribe({
      next: () => {
        this.toastService.success(`Invitation sent to ${email} as ${roleName}`);
        this.inviting = false;
        this.closeInviteModal();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Failed to send invitation. Please try again.');
        this.inviting = false;
      }
    });
  }

  // Navigate to chat with the other project member
  openChat() {
    const user = this.authService.currentUser();
    const p = this.project();

    if (!user || !p) return;

    // Determine who to chat with based on current user role
    let recipientEmail = '';
    let recipientName = '';

    if (user.userRole === 'student' && p.supervisorEmail) {
      recipientEmail = p.supervisorEmail;
      recipientName = p.supervisorName || 'Supervisor';
    } else if (user.userRole === 'supervisor' && p.studentEmail) {
      recipientEmail = p.studentEmail;
      recipientName = p.studentName || 'Student';
    }

    if (recipientEmail) {
      // Navigate to chat with query params
      this.router.navigate(['/chat'], {
        queryParams: {
          recipientEmail,
          recipientName,
          projectId: p.id
        }
      });
    } else {
      this.toastService.info('No other member in this project to chat with');
    }
  }

  // Check if chat is available (both student and supervisor are assigned)
  get canChat(): boolean {
    const user = this.authService.currentUser();
    const p = this.project();

    if (!user || !p) return false;

    // Student can chat if supervisor exists
    if (user.userRole === 'student' && p.supervisorEmail) return true;

    // Supervisor can chat if student exists
    if (user.userRole === 'supervisor' && p.studentEmail) return true;

    return false;
  }

  // Check if current user is the project owner
  get isOwner(): boolean {
    const user = this.authService.currentUser();
    const p = this.project();
    return !!(user && p && p.ownerEmail === user.email);
  }

  // Check if current user is a member (not owner)
  get isMember(): boolean {
    const user = this.authService.currentUser();
    const p = this.project();
    if (!user || !p || p.ownerEmail === user.email) return false;

    return p.studentEmail === user.email || p.supervisorEmail === user.email;
  }

  // Check if can invite student
  get canInviteStudent(): boolean {
    return this.canInvite('student');
  }

  // Check if can invite supervisor
  get canInviteSupervisor(): boolean {
    return this.canInvite('supervisor');
  }

  // Delete project (owner only)
  deleteProject() {
    const p = this.project();
    const user = this.authService.currentUser();

    if (!p || !user || !this.isOwner) return;

    const confirmMsg = `Are you sure you want to delete "${p.title}"? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    this.deletingProject = true;

    this.projectService.deleteProject(p.id!, user.email).subscribe({
      next: () => {
        this.toastService.success('Project deleted successfully');
        this.deletingProject = false;
        setTimeout(() => {
          this.router.navigate(['/projects']);
        }, 500);
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Failed to delete project. Please try again.');
        this.deletingProject = false;
      }
    });
  }

  // Leave project (members only)
  leaveProject() {
    const p = this.project();
    const user = this.authService.currentUser();

    console.log('Leave project clicked', {
      hasProject: !!p,
      hasUser: !!user,
      isMember: this.isMember,
      projectId: p?.id,
      userEmail: user?.email
    });

    if (!p || !user) {
      this.toastService.error('Project or user information not available');
      return;
    }

    if (!this.isMember) {
      this.toastService.error('Only project members can leave');
      return;
    }

    const confirmMsg = `Are you sure you want to leave "${p.title}"?`;
    if (!confirm(confirmMsg)) return;

    this.leavingProject = true;

    this.projectService.leaveProject(p.id!, user.email).subscribe({
      next: () => {
        this.toastService.success('You have left the project successfully');
        this.leavingProject = false;
        setTimeout(() => {
          this.router.navigate(['/projects']);
        }, 500);
      },
      error: (err) => {
        console.error('Leave project error:', err);
        const errorMsg = err?.error?.message || err?.message || 'Failed to leave project. Please try again.';
        this.toastService.error(errorMsg);
        this.leavingProject = false;
      }
    });
  }
}

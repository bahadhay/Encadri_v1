import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models/project.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UiCardComponent, UiButtonComponent, UiInputComponent, ModalComponent, ConfirmDialogComponent, SkeletonCardComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  projects = signal<Project[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');

  // Modal state
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  formLoading = signal<boolean>(false);
  formError = signal<string>('');

  // Delete confirmation state
  isDeleteDialogOpen = signal<boolean>(false);
  deleteLoading = signal<boolean>(false);
  projectToDelete: Project | null = null;

  // Form data
  project: Partial<Project> = this.getEmptyProject();
  techInput = '';
  technologies: string[] = [];
  objectiveInput = '';
  objectives: string[] = [];

  constructor() {
    this.loadProjects();
  }

  getEmptyProject(): Partial<Project> {
    return {
      title: '',
      type: 'PFE',
      description: '',
      status: 'proposed',
      studentEmail: '',
      supervisorEmail: '',
      progressPercentage: 0,
      ownerEmail: ''
    };
  }

  loadProjects() {
    this.loading.set(true);

    // As per user request: "In this project I don't have admin yet"
    // So we enforce filtering for everyone to ensure data isolation.
    const user = this.authService.currentUser();
    const emailToFilter = user?.email;

    this.projectService.getProjects(emailToFilter).subscribe({
      next: (data) => {
        this.projects.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load projects', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.project = this.getEmptyProject();
    this.technologies = [];
    this.objectives = [];
    this.techInput = '';
    this.objectiveInput = '';
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  openEditModal(project: Project) {
    this.isEditMode.set(true);
    this.project = { ...project };
    this.technologies = [...(project.technologies || [])];
    this.objectives = [...(project.objectives || [])];
    this.techInput = '';
    this.objectiveInput = '';
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  addTechnology() {
    if (this.techInput.trim()) {
      this.technologies.push(this.techInput.trim());
      this.techInput = '';
    }
  }

  removeTechnology(index: number) {
    this.technologies.splice(index, 1);
  }

  addObjective() {
    if (this.objectiveInput.trim()) {
      this.objectives.push(this.objectiveInput.trim());
      this.objectiveInput = '';
    }
  }

  removeObjective(index: number) {
    this.objectives.splice(index, 1);
  }

  onSubmit() {
    if (!this.project.title || !this.project.description) {
      this.formError.set('Please fill in the required fields.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    // Auto-assign owner on creation
    if (!this.isEditMode()) {
      const user = this.authService.currentUser();
      if (user) {
        if (user.userRole === 'student') {
          this.project.studentEmail = user.email;
          this.project.studentName = user.fullName;
        } else if (user.userRole === 'supervisor') {
          this.project.supervisorEmail = user.email;
          this.project.supervisorName = user.fullName;
        }
        this.project.ownerEmail = user.email;
      }
    }

    const projectData = {
      ...this.project,
      technologies: this.technologies,
      objectives: this.objectives
    };

    const request = this.isEditMode() && this.project.id
      ? this.projectService.updateProject(this.project.id, projectData)
      : this.projectService.createProject(projectData);

    request.subscribe({
      next: () => {
        this.formLoading.set(false);
        this.closeModal();
        this.loadProjects(); // Reload the list
      },
      error: (err) => {
        this.formError.set('Failed to save project. Please try again.');
        this.formLoading.set(false);
      }
    });
  }

  openDeleteDialog(project: Project) {
    this.projectToDelete = project;
    this.isDeleteDialogOpen.set(true);
  }

  closeDeleteDialog() {
    this.isDeleteDialogOpen.set(false);
    this.projectToDelete = null;
  }

  confirmDelete() {
    if (!this.projectToDelete?.id) return;

    this.deleteLoading.set(true);

    const user = this.authService.currentUser();
    const ownerEmail = user?.email || '';

    console.log('Deleting project:', this.projectToDelete.id, 'Owner email:', ownerEmail);

    this.projectService.deleteProject(this.projectToDelete.id, ownerEmail).subscribe({
      next: () => {
        console.log('Project deleted successfully');
        this.deleteLoading.set(false);
        this.closeDeleteDialog();
        this.loadProjects();
      },
      error: (err) => {
        console.error('Failed to delete project', err);
        alert(err?.error?.message || err?.message || 'Failed to delete project. You may not have permission.');
        this.deleteLoading.set(false);
        this.closeDeleteDialog();
      }
    });
  }

  get filteredProjects() {
    return this.projects().filter(p => 
      p.title.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      p.description.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
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
}

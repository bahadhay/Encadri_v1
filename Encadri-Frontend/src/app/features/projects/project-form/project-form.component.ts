import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models/project.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiCardComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css']
})
export class ProjectFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  isEditMode = false;
  projectId: string | null = null;
  loading = false;
  error = '';

  // Form Model
  project: Partial<Project> = {
    title: '',
    type: 'PFE',
    description: '',
    status: 'proposed',
    studentEmail: '',
    supervisorEmail: '',
    progressPercentage: 0,
    ownerEmail: ''
  };

  techInput = '';
  technologies: string[] = [];
  
  objectiveInput = '';
  objectives: string[] = [];

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.projectId = id;
        this.loadProject(id);
      }
    });
  }

  loadProject(id: string) {
    this.loading = true;
    this.projectService.getProject(id).subscribe({
      next: (data) => {
        this.project = { ...data };
        this.technologies = data.technologies || [];
        this.objectives = data.objectives || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load project details';
        this.loading = false;
      }
    });
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
      this.error = 'Please fill in the required fields.';
      return;
    }

    this.loading = true;
    this.error = '';
    
    // Auto-assign owner on creation
    if (!this.isEditMode) {
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
    
    // Format dates to ISO string if they exist, often html date input gives 'YYYY-MM-DD'
    // Backend expects DateTime, simple string might work if standard ISO format, but let's be safe.
    // If input type="date" it binds as string 'YYYY-MM-DD'. EF Core usually parses this fine.
    
    const projectData = {
      ...this.project,
      technologies: this.technologies,
      objectives: this.objectives
    };

    const request = this.isEditMode && this.projectId
      ? this.projectService.updateProject(this.projectId, projectData)
      : this.projectService.createProject(projectData);

    request.subscribe({
      next: () => {
         this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.error = 'Failed to save project. Please try again.';
        this.loading = false;
      }
    });
  }
}

import { Component, inject, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MilestoneService } from '../../../core/services/milestone.service';
import { SubtaskService } from '../../../core/services/subtask.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Milestone } from '../../../core/models/milestone.model';
import { Subtask } from '../../../core/models/subtask.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SkeletonTimelineComponent } from '../../../shared/components/skeleton-timeline/skeleton-timeline.component';
import { GanttModalComponent } from '../../../shared/components/gantt-modal/gantt-modal.component';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiCardComponent,
    UiButtonComponent,
    UiInputComponent,
    ModalComponent,
    ConfirmDialogComponent,
    SkeletonTimelineComponent,
    GanttModalComponent
  ],
  templateUrl: './milestone-list.component.html',
  styleUrls: ['./milestone-list.component.css']
})
export class MilestoneListComponent implements OnInit {
  @Input() projectId!: string;
  @Output() milestonesChanged = new EventEmitter<void>();

  private milestoneService = inject(MilestoneService);
  private subtaskService = inject(SubtaskService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  milestones = signal<Milestone[]>([]);
  loading = signal<boolean>(true);

  // Subtask state
  newSubtaskTitle: { [milestoneId: string]: string } = {};
  expandedMilestones = signal<Set<string>>(new Set());

  // Track which milestones already have notifications sent
  private notifiedMilestones = new Set<string>();

  // Modal state
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  formLoading = signal<boolean>(false);
  formError = signal<string>('');
  showTemplateSelector = signal<boolean>(false);

  // Delete confirmation state
  isDeleteDialogOpen = signal<boolean>(false);
  deleteLoading = signal<boolean>(false);
  milestoneToDelete: Milestone | null = null;

  // Delete all confirmation state
  isDeleteAllDialogOpen = signal<boolean>(false);
  deleteAllLoading = signal<boolean>(false);

  // Gantt modal state
  isGanttModalOpen = signal<boolean>(false);

  // Form data
  milestone: Partial<Milestone> = this.getEmptyMilestone();

  ngOnInit() {
    if (this.projectId) {
      this.loadMilestones();
    }
  }

  getEmptyMilestone(): Partial<Milestone> {
    return {
      title: '',
      description: '',
      dueDate: '',
      status: 'not_started',
      order: 0
    };
  }

  loadMilestones() {
    this.loading.set(true);
    this.milestoneService.getMilestones(this.projectId).subscribe({
      next: (data) => {
        console.log('Milestones loaded:', data.length, 'milestones');
        this.milestones.set(data);
        this.loading.set(false);
        console.log('Emitting milestonesChanged event');
        this.milestonesChanged.emit();

        // Check for overdue milestones and auto-update
        this.checkAndUpdateOverdueMilestones();

        // Check and create deadline notifications
        this.checkAndCreateDeadlineNotifications();
      },
      error: (err) => {
        console.error('Failed to load milestones', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.milestone = this.getEmptyMilestone();
    this.milestone.projectId = this.projectId;
    this.formError.set('');

    // Show template selector only if no milestones exist
    if (this.milestones().length === 0) {
      this.showTemplateSelector.set(true);
    } else {
      this.showTemplateSelector.set(false);
    }

    this.isModalOpen.set(true);
  }

  applyTemplate(templateType: 'pfa' | 'pfe' | 'internship' | 'custom') {
    if (templateType === 'custom') {
      // Switch to custom form, but keep ability to go back
      this.showTemplateSelector.set(false);
      return;
    }

    this.showTemplateSelector.set(false);

    this.formLoading.set(true);
    const templates = this.getMilestoneTemplate(templateType);

    // Create all milestones from template
    let createdCount = 0;
    templates.forEach((template, index) => {
      this.milestoneService.createMilestone(template).subscribe({
        next: () => {
          createdCount++;
          if (createdCount === templates.length) {
            this.formLoading.set(false);
            this.closeModal();
            this.loadMilestones();
          }
        },
        error: (err) => {
          console.error('Failed to create milestone from template', err);
          this.formLoading.set(false);
        }
      });
    });
  }

  getMilestoneTemplate(type: 'pfa' | 'pfe' | 'internship'): Partial<Milestone>[] {
    const today = new Date();
    const baseTemplate = {
      projectId: this.projectId,
      status: 'not_started' as const
    };

    if (type === 'pfa') {
      // PFA: 14-week structure - EPI Digital School
      // Based on official PFA guide structure
      return [
        {
          ...baseTemplate,
          title: 'Étape 0: Cahier des charges',
          description: 'Contexte, présentation du problème, objectifs, utilisateurs cibles, besoins fonctionnels, contraintes techniques, environnement technologique, répartition des rôles',
          startDate: this.addWeeks(today, 0),
          dueDate: this.addWeeks(today, 0),
          order: 0
        },
        {
          ...baseTemplate,
          title: 'Étape 1: Analyse et conception (Semaines 1-3)',
          description: 'Spécifications fonctionnelles et techniques, diagrammes UML (cas d\'utilisation, classes, séquences), architecture logicielle, sélection des technologies avec justification',
          startDate: this.addWeeks(today, 1),
          dueDate: this.addWeeks(today, 3),
          order: 1
        },
        {
          ...baseTemplate,
          title: 'Étape 2: Conception UI & prototypage (Semaines 4-5)',
          description: 'Maquettes UI/UX (Figma, Adobe XD), préparation environnement technique (IDE, bases de données, serveurs, dépôts Git)',
          startDate: this.addWeeks(today, 4),
          dueDate: this.addWeeks(today, 5),
          order: 2
        },
        {
          ...baseTemplate,
          title: 'Étape 3: Développement et intégration (Semaines 6-10)',
          description: 'Implémentation modules principaux, intégration fonctionnalités (IA, IoT, Data), tests unitaires et d\'intégration, suivi versions via GIT (commits fréquents)',
          startDate: this.addWeeks(today, 6),
          dueDate: this.addWeeks(today, 10),
          order: 3
        },
        {
          ...baseTemplate,
          title: 'Étape 4: Finalisation et sécurité (Semaines 11-12)',
          description: 'Correction de bugs, sécurité (authentification, validation), documentation technique et utilisateur, préparation version stable pour démonstration',
          startDate: this.addWeeks(today, 11),
          dueDate: this.addWeeks(today, 12),
          order: 4
        },
        {
          ...baseTemplate,
          title: 'Étape 5: Rapport et soutenance (Semaines 13-14)',
          description: 'Rédaction rapport final, préparation diaporama et démonstration, répétition de la présentation',
          startDate: this.addWeeks(today, 13),
          dueDate: this.addWeeks(today, 14),
          order: 5
        }
      ];
    } else if (type === 'pfe') {
      // PFE: 24-week structure (6 months) - EPI Digital School
      return [
        {
          ...baseTemplate,
          title: 'Phase 1: État de l\'art (Semaines 1-4)',
          description: 'Recherche bibliographique, analyse de l\'existant, technologies émergentes, revue de littérature',
          startDate: this.addWeeks(today, 1),
          dueDate: this.addWeeks(today, 4),
          order: 0
        },
        {
          ...baseTemplate,
          title: 'Phase 2: Analyse & Spécification (Semaines 5-6)',
          description: 'Cahier des charges détaillé, spécifications fonctionnelles et techniques, besoins utilisateurs',
          startDate: this.addWeeks(today, 5),
          dueDate: this.addWeeks(today, 6),
          order: 1
        },
        {
          ...baseTemplate,
          title: 'Phase 3: Conception & Architecture (Semaines 7-10)',
          description: 'Architecture système, conception détaillée, modélisation UML, choix technologiques',
          startDate: this.addWeeks(today, 7),
          dueDate: this.addWeeks(today, 10),
          order: 2
        },
        {
          ...baseTemplate,
          title: 'Phase 4: Développement Phase 1 (Semaines 11-14)',
          description: 'Développement modules principaux, fonctionnalités core, implémentation base de données',
          startDate: this.addWeeks(today, 11),
          dueDate: this.addWeeks(today, 14),
          order: 3
        },
        {
          ...baseTemplate,
          title: 'Phase 5: Développement Phase 2 (Semaines 15-18)',
          description: 'Fonctionnalités avancées, intégration composants, optimisation performances',
          startDate: this.addWeeks(today, 15),
          dueDate: this.addWeeks(today, 18),
          order: 4
        },
        {
          ...baseTemplate,
          title: 'Phase 6: Tests & Validation (Semaines 19-20)',
          description: 'Tests unitaires, tests d\'intégration, validation utilisateurs, correction bugs',
          startDate: this.addWeeks(today, 19),
          dueDate: this.addWeeks(today, 20),
          order: 5
        },
        {
          ...baseTemplate,
          title: 'Phase 7: Documentation & Déploiement (Semaines 21-22)',
          description: 'Documentation technique, manuel utilisateur, guide d\'installation, déploiement production',
          startDate: this.addWeeks(today, 21),
          dueDate: this.addWeeks(today, 22),
          order: 6
        },
        {
          ...baseTemplate,
          title: 'Phase 8: Rapport Final & Soutenance (Semaines 23-24)',
          description: 'Rédaction rapport final, préparation soutenance, répétition présentation, démonstration',
          startDate: this.addWeeks(today, 23),
          dueDate: this.addWeeks(today, 24),
          order: 7
        }
      ];
    } else {
      // Internship: 12-week structure (3 months) - EPI Digital School
      return [
        {
          ...baseTemplate,
          title: 'Phase 1: Intégration & Formation (Semaines 1-2)',
          description: 'Découverte entreprise, présentation équipe, formation outils et technologies, prise en main environnement de travail',
          startDate: this.addWeeks(today, 1),
          dueDate: this.addWeeks(today, 2),
          order: 0
        },
        {
          ...baseTemplate,
          title: 'Phase 2: Analyse du Besoin (Semaines 3-4)',
          description: 'Compréhension problématique métier, analyse besoins fonctionnels, proposition solutions techniques',
          startDate: this.addWeeks(today, 3),
          dueDate: this.addWeeks(today, 4),
          order: 1
        },
        {
          ...baseTemplate,
          title: 'Phase 3: Conception & Planification (Semaines 5-6)',
          description: 'Architecture solution, conception technique, planification sprints, validation approche avec tuteur',
          startDate: this.addWeeks(today, 5),
          dueDate: this.addWeeks(today, 6),
          order: 2
        },
        {
          ...baseTemplate,
          title: 'Phase 4: Développement Sprint 1 (Semaines 7-8)',
          description: 'Première itération développement, implémentation fonctionnalités prioritaires, revue de code',
          startDate: this.addWeeks(today, 7),
          dueDate: this.addWeeks(today, 8),
          order: 3
        },
        {
          ...baseTemplate,
          title: 'Phase 5: Développement Sprint 2 (Semaines 9-10)',
          description: 'Deuxième itération, fonctionnalités complémentaires, intégration continue, optimisations',
          startDate: this.addWeeks(today, 9),
          dueDate: this.addWeeks(today, 10),
          order: 4
        },
        {
          ...baseTemplate,
          title: 'Phase 6: Tests & Finalisation (Semaine 11)',
          description: 'Tests unitaires et d\'intégration, corrections bugs, optimisations performances, préparation livraison',
          startDate: this.addWeeks(today, 11),
          dueDate: this.addWeeks(today, 11),
          order: 5
        },
        {
          ...baseTemplate,
          title: 'Phase 7: Livraison & Rapport (Semaine 12)',
          description: 'Livraison projet final, transfert de connaissances, documentation, rédaction rapport de stage',
          startDate: this.addWeeks(today, 12),
          dueDate: this.addWeeks(today, 12),
          order: 6
        }
      ];
    }
  }

  addWeeks(date: Date, weeks: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() + (weeks * 7));
    return result.toISOString().split('T')[0];
  }

  addMonths(date: Date, months: number): string {
    const result = new Date(date);
    const wholMonths = Math.floor(months);
    const days = (months - wholMonths) * 30; // Approximate
    result.setMonth(result.getMonth() + wholMonths);
    result.setDate(result.getDate() + Math.round(days));
    return result.toISOString().split('T')[0];
  }

  openEditModal(milestone: Milestone) {
    this.isEditMode.set(true);
    this.milestone = { ...milestone };
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onSubmit() {
    if (!this.milestone.title || !this.milestone.dueDate) {
      this.formError.set('Please fill in the required fields.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set('');

    const request = this.isEditMode() && this.milestone.id
      ? this.milestoneService.updateMilestone(this.milestone.id, this.milestone)
      : this.milestoneService.createMilestone(this.milestone);

    request.subscribe({
      next: () => {
        this.formLoading.set(false);
        this.closeModal();
        this.loadMilestones();
      },
      error: (err) => {
        this.formError.set('Failed to save milestone. Please try again.');
        this.formLoading.set(false);
      }
    });
  }

  openDeleteDialog(milestone: Milestone) {
    this.milestoneToDelete = milestone;
    this.isDeleteDialogOpen.set(true);
  }

  closeDeleteDialog() {
    this.isDeleteDialogOpen.set(false);
    this.milestoneToDelete = null;
  }

  confirmDelete() {
    if (!this.milestoneToDelete?.id) return;

    this.deleteLoading.set(true);

    this.milestoneService.deleteMilestone(this.milestoneToDelete.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.closeDeleteDialog();
        this.loadMilestones();
      },
      error: (err) => {
        console.error('Failed to delete milestone', err);
        alert('Failed to delete milestone. Please try again.');
        this.deleteLoading.set(false);
        this.closeDeleteDialog();
      }
    });
  }

  openDeleteAllDialog() {
    this.isDeleteAllDialogOpen.set(true);
  }

  closeDeleteAllDialog() {
    this.isDeleteAllDialogOpen.set(false);
  }

  confirmDeleteAll() {
    const allMilestones = this.milestones();
    if (allMilestones.length === 0) return;

    this.deleteAllLoading.set(true);

    let deletedCount = 0;
    const totalCount = allMilestones.length;

    allMilestones.forEach(milestone => {
      if (milestone.id) {
        this.milestoneService.deleteMilestone(milestone.id).subscribe({
          next: () => {
            deletedCount++;
            if (deletedCount === totalCount) {
              this.deleteAllLoading.set(false);
              this.closeDeleteAllDialog();
              this.loadMilestones();
            }
          },
          error: (err) => {
            console.error('Failed to delete milestone', err);
            deletedCount++;
            if (deletedCount === totalCount) {
              this.deleteAllLoading.set(false);
              this.closeDeleteAllDialog();
              this.loadMilestones();
              alert('Some milestones could not be deleted. Please try again.');
            }
          }
        });
      }
    });
  }

  markAsComplete(milestone: Milestone) {
    if (!milestone.id) return;

    console.log('Marking milestone as complete:', milestone.title);

    const updated = {
      ...milestone,
      status: 'completed' as const,
      completedDate: new Date().toISOString()
    };

    this.milestoneService.updateMilestone(milestone.id, updated).subscribe({
      next: () => {
        console.log('Milestone updated successfully, reloading milestones...');
        this.loadMilestones();
      },
      error: (err) => {
        console.error('Failed to update milestone', err);
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ').toUpperCase();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'overdue': return '⚠️';
      case 'not_started': return '⏳';
      default: return '📌';
    }
  }

  get completionPercentage(): number {
    const total = this.milestones().length;
    if (total === 0) return 0;
    const completed = this.milestones().filter(m => m.status === 'completed').length;
    return Math.round((completed / total) * 100);
  }

  get completedCount(): number {
    return this.milestones().filter(m => m.status === 'completed').length;
  }

  get inProgressCount(): number {
    return this.milestones().filter(m => m.status === 'in_progress').length;
  }

  get notStartedCount(): number {
    return this.milestones().filter(m => m.status === 'not_started').length;
  }

  // Subtask methods
  toggleMilestoneExpansion(milestoneId: string) {
    const expanded = this.expandedMilestones();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
      // Load subtasks if not already loaded
      this.loadSubtasks(milestoneId);
    }

    this.expandedMilestones.set(newExpanded);
  }

  isMilestoneExpanded(milestoneId: string): boolean {
    return this.expandedMilestones().has(milestoneId);
  }

  loadSubtasks(milestoneId: string) {
    this.subtaskService.getSubtasks(milestoneId).subscribe({
      next: (subtasks) => {
        // Update the milestone with subtasks
        const updatedMilestones = this.milestones().map(m => {
          if (m.id === milestoneId) {
            return { ...m, subtasks };
          }
          return m;
        });
        this.milestones.set(updatedMilestones);
      },
      error: (err) => {
        console.error('Failed to load subtasks', err);
      }
    });
  }

  addSubtask(milestoneId: string) {
    const title = this.newSubtaskTitle[milestoneId]?.trim();
    if (!title) {
      console.log('No title provided for subtask');
      return;
    }

    console.log('Adding subtask:', title, 'to milestone:', milestoneId);

    const newSubtask: Partial<Subtask> = {
      milestoneId,
      title,
      isCompleted: false
    };

    this.subtaskService.createSubtask(newSubtask).subscribe({
      next: (createdSubtask) => {
        console.log('Subtask created successfully:', createdSubtask);
        this.newSubtaskTitle[milestoneId] = '';
        this.loadSubtasks(milestoneId);
        this.milestonesChanged.emit();
      },
      error: (err) => {
        console.error('Failed to create subtask - API error:', err);

        // Fallback: Add subtask locally if backend is not ready
        console.log('Adding subtask locally as fallback');
        const localSubtask: Subtask = {
          id: 'temp-' + Date.now(),
          milestoneId,
          title,
          isCompleted: false,
          order: 0
        };

        const updatedMilestones = this.milestones().map(m => {
          if (m.id === milestoneId) {
            const existingSubtasks = m.subtasks || [];
            return { ...m, subtasks: [...existingSubtasks, localSubtask] };
          }
          return m;
        });

        this.milestones.set(updatedMilestones);
        this.newSubtaskTitle[milestoneId] = '';
        this.milestonesChanged.emit();
      }
    });
  }

  toggleSubtask(milestone: Milestone, subtask: Subtask) {
    if (!subtask.id) return;

    console.log('Toggling subtask:', subtask.title, 'Current state:', subtask.isCompleted);

    // Check if this is a local (temp) subtask
    const isLocal = subtask.id.startsWith('temp-');

    if (isLocal) {
      // Handle locally stored subtasks
      console.log('Toggling local subtask');
      const updatedMilestones = this.milestones().map(m => {
        if (m.id === milestone.id) {
          const updatedSubtasks = m.subtasks?.map(s => {
            if (s.id === subtask.id) {
              return { ...s, isCompleted: !s.isCompleted };
            }
            return s;
          });
          return { ...m, subtasks: updatedSubtasks };
        }
        return m;
      });
      this.milestones.set(updatedMilestones);
      this.milestonesChanged.emit();
    } else {
      // Try to update on backend
      this.subtaskService.toggleSubtask(subtask.id, !subtask.isCompleted).subscribe({
        next: () => {
          console.log('Subtask toggled successfully');
          if (milestone.id) {
            this.loadSubtasks(milestone.id);
            this.milestonesChanged.emit();
          }
        },
        error: (err) => {
          console.error('Failed to toggle subtask on backend', err);
          // Fallback: toggle locally
          console.log('Toggling locally as fallback');
          const updatedMilestones = this.milestones().map(m => {
            if (m.id === milestone.id) {
              const updatedSubtasks = m.subtasks?.map(s => {
                if (s.id === subtask.id) {
                  return { ...s, isCompleted: !s.isCompleted };
                }
                return s;
              });
              return { ...m, subtasks: updatedSubtasks };
            }
            return m;
          });
          this.milestones.set(updatedMilestones);
          this.milestonesChanged.emit();
        }
      });
    }
  }

  deleteSubtask(milestone: Milestone, subtaskId: string) {
    if (!confirm('Are you sure you want to delete this subtask?')) return;

    console.log('Deleting subtask:', subtaskId);

    const isLocal = subtaskId.startsWith('temp-');

    if (isLocal) {
      // Handle locally stored subtasks
      console.log('Deleting local subtask');
      const updatedMilestones = this.milestones().map(m => {
        if (m.id === milestone.id) {
          const updatedSubtasks = m.subtasks?.filter(s => s.id !== subtaskId);
          return { ...m, subtasks: updatedSubtasks };
        }
        return m;
      });
      this.milestones.set(updatedMilestones);
      this.milestonesChanged.emit();
    } else {
      // Try to delete on backend
      this.subtaskService.deleteSubtask(subtaskId).subscribe({
        next: () => {
          console.log('Subtask deleted successfully');
          if (milestone.id) {
            this.loadSubtasks(milestone.id);
            this.milestonesChanged.emit();
          }
        },
        error: (err) => {
          console.error('Failed to delete subtask on backend', err);
          // Fallback: delete locally
          console.log('Deleting locally as fallback');
          const updatedMilestones = this.milestones().map(m => {
            if (m.id === milestone.id) {
              const updatedSubtasks = m.subtasks?.filter(s => s.id !== subtaskId);
              return { ...m, subtasks: updatedSubtasks };
            }
            return m;
          });
          this.milestones.set(updatedMilestones);
          this.milestonesChanged.emit();
        }
      });
    }
  }

  getSubtaskProgress(milestone: Milestone): number {
    if (!milestone.subtasks || milestone.subtasks.length === 0) return 0;
    const completed = milestone.subtasks.filter(s => s.isCompleted).length;
    return Math.round((completed / milestone.subtasks.length) * 100);
  }

  getSubtaskCompletedCount(milestone: Milestone): number {
    return milestone.subtasks?.filter(s => s.isCompleted).length || 0;
  }

  getSubtaskTotalCount(milestone: Milestone): number {
    return milestone.subtasks?.length || 0;
  }

  // Check if current user is a supervisor (has permission to create/edit/delete milestones)
  get isSupervisor(): boolean {
    const user = this.authService.currentUser();
    return user?.userRole === 'supervisor';
  }

  // Check if current user is a student (read-only access)
  get isStudent(): boolean {
    const user = this.authService.currentUser();
    return user?.userRole === 'student';
  }

  // Deadline warning methods
  getDaysUntilDue(milestone: Milestone): number {
    const dueDate = new Date(milestone.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getUrgencyLevel(milestone: Milestone): 'safe' | 'warning' | 'urgent' | 'overdue' {
    if (milestone.status === 'completed') return 'safe';

    const daysUntilDue = this.getDaysUntilDue(milestone);

    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'urgent';
    if (daysUntilDue <= 7) return 'warning';
    return 'safe';
  }

  getUrgencyColor(urgency: 'safe' | 'warning' | 'urgent' | 'overdue'): string {
    switch (urgency) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'safe': return 'bg-green-100 text-green-800 border-green-300';
    }
  }

  getUrgencyIcon(urgency: 'safe' | 'warning' | 'urgent' | 'overdue'): string {
    switch (urgency) {
      case 'overdue': return '🚨';
      case 'urgent': return '⚠️';
      case 'warning': return '⏰';
      case 'safe': return '✅';
    }
  }

  getDeadlineText(milestone: Milestone): string {
    if (milestone.status === 'completed') return 'Completed';

    const daysUntilDue = this.getDaysUntilDue(milestone);

    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue);
      return `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`;
    }
    if (daysUntilDue === 0) return 'Due today!';
    if (daysUntilDue === 1) return 'Due tomorrow';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return `${daysUntilDue} days remaining`;
  }

  // Auto-update overdue milestones
  checkAndUpdateOverdueMilestones() {
    const milestones = this.milestones();
    let hasChanges = false;

    milestones.forEach(milestone => {
      if (milestone.status !== 'completed' && milestone.status !== 'overdue') {
        const daysUntilDue = this.getDaysUntilDue(milestone);
        if (daysUntilDue < 0 && milestone.id) {
          // Update to overdue
          console.log('Auto-updating milestone to overdue:', milestone.title);
          this.milestoneService.updateMilestone(milestone.id, { status: 'overdue' }).subscribe({
            next: () => {
              hasChanges = true;
            },
            error: (err) => {
              console.error('Failed to update milestone status to overdue', err);
            }
          });
        }
      }
    });

    if (hasChanges) {
      // Reload milestones after updates
      setTimeout(() => this.loadMilestones(), 1000);
    }
  }

  // Check and create deadline notifications
  checkAndCreateDeadlineNotifications() {
    const user = this.authService.currentUser();
    if (!user) return;

    const milestones = this.milestones();

    milestones.forEach(milestone => {
      // Skip if already completed or no ID
      if (milestone.status === 'completed' || !milestone.id) return;

      // Skip if notification already sent for this milestone
      const notificationKey = `${milestone.id}`;
      if (this.notifiedMilestones.has(notificationKey)) return;

      const daysUntilDue = this.getDaysUntilDue(milestone);
      const urgency = this.getUrgencyLevel(milestone);

      // Create notification based on urgency
      let shouldNotify = false;
      let notificationType: 'overdue' | 'due_today' | 'due_soon' = 'due_soon';

      if (daysUntilDue < 0) {
        // Overdue
        shouldNotify = true;
        notificationType = 'overdue';
      } else if (daysUntilDue === 0) {
        // Due today
        shouldNotify = true;
        notificationType = 'due_today';
      } else if (daysUntilDue <= 3) {
        // Due in 1-3 days
        shouldNotify = true;
        notificationType = 'due_soon';
      }

      if (shouldNotify) {
        this.createMilestoneNotification(milestone, daysUntilDue, notificationType);
        // Mark as notified to avoid duplicate notifications
        this.notifiedMilestones.add(notificationKey);
      }
    });
  }

  // Create a notification for a milestone deadline
  private createMilestoneNotification(
    milestone: Milestone,
    daysUntilDue: number,
    type: 'overdue' | 'due_today' | 'due_soon'
  ) {
    const user = this.authService.currentUser();
    if (!user?.email) return;

    let title = '';
    let message = '';
    let priority = 'medium';

    if (type === 'overdue') {
      const daysOverdue = Math.abs(daysUntilDue);
      title = '🚨 Milestone Overdue!';
      message = `"${milestone.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`;
      priority = 'high';
    } else if (type === 'due_today') {
      title = '⏰ Milestone Due Today!';
      message = `"${milestone.title}" is due today`;
      priority = 'high';
    } else if (type === 'due_soon') {
      title = `⏰ Milestone Due in ${daysUntilDue} Days`;
      message = `"${milestone.title}" is due on ${new Date(milestone.dueDate).toLocaleDateString()}`;
      priority = 'medium';
    }

    // Create notification object
    const notification = {
      userEmail: user.email,
      title,
      message,
      type: 'milestone_due',
      isRead: false,
      link: `/projects/${this.projectId}?tab=milestones`,
      priority
    };

    console.log('Creating deadline notification:', notification);

    // Send notification via backend API
    // The backend will broadcast it via SignalR to the user's connected clients
    this.notificationService.createNotification(notification).subscribe({
      next: (createdNotification) => {
        console.log('✅ Deadline notification created successfully:', createdNotification.id);
      },
      error: (err) => {
        console.error('❌ Failed to create deadline notification:', err);
        // Notification creation failed - backend might not be ready
        // The user will still see the deadline warnings in the UI
      }
    });
  }

  // Gantt modal methods
  openGanttModal() {
    this.isGanttModalOpen.set(true);
  }

  closeGanttModal() {
    this.isGanttModalOpen.set(false);
  }
}

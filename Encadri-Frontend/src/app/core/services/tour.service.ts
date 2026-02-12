import { Injectable } from '@angular/core';
import Shepherd from 'shepherd.js';

// TypeScript workaround for Shepherd
const ShepherdTour = (Shepherd as any).Tour || Shepherd;

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private tour: any | null = null;

  constructor() {}

  /**
   * Default tour options - simple and clean
   */
  private getDefaultOptions() {
    return {
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-encadri',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true
        }
      }
    };
  }

  /**
   * DASHBOARD TOUR - Simple 3-step intro
   */
  startDashboardTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'dashboard-welcome',
      text: `
        <div class="tour-content">
          <span class="tour-icon">👋</span>
          <h3>Bienvenue sur Encadri</h3>
          <p>Votre espace pour gérer vos projets PFE</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'dashboard-stats',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📊</span>
          <h3>Vos statistiques</h3>
          <p>Vue rapide de vos projets et tâches</p>
        </div>
      `,
      attachTo: { element: '.stats-grid', on: 'bottom' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('dashboard'));
    this.tour.on('cancel', () => this.markTourAsCancelled('dashboard'));
    this.tour.start();
  }

  /**
   * PROJECTS TOUR - 2 steps
   */
  startProjectsTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'projects-list',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📁</span>
          <h3>Vos Projets</h3>
          <p>Créez et gérez vos projets PFE ici</p>
        </div>
      `,
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('projects'));
    this.tour.start();
  }

  /**
   * SUBMISSIONS TOUR - 3 steps
   */
  startSubmissionsTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'submissions-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📄</span>
          <h3>Soumissions</h3>
          <p>Téléchargez vos chapitres et rapports</p>
        </div>
      `,
      buttons: [
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'submissions-upload',
      text: `
        <div class="tour-content">
          <span class="tour-icon">⬆️</span>
          <h3>Télécharger un document</h3>
          <p>Cliquez ici pour soumettre</p>
        </div>
      `,
      attachTo: { element: 'app-ui-button[routerLink*="new"], .create-submission-btn, .new-submission-btn', on: 'bottom' },
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('submissions'));
    this.tour.start();
  }

  /**
   * MEETINGS TOUR - 2 steps
   */
  startMeetingsTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'meetings-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📅</span>
          <h3>Réunions</h3>
          <p>Planifiez vos rendez-vous avec votre encadreur</p>
        </div>
      `,
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('meetings'));
    this.tour.start();
  }

  /**
   * CHAT TOUR - 2 steps
   */
  startChatTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'chat-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">💬</span>
          <h3>Messagerie</h3>
          <p>Communiquez en temps réel avec votre encadreur</p>
        </div>
      `,
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('chat'));
    this.tour.start();
  }

  /**
   * CALENDAR TOUR - 2 steps
   */
  startCalendarTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'calendar-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📆</span>
          <h3>Calendrier</h3>
          <p>Visualisez toutes vos réunions et deadlines</p>
        </div>
      `,
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('calendar'));
    this.tour.start();
  }

  /**
   * NOTES TOUR - 2 steps
   */
  startNotesTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'notes-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📝</span>
          <h3>Notes</h3>
          <p>Prenez des notes sur votre projet</p>
        </div>
      `,
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('notes'));
    this.tour.start();
  }

  /**
   * PROFILE TOUR - 2 steps
   */
  startProfileTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'profile-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">👤</span>
          <h3>Profil</h3>
          <p>Gérez vos informations personnelles</p>
        </div>
      `,
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('profile'));
    this.tour.start();
  }

  /**
   * PROJECT DETAIL TOUR - 3 steps
   */
  startProjectDetailTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'project-detail-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🎯</span>
          <h3>Détails du Projet</h3>
          <p>Toutes les infos de votre projet</p>
        </div>
      `,
      buttons: [
        { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('project-detail'));
    this.tour.start();
  }

  /**
   * Check if user has seen a specific tour
   */
  hasSeen(tourId: string): boolean {
    return localStorage.getItem(`tour-${tourId}-completed`) === 'true';
  }

  /**
   * Mark tour as completed
   */
  markTourAsCompleted(tourId: string): void {
    localStorage.setItem(`tour-${tourId}-completed`, 'true');
    localStorage.setItem(`tour-${tourId}-date`, new Date().toISOString());
  }

  /**
   * Mark tour as cancelled
   */
  markTourAsCancelled(tourId: string): void {
    localStorage.setItem(`tour-${tourId}-cancelled`, 'true');
  }

  /**
   * Reset tour (for testing or user request)
   */
  resetTour(tourId: string): void {
    localStorage.removeItem(`tour-${tourId}-completed`);
    localStorage.removeItem(`tour-${tourId}-cancelled`);
    localStorage.removeItem(`tour-${tourId}-date`);
  }

  /**
   * Reset all tours
   */
  resetAllTours(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('tour-')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Cancel current tour
   */
  cancelTour(): void {
    if (this.tour) {
      this.tour.cancel();
      this.tour = null;
    }
  }

  /**
   * Auto-start tour based on current page
   */
  autoStartTour(pageName: string): void {
    if (this.hasSeen(pageName)) {
      return; // Already seen, don't show again
    }

    // Wait for page to load
    setTimeout(() => {
      switch(pageName) {
        case 'dashboard':
          this.startDashboardTour();
          break;
        case 'projects':
          this.startProjectsTour();
          break;
        case 'submissions':
          this.startSubmissionsTour();
          break;
        case 'meetings':
          this.startMeetingsTour();
          break;
        case 'chat':
          this.startChatTour();
          break;
        case 'calendar':
          this.startCalendarTour();
          break;
        case 'notes':
          this.startNotesTour();
          break;
        case 'profile':
          this.startProfileTour();
          break;
        case 'project-detail':
          this.startProjectDetailTour();
          break;
      }
    }, 1000);
  }
}

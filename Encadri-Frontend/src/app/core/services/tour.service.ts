import { Injectable } from '@angular/core';
import Shepherd from 'shepherd.js';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private tour: Shepherd.Tour | null = null;

  constructor() {}

  /**
   * Start the dashboard tour for new users
   */
  startDashboardTour(): void {
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-encadri',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true
        }
      }
    });

    // Step 1: Welcome
    this.tour.addStep({
      id: 'welcome',
      text: `
        <div class="tour-content">
          <h3>Bienvenue sur Encadri! 👋</h3>
          <p>Découvrons ensemble votre espace de gestion de projets académiques.</p>
          <p class="tour-duration">⏱️ Durée: 2 minutes</p>
        </div>
      `,
      buttons: [
        {
          text: 'Ignorer',
          action: this.tour.cancel,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Commencer',
          action: this.tour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    // Step 2: Stats Overview
    this.tour.addStep({
      id: 'stats',
      text: `
        <div class="tour-content">
          <h3>📊 Vue d'ensemble</h3>
          <p>Ces statistiques vous donnent un aperçu rapide de vos projets actifs, révisions en attente et réunions à venir.</p>
        </div>
      `,
      attachTo: {
        element: '.stats-grid',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: this.tour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Suivant',
          action: this.tour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    // Step 3: Projects Section
    this.tour.addStep({
      id: 'projects',
      text: `
        <div class="tour-content">
          <h3>📁 Mes Projets</h3>
          <p>Ici vous trouverez tous vos projets PFE. Vous pouvez créer un nouveau projet ou gérer les existants.</p>
        </div>
      `,
      attachTo: {
        element: '.content-grid section:first-child',
        on: 'right'
      },
      buttons: [
        {
          text: 'Précédent',
          action: this.tour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Suivant',
          action: this.tour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    // Step 4: Sidebar Navigation
    this.tour.addStep({
      id: 'sidebar',
      text: `
        <div class="tour-content">
          <h3>🧭 Navigation</h3>
          <p>Utilisez ce menu pour accéder rapidement à:</p>
          <ul>
            <li>📋 <strong>Submissions:</strong> Télécharger vos documents</li>
            <li>📅 <strong>Meetings:</strong> Planifier des rendez-vous</li>
            <li>💬 <strong>Chat:</strong> Communiquer avec votre encadreur</li>
            <li>📝 <strong>Notes:</strong> Prendre des notes</li>
          </ul>
        </div>
      `,
      attachTo: {
        element: '.nav-links',
        on: 'right'
      },
      buttons: [
        {
          text: 'Précédent',
          action: this.tour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Suivant',
          action: this.tour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    // Step 5: Notifications
    this.tour.addStep({
      id: 'notifications',
      text: `
        <div class="tour-content">
          <h3>🔔 Notifications</h3>
          <p>Restez informé des mises à jour importantes: nouveaux messages, évaluations, rappels de réunions, etc.</p>
        </div>
      `,
      attachTo: {
        element: 'app-notification-bell',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: this.tour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Suivant',
          action: this.tour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    // Step 6: Profile
    this.tour.addStep({
      id: 'profile',
      text: `
        <div class="tour-content">
          <h3>👤 Profil</h3>
          <p>Cliquez ici pour accéder à votre profil et gérer vos informations personnelles.</p>
        </div>
      `,
      attachTo: {
        element: 'a[routerLink="/profile"]',
        on: 'right'
      },
      buttons: [
        {
          text: 'Précédent',
          action: this.tour.back,
          classes: 'shepherd-button-secondary'
        },
        {
          text: 'Suivant',
          action: this.tour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    // Step 7: Completion
    this.tour.addStep({
      id: 'complete',
      text: `
        <div class="tour-content">
          <h3>🎉 C'est tout!</h3>
          <p>Vous êtes maintenant prêt à utiliser Encadri pour gérer votre projet PFE.</p>
          <div class="tour-tips">
            <p><strong>💡 Conseil:</strong> Vous pouvez relancer ce guide à tout moment depuis le menu d'aide en haut à droite.</p>
          </div>
          <p class="tour-cta">Bonne chance avec votre projet! 🚀</p>
        </div>
      `,
      buttons: [
        {
          text: 'Terminer',
          action: this.tour.complete,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    // Event listeners
    this.tour.on('complete', () => {
      this.markTourAsCompleted('dashboard');
      console.log('Tour completed');
    });

    this.tour.on('cancel', () => {
      this.markTourAsCancelled('dashboard');
      console.log('Tour cancelled');
    });

    this.tour.start();
  }

  /**
   * Start quick tour for document submission feature
   */
  startSubmissionTour(): void {
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-encadri',
        scrollTo: true,
        cancelIcon: {
          enabled: true
        }
      }
    });

    this.tour.addStep({
      id: 'submission-intro',
      text: `
        <div class="tour-content">
          <h3>📄 Soumettre un document</h3>
          <p>Apprenez comment télécharger vos chapitres et rapports pour évaluation.</p>
        </div>
      `,
      buttons: [
        {
          text: 'Commencer',
          action: this.tour.next,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    this.tour.addStep({
      id: 'upload-button',
      text: `
        <div class="tour-content">
          <h3>1️⃣ Cliquez sur "Nouvelle Soumission"</h3>
          <p>Pour commencer, cliquez sur ce bouton pour ouvrir le formulaire de téléchargement.</p>
        </div>
      `,
      attachTo: {
        element: '.create-submission-btn',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Compris',
          action: this.tour.complete,
          classes: 'shepherd-button-primary'
        }
      ]
    });

    this.tour.start();
  }

  /**
   * Start quick tour for meetings feature
   */
  startMeetingTour(): void {
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-encadri',
        scrollTo: true,
        cancelIcon: {
          enabled: true
        }
      }
    });

    this.tour.addStep({
      id: 'meeting-intro',
      text: `
        <div class="tour-content">
          <h3>📅 Planifier une réunion</h3>
          <p>Organisez facilement vos rendez-vous avec votre encadreur.</p>
        </div>
      `,
      buttons: [
        {
          text: 'Compris',
          action: this.tour.complete,
          classes: 'shepherd-button-primary'
        }
      ]
    });

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
   * Show a simple tooltip/hint
   */
  showHint(message: string, element?: string): void {
    const tour = new Shepherd.Tour({
      useModalOverlay: false,
      defaultStepOptions: {
        classes: 'shepherd-theme-encadri-hint',
        scrollTo: false
      }
    });

    const stepOptions: any = {
      id: 'hint',
      text: `<div class="tour-hint">${message}</div>`,
      buttons: [
        {
          text: 'Compris',
          action: tour.complete,
          classes: 'shepherd-button-primary'
        }
      ]
    };

    if (element) {
      stepOptions.attachTo = {
        element: element,
        on: 'bottom'
      };
    }

    tour.addStep(stepOptions);
    tour.start();
  }
}

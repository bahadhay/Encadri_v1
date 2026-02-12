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
          <p>Gérez tous vos projets facilement</p>
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
          <h3>Vue d'ensemble</h3>
          <p>Statistiques et activités récentes</p>
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
   * PROJECTS TOUR - Enhanced with detailed explanations
   */
  startProjectsTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'projects-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📁</span>
          <h3>Gestion des Projets</h3>
          <p>Créez, modifiez et suivez tous vos projets académiques</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'projects-create',
      text: `
        <div class="tour-content">
          <span class="tour-icon">➕</span>
          <h3>Créer un Projet</h3>
          <p>Cliquez sur "Nouveau Projet" pour créer un nouveau projet</p>
          <p><small>Remplissez le titre, description, technologies et objectifs</small></p>
        </div>
      `,
      attachTo: { element: 'app-ui-button[routerLink*="new"], .create-project-btn, button:has-text("Nouveau Projet")', on: 'bottom' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'projects-search',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🔍</span>
          <h3>Rechercher</h3>
          <p>Utilisez la barre de recherche pour filtrer vos projets</p>
        </div>
      `,
      attachTo: { element: 'app-ui-input[type="search"], input[placeholder*="Search"], input[placeholder*="Rechercher"]', on: 'bottom' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'projects-actions',
      text: `
        <div class="tour-content">
          <span class="tour-icon">⚙️</span>
          <h3>Actions sur Projet</h3>
          <p>Cliquez sur un projet pour:</p>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>Voir les détails</li>
            <li>Modifier les informations</li>
            <li>Ajouter des soumissions</li>
            <li>Gérer les réunions</li>
            <li>Suivre les jalons</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('projects'));
    this.tour.on('cancel', () => this.markTourAsCancelled('projects'));
    this.tour.start();
  }

  /**
   * SUBMISSIONS TOUR - Enhanced with detailed explanations
   */
  startSubmissionsTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'submissions-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📄</span>
          <h3>Soumissions de Documents</h3>
          <p>Partagez vos rapports, présentations et livrables</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'submissions-create',
      text: `
        <div class="tour-content">
          <span class="tour-icon">⬆️</span>
          <h3>Créer une Soumission</h3>
          <p>Cliquez ici pour soumettre un nouveau document</p>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>Rapports (PDF, Word)</li>
            <li>Présentations (PPT, PDF)</li>
            <li>Code source (ZIP)</li>
          </ul>
        </div>
      `,
      attachTo: { element: 'app-ui-button[routerLink*="new"], .create-submission-btn, .new-submission-btn, button:has-text("Nouvelle"), button:has-text("New")', on: 'bottom' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'submissions-status',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🏷️</span>
          <h3>Statuts des Soumissions</h3>
          <p>Suivez l'état de vos soumissions:</p>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li><span style="color: #f59e0b;">⚠️ En attente</span> - En cours de révision</li>
            <li><span style="color: #10b981;">✅ Approuvé</span> - Validé</li>
            <li><span style="color: #3b82f6;">👁️ Révisé</span> - Avec commentaires</li>
            <li><span style="color: #ef4444;">❌ Rejeté</span> - À refaire</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('submissions'));
    this.tour.on('cancel', () => this.markTourAsCancelled('submissions'));
    this.tour.start();
  }

  /**
   * MEETINGS TOUR - Enhanced with detailed explanations
   */
  startMeetingsTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'meetings-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📅</span>
          <h3>Gestion des Réunions</h3>
          <p>Planifiez, demandez et suivez vos réunions</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'meetings-tabs',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🗂️</span>
          <h3>Onglets de Navigation</h3>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li><strong>À venir</strong> - Prochaines réunions planifiées</li>
            <li><strong>Demandes</strong> - Demandes en attente</li>
            <li><strong>Disponibilité</strong> - Horaires disponibles (superviseurs)</li>
            <li><strong>Historique</strong> - Réunions passées</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'meetings-request',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📝</span>
          <h3>Demander une Réunion</h3>
          <p><strong>Étudiants:</strong> Cliquez sur "Demander une réunion"</p>
          <p><small>Choisissez date, heure et ajoutez notes</small></p>
          <p><strong>Superviseurs:</strong> Définissez vos disponibilités</p>
        </div>
      `,
      attachTo: { element: 'button:has-text("Demander"), button:has-text("Request"), .request-meeting-btn', on: 'bottom' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'meetings-actions',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🎥</span>
          <h3>Actions Réunion</h3>
          <p>Pour chaque réunion:</p>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>🎥 Rejoindre l'appel vidéo</li>
            <li>👁️ Voir les détails</li>
            <li>✏️ Modifier (avant l'heure)</li>
            <li>❌ Annuler avec raison</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('meetings'));
    this.tour.on('cancel', () => this.markTourAsCancelled('meetings'));
    this.tour.start();
  }

  /**
   * CHAT TOUR - Enhanced with detailed explanations
   */
  startChatTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'chat-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">💬</span>
          <h3>Messagerie en Temps Réel</h3>
          <p>Communiquez directement avec votre équipe projet</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'chat-contacts',
      text: `
        <div class="tour-content">
          <span class="tour-icon">👥</span>
          <h3>Liste de Contacts</h3>
          <p>Tous les membres de vos projets apparaissent ici</p>
          <p><small>Cliquez sur un contact pour démarrer la conversation</small></p>
        </div>
      `,
      attachTo: { element: '.contacts-sidebar, .contacts-list', on: 'right' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'chat-features',
      text: `
        <div class="tour-content">
          <span class="tour-icon">✨</span>
          <h3>Fonctionnalités</h3>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>💬 Messages instantanés</li>
            <li>📎 Partage de fichiers</li>
            <li>👁️ Statut de lecture</li>
            <li>🔔 Notifications en temps réel</li>
            <li>📁 Organisation par projet</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('chat'));
    this.tour.on('cancel', () => this.markTourAsCancelled('chat'));
    this.tour.start();
  }

  /**
   * CALENDAR TOUR - Enhanced with detailed explanations
   */
  startCalendarTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'calendar-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📆</span>
          <h3>Calendrier des Événements</h3>
          <p>Visualisez tous vos événements et échéances en un coup d'œil</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'calendar-types',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🎨</span>
          <h3>Types d'Événements</h3>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>📅 <strong>Réunions</strong> - Rendez-vous planifiés</li>
            <li>📄 <strong>Soumissions</strong> - Dates limites de documents</li>
            <li>🏁 <strong>Jalons</strong> - Étapes du projet</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'calendar-navigation',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🔄</span>
          <h3>Navigation</h3>
          <p>Utilisez les flèches pour naviguer entre les mois</p>
          <p><small>Cliquez sur "Aujourd'hui" pour revenir au mois actuel</small></p>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('calendar'));
    this.tour.on('cancel', () => this.markTourAsCancelled('calendar'));
    this.tour.start();
  }

  /**
   * NOTES TOUR - Enhanced with detailed explanations
   */
  startNotesTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'notes-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📝</span>
          <h3>Prise de Notes</h3>
          <p>Organisez vos idées, réflexions et informations de projet</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'notes-create',
      text: `
        <div class="tour-content">
          <span class="tour-icon">➕</span>
          <h3>Créer une Note</h3>
          <p>Cliquez sur "Nouvelle Note" pour commencer</p>
          <p><small>Ajoutez titre, contenu et choisissez une couleur</small></p>
        </div>
      `,
      attachTo: { element: 'button:has-text("Nouvelle"), button:has-text("New"), .create-note-btn', on: 'bottom' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'notes-features',
      text: `
        <div class="tour-content">
          <span class="tour-icon">✨</span>
          <h3>Fonctionnalités</h3>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>📌 Épingler les notes importantes</li>
            <li>🎨 Codes couleur pour organisation</li>
            <li>📁 Dossiers pour regrouper</li>
            <li>🔍 Recherche dans les notes</li>
            <li>✏️ Édition rapide</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('notes'));
    this.tour.on('cancel', () => this.markTourAsCancelled('notes'));
    this.tour.start();
  }

  /**
   * PROFILE TOUR - Enhanced with detailed explanations
   */
  startProfileTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'profile-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">👤</span>
          <h3>Votre Profil</h3>
          <p>Gérez vos informations personnelles et préférences</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'profile-edit',
      text: `
        <div class="tour-content">
          <span class="tour-icon">✏️</span>
          <h3>Modifier le Profil</h3>
          <p>Cliquez sur "Modifier" pour mettre à jour:</p>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>📝 Nom complet</li>
            <li>📧 Email</li>
            <li>🖼️ Photo de profil</li>
          </ul>
        </div>
      `,
      attachTo: { element: 'button:has-text("Modifier"), button:has-text("Edit"), .edit-profile-btn', on: 'bottom' },
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('profile'));
    this.tour.on('cancel', () => this.markTourAsCancelled('profile'));
    this.tour.start();
  }

  /**
   * PROJECT DETAIL TOUR - Enhanced with detailed explanations
   */
  startProjectDetailTour(): void {
    this.tour = new ShepherdTour(this.getDefaultOptions());

    this.tour.addStep({
      id: 'project-detail-intro',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🎯</span>
          <h3>Centre de Contrôle du Projet</h3>
          <p>Toutes les informations et actions pour votre projet</p>
        </div>
      `,
      buttons: [
        { text: 'Passer', action: this.tour.cancel, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'project-detail-tabs',
      text: `
        <div class="tour-content">
          <span class="tour-icon">🗂️</span>
          <h3>Onglets du Projet</h3>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>📋 <strong>Vue d'ensemble</strong> - Infos générales</li>
            <li>📄 <strong>Soumissions</strong> - Documents livrables</li>
            <li>📅 <strong>Réunions</strong> - Rendez-vous</li>
            <li>⭐ <strong>Évaluations</strong> - Notes et feedback</li>
            <li>🏁 <strong>Jalons</strong> - Étapes du projet</li>
            <li>📁 <strong>Documents</strong> - Fichiers partagés</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'project-detail-progress',
      text: `
        <div class="tour-content">
          <span class="tour-icon">📊</span>
          <h3>Barre de Progression</h3>
          <p>Suivez l'avancement automatique basé sur les jalons complétés</p>
          <p><small>La progression se met à jour quand vous marquez les jalons comme terminés</small></p>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Suivant', action: this.tour.next, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.addStep({
      id: 'project-detail-actions',
      text: `
        <div class="tour-content">
          <span class="tour-icon">⚙️</span>
          <h3>Actions Rapides</h3>
          <p>En haut de page:</p>
          <ul style="text-align: left; font-size: 12px; margin-top: 8px;">
            <li>💬 Ouvrir le chat avec votre équipe</li>
            <li>➕ Inviter un étudiant/superviseur</li>
            <li>✏️ Modifier les détails du projet</li>
            <li>🚪 Quitter le projet (membres)</li>
            <li>🗑️ Supprimer le projet (propriétaire)</li>
          </ul>
        </div>
      `,
      buttons: [
        { text: 'Précédent', action: this.tour.back, classes: 'shepherd-button-secondary' },
        { text: 'Terminé', action: this.tour.complete, classes: 'shepherd-button-primary' }
      ]
    });

    this.tour.on('complete', () => this.markTourAsCompleted('project-detail'));
    this.tour.on('cancel', () => this.markTourAsCancelled('project-detail'));
    this.tour.start();
  }

  /**
   * Check if user is a first-time visitor (brand new user)
   */
  isFirstTimeUser(): boolean {
    return localStorage.getItem('encadri-first-visit') !== 'true';
  }

  /**
   * Mark that the user has visited the app
   */
  markAsReturningUser(): void {
    localStorage.setItem('encadri-first-visit', 'true');
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
   * Reset all tours and first-time user flag (for testing)
   */
  resetAllTours(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('tour-')) {
        localStorage.removeItem(key);
      }
    });
    // Also reset first-time user flag
    localStorage.removeItem('encadri-first-visit');
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
   * Auto-start tour for EACH page on first visit (progressive onboarding)
   * Shows relevant guide when user visits a page for the first time
   */
  autoStartTour(pageName: string): void {
    // Check if user has already seen this specific page's tour
    if (this.hasSeen(pageName)) {
      return; // Already seen this page's tour
    }

    // Wait for page to load, then show the appropriate tour
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

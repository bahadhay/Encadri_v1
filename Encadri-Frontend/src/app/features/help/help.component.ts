import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TourService } from '../../core/services/tour.service';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface HelpSection {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: Array<{
    title: string;
    description: string;
    actions?: Array<{icon: string; text: string}>;
  }>;
  tourId?: string;
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule, UiCardComponent, UiButtonComponent, IconComponent],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent {
  private router = inject(Router);
  private tourService = inject(TourService);

  selectedSection = signal<string>('overview');

  helpSections: HelpSection[] = [
    {
      id: 'overview',
      icon: '🏠',
      title: 'Vue d\'ensemble',
      description: 'Bienvenue dans Encadri, votre plateforme de gestion de projets académiques',
      features: [
        {
          title: 'Qu\'est-ce qu\'Encadri?',
          description: 'Encadri est une plateforme complète pour gérer vos projets académiques. Elle facilite la collaboration entre étudiants et superviseurs, le suivi des progrès, et l\'organisation de tous les aspects de votre projet.'
        },
        {
          title: 'Premiers pas',
          description: 'Commencez par créer votre premier projet, inviter les membres de votre équipe, et définir les jalons clés. Utilisez les guides interactifs disponibles sur chaque page pour découvrir toutes les fonctionnalités.'
        }
      ]
    },
    {
      id: 'projects',
      icon: '📁',
      title: 'Gestion des Projets',
      description: 'Créez, modifiez et suivez vos projets académiques',
      tourId: 'projects',
      features: [
        {
          title: 'Créer un projet',
          description: 'Cliquez sur "Nouveau Projet" pour créer un nouveau projet. Remplissez les informations essentielles:',
          actions: [
            { icon: '✏️', text: 'Titre: Nom de votre projet' },
            { icon: '📝', text: 'Description: Description détaillée' },
            { icon: '💻', text: 'Technologies: Liste des technologies utilisées' },
            { icon: '🎯', text: 'Objectifs: Objectifs principaux du projet' },
            { icon: '📊', text: 'Type: PFE, Stage, Recherche, etc.' }
          ]
        },
        {
          title: 'Modifier un projet',
          description: 'Cliquez sur un projet puis sur "Modifier" pour mettre à jour ses informations. Seul le propriétaire du projet peut le modifier.'
        },
        {
          title: 'Inviter des membres',
          description: 'Dans les détails du projet, utilisez le bouton "Inviter" pour ajouter un étudiant ou un superviseur. Un email d\'invitation sera envoyé.'
        },
        {
          title: 'Suivre la progression',
          description: 'La barre de progression se met à jour automatiquement en fonction des jalons complétés. Consultez l\'onglet "Jalons" pour gérer les étapes du projet.'
        }
      ]
    },
    {
      id: 'submissions',
      icon: '📄',
      title: 'Soumissions',
      description: 'Partagez vos documents et livrables',
      tourId: 'submissions',
      features: [
        {
          title: 'Créer une soumission',
          description: 'Cliquez sur "Nouvelle Soumission" et remplissez:',
          actions: [
            { icon: '📄', text: 'Titre: Nom du document' },
            { icon: '📝', text: 'Description: But du document' },
            { icon: '📁', text: 'Type: Rapport, Présentation, Code' },
            { icon: '⬆️', text: 'Fichier: Glissez-déposez ou sélectionnez' }
          ]
        },
        {
          title: 'Statuts des soumissions',
          description: 'Suivez l\'état de vos soumissions:',
          actions: [
            { icon: '⚠️', text: 'En attente: En cours de révision' },
            { icon: '✅', text: 'Approuvé: Validé par le superviseur' },
            { icon: '👁️', text: 'Révisé: Avec commentaires à traiter' },
            { icon: '❌', text: 'Rejeté: À refaire' }
          ]
        },
        {
          title: 'Types de fichiers acceptés',
          description: 'Formats supportés: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), ZIP, images (PNG/JPG)'
        }
      ]
    },
    {
      id: 'meetings',
      icon: '📅',
      title: 'Réunions',
      description: 'Planifiez et gérez vos réunions',
      tourId: 'meetings',
      features: [
        {
          title: 'Demander une réunion (Étudiants)',
          description: 'Processus de demande de réunion:',
          actions: [
            { icon: '1️⃣', text: 'Cliquez sur "Demander une réunion"' },
            { icon: '2️⃣', text: 'Choisissez la date et l\'heure préférées' },
            { icon: '3️⃣', text: 'Ajoutez le sujet et des notes' },
            { icon: '4️⃣', text: 'Attendez l\'approbation du superviseur' }
          ]
        },
        {
          title: 'Définir les disponibilités (Superviseurs)',
          description: 'Cliquez sur "Définir disponibilités" pour indiquer vos créneaux disponibles chaque semaine. Les étudiants verront ces horaires lors de leurs demandes.'
        },
        {
          title: 'Gérer les réunions',
          description: 'Actions disponibles:',
          actions: [
            { icon: '✅', text: 'Approuver: Confirmer la réunion' },
            { icon: '❌', text: 'Rejeter: Refuser avec raison' },
            { icon: '🎥', text: 'Rejoindre: Démarrer l\'appel vidéo' },
            { icon: '✏️', text: 'Modifier: Changer date/heure' },
            { icon: '🗑️', text: 'Annuler: Annuler avec raison' }
          ]
        },
        {
          title: 'Appels vidéo',
          description: 'Cliquez sur "Rejoindre l\'appel" pour démarrer la visioconférence intégrée. Assurez-vous d\'autoriser l\'accès à votre caméra et micro.'
        }
      ]
    },
    {
      id: 'chat',
      icon: '💬',
      title: 'Messagerie',
      description: 'Communication en temps réel',
      tourId: 'chat',
      features: [
        {
          title: 'Démarrer une conversation',
          description: 'Dans la liste de contacts, cliquez sur un membre de votre équipe projet pour ouvrir la conversation.'
        },
        {
          title: 'Fonctionnalités du chat',
          description: 'Fonctionnalités disponibles:',
          actions: [
            { icon: '💬', text: 'Messages instantanés en temps réel' },
            { icon: '📎', text: 'Partage de fichiers et documents' },
            { icon: '👁️', text: 'Accusés de lecture' },
            { icon: '🔔', text: 'Notifications pour nouveaux messages' },
            { icon: '📱', text: 'Interface responsive (mobile/desktop)' }
          ]
        },
        {
          title: 'Organisation',
          description: 'Les conversations sont organisées par projet. Vous verrez uniquement les membres des projets auxquels vous participez.'
        }
      ]
    },
    {
      id: 'calendar',
      icon: '📆',
      title: 'Calendrier',
      description: 'Vue d\'ensemble de vos événements',
      tourId: 'calendar',
      features: [
        {
          title: 'Types d\'événements',
          description: 'Le calendrier affiche:',
          actions: [
            { icon: '📅', text: 'Réunions: Rendez-vous planifiés' },
            { icon: '📄', text: 'Soumissions: Dates limites de documents' },
            { icon: '🏁', text: 'Jalons: Étapes importantes du projet' }
          ]
        },
        {
          title: 'Navigation',
          description: 'Utilisez les flèches ◀️ ▶️ pour naviguer entre les mois. Cliquez sur "Aujourd\'hui" pour revenir au mois actuel.'
        },
        {
          title: 'Détails des événements',
          description: 'Cliquez sur un événement dans le calendrier pour voir ses détails complets et accéder aux actions rapides.'
        }
      ]
    },
    {
      id: 'notes',
      icon: '📝',
      title: 'Notes',
      description: 'Organisez vos idées et informations',
      tourId: 'notes',
      features: [
        {
          title: 'Créer une note',
          description: 'Cliquez sur "Nouvelle Note" et remplissez:',
          actions: [
            { icon: '✏️', text: 'Titre: Sujet de la note' },
            { icon: '📝', text: 'Contenu: Corps de la note' },
            { icon: '🎨', text: 'Couleur: Code couleur pour organisation' },
            { icon: '📁', text: 'Dossier: Catégorie (optionnel)' }
          ]
        },
        {
          title: 'Organisation',
          description: 'Fonctionnalités d\'organisation:',
          actions: [
            { icon: '📌', text: 'Épingler: Garder en haut de liste' },
            { icon: '🎨', text: 'Couleurs: 7 couleurs disponibles' },
            { icon: '📁', text: 'Dossiers: Créer des catégories' },
            { icon: '🔍', text: 'Recherche: Filtrer par titre/contenu' }
          ]
        }
      ]
    },
    {
      id: 'milestones',
      icon: '🏁',
      title: 'Jalons',
      description: 'Étapes et progression du projet',
      features: [
        {
          title: 'Créer un jalon',
          description: 'Dans l\'onglet "Jalons" d\'un projet, définissez les étapes importantes:',
          actions: [
            { icon: '📝', text: 'Titre: Nom de l\'étape' },
            { icon: '📄', text: 'Description: Détails du jalon' },
            { icon: '📅', text: 'Date limite: Échéance' },
            { icon: '📊', text: 'Statut: Non commencé/En cours/Terminé' }
          ]
        },
        {
          title: 'Suivi de progression',
          description: 'La barre de progression du projet se calcule automatiquement: (Jalons complétés / Total jalons) × 100%'
        },
        {
          title: 'Marquer comme terminé',
          description: 'Cochez un jalon pour le marquer comme terminé. La progression du projet sera mise à jour instantanément.'
        }
      ]
    },
    {
      id: 'profile',
      icon: '👤',
      title: 'Profil',
      description: 'Gérez vos informations personnelles',
      tourId: 'profile',
      features: [
        {
          title: 'Modifier le profil',
          description: 'Cliquez sur "Modifier" pour mettre à jour:',
          actions: [
            { icon: '👤', text: 'Nom complet' },
            { icon: '📧', text: 'Adresse email' },
            { icon: '🖼️', text: 'Photo de profil' }
          ]
        }
      ]
    },
    {
      id: 'faq',
      icon: '❓',
      title: 'FAQ',
      description: 'Questions fréquemment posées',
      features: [
        {
          title: 'Comment inviter un superviseur/étudiant?',
          description: 'Allez dans les détails du projet → Cliquez sur "Inviter un étudiant" ou "Inviter un superviseur" → Entrez l\'email → Envoyez l\'invitation. La personne recevra un email.'
        },
        {
          title: 'Comment annuler une réunion?',
          description: 'Allez dans Réunions → Onglet "À venir" → Cliquez sur la réunion → "Annuler" → Sélectionnez une raison → Confirmez. Les autres participants seront notifiés.'
        },
        {
          title: 'Les jalons ne mettent pas à jour la progression?',
          description: 'Assurez-vous de marquer le jalon comme "Terminé". La progression se calcule uniquement sur les jalons avec statut "completed".'
        },
        {
          title: 'Je ne vois pas mes contacts dans le chat?',
          description: 'Les contacts apparaissent uniquement si vous êtes assigné à un projet commun. Vérifiez que le projet a bien un étudiant ET un superviseur assignés.'
        },
        {
          title: 'Comment réinitialiser le guide?',
          description: 'Cliquez sur l\'icône "?" en bas à droite → "Relancer le guide" pour revoir le guide de n\'importe quelle page.'
        }
      ]
    }
  ];

  selectSection(sectionId: string) {
    this.selectedSection.set(sectionId);
  }

  get currentSection(): HelpSection | undefined {
    return this.helpSections.find(s => s.id === this.selectedSection());
  }

  startTour(tourId: string) {
    // Close help page and navigate to the relevant page, then start tour
    const tourRouteMap: {[key: string]: string} = {
      'projects': '/projects',
      'submissions': '/submissions',
      'meetings': '/meetings',
      'chat': '/chat',
      'calendar': '/calendar',
      'notes': '/notes',
      'profile': '/profile'
    };

    const route = tourRouteMap[tourId];
    if (route) {
      // Reset the tour first
      this.tourService.resetTour(tourId);
      // Navigate to the page
      this.router.navigate([route]).then(() => {
        // Start the tour after navigation
        setTimeout(() => {
          switch(tourId) {
            case 'projects': this.tourService.startProjectsTour(); break;
            case 'submissions': this.tourService.startSubmissionsTour(); break;
            case 'meetings': this.tourService.startMeetingsTour(); break;
            case 'chat': this.tourService.startChatTour(); break;
            case 'calendar': this.tourService.startCalendarTour(); break;
            case 'notes': this.tourService.startNotesTour(); break;
            case 'profile': this.tourService.startProfileTour(); break;
          }
        }, 500);
      });
    }
  }

  resetAllTours() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les guides? Vous reverrez tous les guides lors de votre prochaine visite.')) {
      this.tourService.resetAllTours();
      alert('Tous les guides ont été réinitialisés!');
    }
  }
}

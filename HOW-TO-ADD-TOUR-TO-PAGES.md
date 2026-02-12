# 🎯 Comment Ajouter le Guide Auto à Chaque Page

Le guide s'affichera **automatiquement la première fois** qu'un utilisateur visite la page!

---

## 📋 **Code à Ajouter (3 lignes)**

Dans **n'importe quel composant** où vous voulez un guide auto:

### **Étape 1: Import**

```typescript
import { TourService } from '../../../core/services/tour.service';
// Ajustez le chemin selon votre emplacement
```

### **Étape 2: Injection**

```typescript
export class VotreComponent {
  private tourService = inject(TourService);
  // OU si vous utilisez constructor:
  // constructor(private tourService: TourService) {}
}
```

### **Étape 3: Appel dans ngOnInit**

```typescript
ngOnInit() {
  // Vos autres init...

  // Ajouter cette ligne:
  this.tourService.autoStartTour('nom-de-page');
}
```

---

## 🗺️ **Noms de Pages Disponibles**

Utilisez ces noms exacts dans `autoStartTour()`:

| Page | Nom à utiliser | Guide créé |
|------|----------------|-----------|
| Dashboard | `'dashboard'` | ✅ Oui |
| Liste Projets | `'projects'` | ✅ Oui |
| Détail Projet | `'project-detail'` | ✅ Oui |
| Soumissions | `'submissions'` | ✅ Oui |
| Réunions | `'meetings'` | ✅ Oui |
| Chat | `'chat'` | ✅ Oui |
| Calendrier | `'calendar'` | ✅ Oui |
| Notes | `'notes'` | ✅ Oui |
| Profil | `'profile'` | ✅ Oui |

---

## 📝 **Exemples Complets**

### **Exemple 1: Projects List**

**Fichier:** `src/app/features/projects/project-list/project-list.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../../core/services/tour.service';

@Component({
  selector: 'app-project-list',
  // ...
})
export class ProjectListComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadProjects();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('projects');
  }

  loadProjects() {
    // Votre code...
  }
}
```

### **Exemple 2: Submissions**

**Fichier:** `src/app/features/submissions/submission-list/submission-list.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../../core/services/tour.service';

@Component({
  selector: 'app-submission-list',
  // ...
})
export class SubmissionListComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadSubmissions();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('submissions');
  }
}
```

### **Exemple 3: Meetings Dashboard**

**Fichier:** `src/app/features/meetings/meetings-dashboard/meetings-dashboard.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../../core/services/tour.service';

@Component({
  selector: 'app-meetings-dashboard',
  // ...
})
export class MeetingsDashboardComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadMeetings();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('meetings');
  }
}
```

### **Exemple 4: Chat**

**Fichier:** `src/app/features/chat/chat-container/chat-container.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../../core/services/tour.service';

@Component({
  selector: 'app-chat-container',
  // ...
})
export class ChatContainerComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadMessages();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('chat');
  }
}
```

### **Exemple 5: Calendar**

**Fichier:** `src/app/features/calendar/calendar.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../core/services/tour.service';

@Component({
  selector: 'app-calendar',
  // ...
})
export class CalendarComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadEvents();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('calendar');
  }
}
```

### **Exemple 6: Notes**

**Fichier:** `src/app/features/notes/note-list/note-list.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../../core/services/tour.service';

@Component({
  selector: 'app-note-list',
  // ...
})
export class NoteListComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadNotes();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('notes');
  }
}
```

### **Exemple 7: Profile**

**Fichier:** `src/app/features/profile/profile.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../core/services/tour.service';

@Component({
  selector: 'app-profile',
  // ...
})
export class ProfileComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadProfile();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('profile');
  }
}
```

### **Exemple 8: Project Detail**

**Fichier:** `src/app/features/projects/project-detail/project-detail.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TourService } from '../../../core/services/tour.service';

@Component({
  selector: 'app-project-detail',
  // ...
})
export class ProjectDetailComponent implements OnInit {
  private tourService = inject(TourService);

  ngOnInit() {
    this.loadProject();

    // ✅ Ajouter cette ligne
    this.tourService.autoStartTour('project-detail');
  }
}
```

---

## 🔧 **Si le Composant N'a Pas de ngOnInit**

Ajoutez-le:

```typescript
import { Component, inject, OnInit } from '@angular/core';
//                            ^^^^^^ Ajouter OnInit

export class VotreComponent implements OnInit {
//                          ^^^^^^^^^^^^^^^^ Ajouter implements

  private tourService = inject(TourService);

  // Ajouter cette méthode
  ngOnInit() {
    this.tourService.autoStartTour('votre-page');
  }
}
```

---

## 🎯 **Comment Ça Marche?**

### **Comportement Auto:**

```
Utilisateur visite Projects (première fois):
1. Page charge
2. ngOnInit() appelé
3. autoStartTour('projects') vérifié
4. Pas encore vu? → Guide démarre! ✅
5. Marqué comme "vu" dans localStorage

Utilisateur revisite Projects:
1. Page charge
2. ngOnInit() appelé
3. autoStartTour('projects') vérifié
4. Déjà vu? → Pas de guide ❌

Utilisateur visite Chat (première fois):
1. Page charge
2. Guide Chat démarre! ✅
```

### **Progressif:**
- Dashboard → Guide 1 (première visite)
- Projects → Guide 2 (première visite)
- Chat → Guide 3 (première visite)
- Etc.

L'utilisateur **apprend au fur et à mesure** qu'il explore!

---

## ✅ **Pages Prioritaires à Implémenter**

Je recommande d'ajouter en priorité:

1. ✅ **Dashboard** (déjà fait)
2. 🔴 **Project List** - Important pour étudiants
3. 🔴 **Submissions List** - Important pour soumettre documents
4. 🔴 **Meetings Dashboard** - Important pour rendez-vous
5. 🟡 **Chat** - Important pour communication
6. 🟡 **Calendar** - Bon pour organisation
7. 🟢 **Notes** - Utile mais secondaire
8. 🟢 **Profile** - Utile mais secondaire

---

## 🧪 **Pour Tester**

### **Test Normal:**
```
1. Visitez page Projects
2. ✅ Guide démarre automatiquement
3. Fermez le guide
4. Quittez et revenez sur Projects
5. ✅ Pas de guide (déjà vu)
6. Visitez Chat
7. ✅ Guide Chat démarre
```

### **Reset pour Re-tester:**

**Browser Console (F12):**
```javascript
// Reset tout
localStorage.clear();
location.reload();

// Reset une page spécifique
localStorage.removeItem('tour-projects-completed');
location.reload();
```

---

## 📝 **Checklist d'Implémentation**

Pour chaque page:

- [ ] Import TourService
- [ ] Inject TourService (via inject() ou constructor)
- [ ] S'assurer que ngOnInit existe (implemente OnInit)
- [ ] Ajouter `this.tourService.autoStartTour('nom-page')`
- [ ] Tester: première visite → guide démarre
- [ ] Tester: deuxième visite → pas de guide

---

## 🎨 **Personnaliser les Tours**

Si vous voulez modifier le contenu d'un tour:

**Fichier:** `src/app/core/services/tour.service.ts`

Trouvez la méthode (exemple `startProjectsTour()`) et modifiez:

```typescript
startProjectsTour(): void {
  this.tour = new ShepherdTour(this.getDefaultOptions());

  this.tour.addStep({
    id: 'projects-list',
    text: `
      <div class="tour-content">
        <span class="tour-icon">📁</span>
        <h3>Vos Projets</h3>
        <p>Créez et gérez vos projets ici</p>  ← Modifier ici
      </div>
    `,
    buttons: [
      { text: 'Compris', action: this.tour.complete, classes: 'shepherd-button-primary' }
    ]
  });

  this.tour.on('complete', () => this.markTourAsCompleted('projects'));
  this.tour.start();
}
```

---

## 🚀 **Résumé Rapide**

**3 étapes pour ajouter un guide auto:**

```typescript
// 1. Import
import { TourService } from '../path/to/tour.service';

// 2. Inject
private tourService = inject(TourService);

// 3. Call in ngOnInit
ngOnInit() {
  this.tourService.autoStartTour('page-name');
}
```

**C'est tout!** 🎉

---

## 💡 **Avantages de ce Système**

✅ **Progressif** - Apprend au fur et à mesure
✅ **Non-intrusif** - Une seule fois par page
✅ **Flexible** - Peut skip ou voir manuellement
✅ **Intelligent** - Se souvient avec localStorage
✅ **Simple** - 3 lignes de code par page

---

**Besoin d'aide? Contactez l'équipe dev!** 👨‍💻

import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

import { ProfileComponent } from './features/profile/profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) 
      },
      // Project Routes - Specific first
      {
        path: 'projects/new',
        loadComponent: () => import('./features/projects/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'projects/:projectId/submissions/new',
        loadComponent: () => import('./features/submissions/submission-form/submission-form.component').then(m => m.SubmissionFormComponent)
      },
      {
        path: 'projects/:projectId/meetings/new',
        loadComponent: () => import('./features/meetings/meeting-form/meeting-form.component').then(m => m.MeetingFormComponent)
      },
      {
        path: 'projects/:projectId/evaluations/new',
        loadComponent: () => import('./features/evaluations/evaluation-form/evaluation-form.component').then(m => m.EvaluationFormComponent)
      },
      {
        path: 'projects/:projectId/evaluations/:evaluationId/edit',
        loadComponent: () => import('./features/evaluations/evaluation-form/evaluation-form.component').then(m => m.EvaluationFormComponent)
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () => import('./features/projects/project-form/project-form.component').then(m => m.ProjectFormComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      { 
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      // Independent Feature Routes
      {
        path: 'submissions/:id',
        loadComponent: () => import('./features/submissions/submission-detail/submission-detail.component').then(m => m.SubmissionDetailComponent)
      },
      {
        path: 'submissions',
        loadComponent: () => import('./features/submissions/submission-list/submission-list.component').then(m => m.SubmissionListComponent)
      },
      {
        path: 'meetings/set-availability',
        loadComponent: () => import('./features/meetings/set-availability/set-availability.component').then(m => m.SetAvailabilityComponent)
      },
      {
        path: 'meetings/bulk-invite',
        loadComponent: () => import('./features/meetings/bulk-invite/bulk-invite.component').then(m => m.BulkInviteComponent)
      },
      {
        path: 'meetings/request-meeting',
        loadComponent: () => import('./features/meetings/request-meeting/request-meeting.component').then(m => m.RequestMeetingComponent)
      },
      {
        path: 'meetings',
        loadComponent: () => import('./features/meetings/meetings-dashboard/meetings-dashboard.component').then(m => m.MeetingsDashboardComponent)
      },
      {
        path: 'video-call/:meetingId',
        loadComponent: () => import('./features/video-call/video-call.component').then(m => m.VideoCallComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat-container.component').then(m => m.ChatContainerComponent)
      },
      // Other features will go here
    ]
  },
  { path: '**', redirectTo: '' }
];

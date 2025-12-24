import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatComponent } from './chat.component';
import { environment } from '../../../environments/environment';

interface Contact {
  email: string;
  name: string;
  role: 'student' | 'supervisor';
  projectId?: string;
  projectTitle?: string;
  lastMessage?: string;
  unreadCount?: number;
}

interface Project {
  id: string;
  title: string;
  studentEmail: string;
  studentName: string;
  supervisorEmail: string;
  supervisorName: string;
}

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  template: `
    <div class="chat-container-wrapper">
      <!-- Contacts Sidebar -->
      <aside class="contacts-sidebar" [class.mobile-hidden]="selectedContact">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <span class="contact-count">{{ contacts.length }} contact{{ contacts.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="contacts-list" *ngIf="!isLoadingContacts">
          <div
            *ngFor="let contact of contacts"
            class="contact-item"
            [class.active]="selectedContact?.email === contact.email"
            (click)="selectContact(contact)">

            <div class="contact-avatar">
              {{ getInitials(contact.name) }}
            </div>

            <div class="contact-info">
              <div class="contact-header">
                <span class="contact-name">{{ contact.name }}</span>
                <span class="contact-badge" [class.supervisor]="contact.role === 'supervisor'">
                  {{ contact.role }}
                </span>
              </div>
              <p class="contact-project" *ngIf="contact.projectTitle">
                {{ contact.projectTitle }}
              </p>
              <p class="last-message" *ngIf="contact.lastMessage">
                {{ contact.lastMessage }}
              </p>
            </div>

            <div class="unread-badge" *ngIf="contact.unreadCount && contact.unreadCount > 0">
              {{ contact.unreadCount }}
            </div>
          </div>

          <div *ngIf="contacts.length === 0" class="no-contacts">
            <p>No contacts available</p>
            <small>You need to be assigned to a project to start chatting</small>
          </div>
        </div>

        <div class="loading" *ngIf="isLoadingContacts">
          <div class="spinner"></div>
          <p>Loading contacts...</p>
        </div>
      </aside>

      <!-- Chat Area -->
      <div class="chat-area" *ngIf="selectedContact">
        <div class="chat-header-mobile">
          <button class="back-btn" (click)="deselectContact()">← Back</button>
          <div class="selected-contact-info">
            <strong>{{ selectedContact.name }}</strong>
            <small>{{ selectedContact.role }}</small>
          </div>
        </div>

        <app-chat
          [recipientEmail]="selectedContact.email"
          [recipientName]="selectedContact.name"
          [projectId]="selectedContact.projectId || 'general'">
        </app-chat>
      </div>

      <div class="chat-area empty-state" *ngIf="!selectedContact">
        <div class="empty-content">
          <div class="empty-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a contact from the list to start chatting</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container-wrapper {
      position: fixed;
      top: 64px;
      left: var(--sidebar-width, 250px);
      right: 0;
      bottom: 0;
      display: flex;
      background: #f5f7fa;
      z-index: 1;
      transition: left 0.3s ease;
    }

    .contacts-sidebar {
      width: 320px;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .sidebar-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }

    .contact-count {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .contacts-list {
      flex: 1;
      overflow-y: auto;
    }

    .contact-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      cursor: pointer;
      border-bottom: 1px solid #f1f1f1;
      transition: background 0.2s;
    }

    .contact-item:hover {
      background: #f8f9fa;
    }

    .contact-item.active {
      background: #eef2ff;
      border-left: 3px solid #667eea;
    }

    .contact-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .contact-info {
      flex: 1;
      margin-left: 1rem;
      min-width: 0;
    }

    .contact-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .contact-name {
      font-weight: 600;
      color: #2d3748;
    }

    .contact-badge {
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      background: #e2e8f0;
      color: #4a5568;
      text-transform: capitalize;
    }

    .contact-badge.supervisor {
      background: #fef3c7;
      color: #92400e;
    }

    .contact-project {
      font-size: 0.8rem;
      color: #667eea;
      margin: 0.25rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .last-message {
      font-size: 0.85rem;
      color: #718096;
      margin: 0.25rem 0 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unread-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .no-contacts {
      padding: 3rem 1.5rem;
      text-align: center;
      color: #718096;
    }

    .no-contacts p {
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }

    .no-contacts small {
      color: #a0aec0;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #718096;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .chat-area app-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
    }

    .chat-header-mobile {
      display: none;
      flex-shrink: 0;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }

    .empty-content {
      text-align: center;
      color: #718096;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-content h3 {
      margin: 0 0 0.5rem 0;
      color: #2d3748;
    }

    .empty-content p {
      margin: 0;
      font-size: 0.95rem;
    }

    /* Tablet and smaller - Collapsed sidebar */
    @media (max-width: 1024px) {
      .chat-container-wrapper {
        left: 60px; /* Collapsed sidebar width */
      }

      .contacts-sidebar {
        width: 280px;
      }

      .sidebar-header h2 {
        font-size: 1.25rem;
      }
    }

    /* Mobile - Full screen chat */
    @media (max-width: 768px) {
      .chat-container-wrapper {
        left: 0;
        top: 64px;
        right: 0;
      }

      .contacts-sidebar {
        width: 100%;
        position: absolute;
        z-index: 20;
        height: 100%;
        transition: transform 0.3s ease;
      }

      .contacts-sidebar.mobile-hidden {
        transform: translateX(-100%);
      }

      .sidebar-header {
        padding: 1rem;
      }

      .sidebar-header h2 {
        font-size: 1.1rem;
      }

      .contact-item {
        padding: 0.75rem;
      }

      .contact-avatar {
        width: 42px;
        height: 42px;
        font-size: 1rem;
      }

      .contact-name {
        font-size: 0.9rem;
      }

      .contact-project {
        font-size: 0.75rem;
      }

      .chat-header-mobile {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-bottom: 1px solid #e2e8f0;
      }

      .back-btn {
        padding: 0.5rem 1rem;
        border: none;
        background: #eef2ff;
        color: #667eea;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
      }

      .selected-contact-info {
        display: flex;
        flex-direction: column;
      }

      .selected-contact-info strong {
        font-size: 0.95rem;
      }

      .selected-contact-info small {
        color: #718096;
        text-transform: capitalize;
        font-size: 0.75rem;
      }
    }

    /* Small mobile phones */
    @media (max-width: 480px) {
      .contacts-sidebar {
        width: 100%;
      }

      .sidebar-header {
        padding: 0.75rem 1rem;
      }

      .sidebar-header h2 {
        font-size: 1rem;
      }

      .contact-count {
        font-size: 0.75rem;
      }

      .contact-item {
        padding: 0.625rem 0.75rem;
      }

      .contact-avatar {
        width: 38px;
        height: 38px;
        font-size: 0.9rem;
      }

      .contact-info {
        margin-left: 0.75rem;
      }

      .contact-name {
        font-size: 0.85rem;
      }

      .contact-badge {
        font-size: 0.65rem;
        padding: 0.1rem 0.4rem;
      }

      .contact-project {
        font-size: 0.7rem;
      }

      .last-message {
        font-size: 0.75rem;
      }

      .unread-badge {
        width: 20px;
        height: 20px;
        font-size: 0.7rem;
      }

      .empty-icon {
        font-size: 3rem;
      }

      .empty-content h3 {
        font-size: 1rem;
      }

      .empty-content p {
        font-size: 0.85rem;
      }

      .chat-header-mobile {
        padding: 0.75rem;
      }

      .back-btn {
        padding: 0.4rem 0.75rem;
        font-size: 0.85rem;
      }

      .selected-contact-info strong {
        font-size: 0.875rem;
      }

      .selected-contact-info small {
        font-size: 0.7rem;
      }
    }

    /* Very small screens */
    @media (max-width: 360px) {
      .sidebar-header h2 {
        font-size: 0.95rem;
      }

      .contact-name {
        font-size: 0.8rem;
      }

      .contact-project {
        display: none; /* Hide project title on very small screens */
      }
    }
  `]
})
export class ChatContainerComponent implements OnInit {
  contacts: Contact[] = [];
  selectedContact: Contact | null = null;
  isLoadingContacts = true;
  currentUser: any;

  private apiUrl = environment.apiUrl;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.currentUser();
    if (!this.currentUser) {
      console.error('No authenticated user');
      return;
    }

    await this.loadContacts();
  }

  async loadContacts() {
    try {
      this.isLoadingContacts = true;
      console.log('🔍 Loading contacts...');
      console.log('👤 Current user:', this.currentUser);

      // Fetch projects for current user only (filtered by backend)
      const projects = await this.http.get<Project[]>(`${this.apiUrl}/projects?userEmail=${encodeURIComponent(this.currentUser.email)}`).toPromise();
      console.log('📦 Projects received:', projects);

      if (!projects) {
        console.warn('⚠️ No projects returned from API');
        this.contacts = [];
        return;
      }

      const contactsMap = new Map<string, Contact>();

      // Build contacts based on user role
      if (this.currentUser.userRole === 'student') {
        console.log('🎓 Loading as STUDENT - looking for supervisors');
        console.log('🔎 Filtering projects where studentEmail =', this.currentUser.email);

        const myProjects = projects.filter(p => p.studentEmail === this.currentUser.email);
        console.log('✅ My projects as student:', myProjects);

        myProjects.forEach(project => {
          console.log('➕ Adding supervisor:', project.supervisorEmail, 'from project:', project.title);
          if (!contactsMap.has(project.supervisorEmail)) {
            contactsMap.set(project.supervisorEmail, {
              email: project.supervisorEmail,
              name: project.supervisorName || project.supervisorEmail,
              role: 'supervisor',
              projectId: project.id,
              projectTitle: project.title
            });
          }
        });
      } else if (this.currentUser.userRole === 'supervisor') {
        console.log('👨‍🏫 Loading as SUPERVISOR - looking for students');
        console.log('🔎 Filtering projects where supervisorEmail =', this.currentUser.email);

        const myProjects = projects.filter(p => p.supervisorEmail === this.currentUser.email);
        console.log('✅ My projects as supervisor:', myProjects);

        myProjects.forEach(project => {
          console.log('➕ Adding student:', project.studentEmail, 'from project:', project.title);
          if (!contactsMap.has(project.studentEmail) && project.studentEmail) {
            contactsMap.set(project.studentEmail, {
              email: project.studentEmail,
              name: project.studentName || project.studentEmail,
              role: 'student',
              projectId: project.id,
              projectTitle: project.title
            });
          }
        });
      } else {
        console.warn('⚠️ Unknown user role:', this.currentUser.userRole);
      }

      this.contacts = Array.from(contactsMap.values());
      console.log('📋 Final contacts list:', this.contacts);

      // Check for query parameters to auto-select specific contact
      this.route.queryParams.subscribe(params => {
        const recipientEmail = params['recipientEmail'];
        const recipientName = params['recipientName'];
        const projectId = params['projectId'];

        if (recipientEmail) {
          // Find and select the contact from query params
          const targetContact = this.contacts.find(c => c.email === recipientEmail);
          if (targetContact) {
            this.selectedContact = targetContact;
            console.log('✅ Auto-selected contact from query params:', this.selectedContact);
          } else {
            // If contact not in list but provided in params, create a temporary contact
            this.selectedContact = {
              email: recipientEmail,
              name: recipientName || recipientEmail,
              role: this.currentUser.userRole === 'student' ? 'supervisor' : 'student',
              projectId: projectId
            };
            console.log('✅ Created temporary contact from query params:', this.selectedContact);
          }
        } else if (this.contacts.length > 0) {
          // Auto-select first contact only on desktop (width >= 768px)
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            this.selectedContact = this.contacts[0];
            console.log('✅ Auto-selected first contact (desktop):', this.selectedContact);
          } else {
            console.log('📱 Mobile detected - showing contact list first');
          }
        } else {
          console.warn('⚠️ No contacts found!');
        }
      });

    } catch (error) {
      console.error('❌ Failed to load contacts:', error);
      this.contacts = [];
    } finally {
      this.isLoadingContacts = false;
      console.log('🏁 Loading complete. Total contacts:', this.contacts.length);
    }
  }

  selectContact(contact: Contact) {
    this.selectedContact = contact;
    // Clear unread count when selecting
    contact.unreadCount = 0;
  }

  deselectContact() {
    this.selectedContact = null;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}

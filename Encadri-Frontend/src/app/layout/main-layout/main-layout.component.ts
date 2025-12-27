import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent, NotificationToastComponent, IconComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);

  isSidebarOpen = true; // Start open by default

  ngOnInit() {
    // On mobile (width < 1024px), start with sidebar closed
    this.checkScreenSize();
  }

  ngOnDestroy() {
    // Clean up body scroll lock if it exists
    this.removeBodyScrollLock();
  }

  @HostListener('window:resize')
  onResize() {
    // Keep sidebar behavior responsive
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 1024;

      if (isMobile) {
        // On mobile, close sidebar on initial load only
        if (!this.hasUserToggledSidebar) {
          this.isSidebarOpen = false;
        }
      } else {
        // On desktop, always keep sidebar open (fixed)
        this.isSidebarOpen = true;
      }
    }
  }

  private hasUserToggledSidebar = false;

  toggleSidebar() {
    // Only allow toggling on mobile devices
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.hasUserToggledSidebar = true;
      this.isSidebarOpen = !this.isSidebarOpen;

      // Manage body scroll lock on mobile
      if (this.isSidebarOpen) {
        this.addBodyScrollLock();
      } else {
        this.removeBodyScrollLock();
      }
    }
  }

  closeSidebarOnMobile() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.isSidebarOpen = false;
      this.hasUserToggledSidebar = true;
      this.removeBodyScrollLock();
    }
  }

  private addBodyScrollLock() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  private removeBodyScrollLock() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  logout() {
    this.authService.logout();
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, UiCardComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  
  user = signal<User | null>(null);
  isEditing = signal<boolean>(false);
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  // Form Data
  formData = {
    fullName: '',
    email: '',
    avatarUrl: ''
  };

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.user.set(currentUser);
      this.resetForm();
    }
  }

  resetForm() {
    const u = this.user();
    if (u) {
      this.formData = {
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl || '' // Ensure it exists in User model or handle optional
      };
    }
  }

  toggleEdit() {
    this.isEditing.update(v => !v);
    if (!this.isEditing()) {
      this.resetForm();
      this.error.set('');
      this.success.set('');
    }
  }

  onSubmit() {
    const currentUser = this.user();
    if (!currentUser) return;

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const updateData = {
      id: currentUser.id,
      ...this.formData
    };

    this.authService.updateProfile(updateData as any).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.isEditing.set(false);
        this.success.set('Profile updated successfully!');
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to update profile.');
        this.loading.set(false);
      }
    });
  }
}

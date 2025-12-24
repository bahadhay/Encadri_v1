import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UiInputComponent, UiButtonComponent, UiCardComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);
  toastService = inject(ToastService);

  fullName = '';
  email = '';
  password = '';
  role: 'student' | 'supervisor' = 'student';
  loading = false;
  error = '';

  onSubmit() {
    if (!this.fullName || !this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    const userData = {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      userRole: this.role  // Backend expects 'userRole' not 'role'
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Account created successfully! Welcome to Encadri!');
        // Redirect to dashboard after a short delay to show the toast
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Registration failed. Please try again.';
        this.toastService.error(this.error);
        this.loading = false;
      }
    });
  }
}

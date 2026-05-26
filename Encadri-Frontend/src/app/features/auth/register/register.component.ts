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
  confirmPassword = '';
  role: 'student' | 'supervisor' = 'student';
  loading = false;
  error = '';

  // Password validation state
  passwordStrength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  passwordRequirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  };
  passwordsMatch = true;

  // Validate password as user types
  onPasswordChange() {
    // Check each requirement
    this.passwordRequirements.minLength = this.password.length >= 8;
    this.passwordRequirements.hasUppercase = /[A-Z]/.test(this.password);
    this.passwordRequirements.hasLowercase = /[a-z]/.test(this.password);
    this.passwordRequirements.hasNumber = /[0-9]/.test(this.password);
    this.passwordRequirements.hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(this.password);

    // Calculate password strength
    const requirementsMet = Object.values(this.passwordRequirements).filter(val => val).length;

    if (requirementsMet < 3) {
      this.passwordStrength = 'weak';
    } else if (requirementsMet === 3) {
      this.passwordStrength = 'fair';
    } else if (requirementsMet === 4) {
      this.passwordStrength = 'good';
    } else if (requirementsMet === 5 && this.password.length >= 12) {
      this.passwordStrength = 'strong';
    } else {
      this.passwordStrength = 'good';
    }

    // Check if passwords match
    this.checkPasswordsMatch();
  }

  // Check if confirm password matches
  onConfirmPasswordChange() {
    this.checkPasswordsMatch();
  }

  private checkPasswordsMatch() {
    this.passwordsMatch = this.confirmPassword === '' || this.password === this.confirmPassword;
  }

  // Validate all password requirements are met
  private isPasswordValid(): boolean {
    return Object.values(this.passwordRequirements).every(val => val);
  }

  onSubmit() {
    // Basic field validation
    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      this.toastService.error(this.error);
      return;
    }

    // Password requirements validation
    if (!this.isPasswordValid()) {
      this.error = 'Password does not meet all requirements';
      this.toastService.error(this.error);
      return;
    }

    // Password match validation
    if (!this.passwordsMatch || this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      this.toastService.error(this.error);
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

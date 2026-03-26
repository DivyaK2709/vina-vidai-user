import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebaseauth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SigninPage {

  emailOrUsername = '';
  password        = '';
  isEmailValid    = false;
  showPassword    = false;
  isLoading       = false;

  activeField  : 'email' | 'password' | '' = '';
  passwordError = '';
  usernameError = '';

  private USERNAME_REGEX = /^[a-zA-Z._]+$/;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private toastCtrl: ToastController,
    private toast: ToastService
  ) {}

  setActive(field: 'email' | 'password')  { this.activeField = field; }
  clearActive(field: 'email' | 'password') { if (this.activeField === field) this.activeField = ''; }
  togglePassword() { this.showPassword = !this.showPassword; }

  validatePassword() {
    this.passwordError = '';
    if (this.password && this.password.length < 6)
      this.passwordError = 'Password must be at least 6 characters';
  }

  validateEmailOrUsername() {
    this.usernameError = '';
    this.isEmailValid  = false;
    if (!this.emailOrUsername) return;

    if (this.emailOrUsername.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.isEmailValid = emailRegex.test(this.emailOrUsername);
      if (!this.isEmailValid) this.usernameError = 'Invalid email format';
      return;
    }

    if (!this.USERNAME_REGEX.test(this.emailOrUsername))
      this.usernameError = 'Username: letters, dots and underscores only';
  }

  ionViewWillEnter() {
    this.emailOrUsername = '';
    this.password        = '';
    this.passwordError   = '';
    this.usernameError   = '';
    this.isEmailValid    = false;
    this.isLoading       = false;
  }

  async onSignIn() {
    this.passwordError = '';
    this.usernameError = '';

    if (!this.emailOrUsername || !this.password)
      return this.showToast('Please fill all fields', 'warning');

    if (!this.emailOrUsername.includes('@') &&
        !this.USERNAME_REGEX.test(this.emailOrUsername)) {
      this.usernameError = 'Username does not accept numbers or symbols';
      return;
    }

    this.isLoading = true;

    try {
      if (this.emailOrUsername.includes('@')) {
        await this.firebaseService.signInWithEmail(this.emailOrUsername, this.password);
      } else {
        await this.firebaseService.signInWithUsername(this.emailOrUsername, this.password);
      }

      // ✅ Save session timestamp
      localStorage.setItem('lastLoginTime', Date.now().toString());

      this.showToast('Welcome back!', 'success');

      // ✅ Navigate inside try — only runs on success
      this.router.navigate(['/tabs'], { replaceUrl: true });

    } catch (err: any) {
      const code = err?.code || '';

      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        this.passwordError = 'Incorrect password';
      else if (code === 'auth/user-not-found')
        this.usernameError = 'No account found';
      else if (code === 'auth/invalid-email')
        this.usernameError = 'Invalid email format';
      else if (code === 'auth/too-many-requests')
        this.showToast('Too many attempts. Try again later.', 'warning');
      else
        this.showToast('Sign in failed. Try again.', 'danger');

    } finally {
      this.isLoading = false;
    }
  }

  goToSignup()         { this.router.navigate(['/login']); }
  goToForgotPassword() { this.router.navigate(['/forgot-password']); }

  showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success') {
    this.toast.show(message, color);
  }
}
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
  password = '';
  isEmailValid = false;
  showPassword = false;

  activeField: 'email' | 'password' | '' = '';
  passwordError = '';
  usernameError = '';   // ✅ NEW

  // ✅ USERNAME REGEX (NO NUMBERS)
  private USERNAME_REGEX = /^[a-zA-Z._]+$/;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private toastCtrl: ToastController,
    private toast: ToastService
  ) {}
  
  setActive(field: 'email' | 'password') {
    this.activeField = field;
  }

  clearActive(field: 'email' | 'password') {
    if (this.activeField === field) this.activeField = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
validatePassword() {
  this.passwordError = '';

  if (!this.password) return;

  if (this.password.length < 6) {
    this.passwordError = 'Password must be at least 6 characters';
    return;
  }
}

  // ===========================
  // EMAIL / USERNAME VALIDATION
  // ===========================
  validateEmailOrUsername() {
    this.usernameError = '';
    this.isEmailValid = false;

    if (!this.emailOrUsername) return;

    // EMAIL
    if (this.emailOrUsername.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.isEmailValid = emailRegex.test(this.emailOrUsername);
      if (!this.isEmailValid) {
        this.usernameError = 'Invalid email format';
      }
      return;
    }

    // USERNAME
    if (!this.USERNAME_REGEX.test(this.emailOrUsername)) {
      this.usernameError = 'Username does not accept numbers or symbols';
    }
  }
   
  ionViewWillEnter() {
    this.emailOrUsername = '';
    this.password = '';
    this.passwordError = '';
    this.usernameError = '';
    this.isEmailValid = false;
  }

  async presentToast(message: string, color: string = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  // ===========================
  // SIGN IN
  // ===========================
  async onSignIn() {

    this.passwordError = '';
    this.usernameError = '';

    if (!this.emailOrUsername || !this.password) {
      return this.showToast('Please fill all fields', 'warning');
    }

    // ❌ USERNAME VALIDATION BLOCK
    if (
      !this.emailOrUsername.includes('@') &&
      !this.USERNAME_REGEX.test(this.emailOrUsername)
    ) {
      this.usernameError = 'Username does not accept numbers';
      return;
    }

    try {

      if (this.emailOrUsername.includes('@')) {
        await this.firebaseService.signInWithEmail(
          this.emailOrUsername,
          this.password
        );
      } else {
        await this.firebaseService.signInWithUsername(
          this.emailOrUsername,
          this.password
        );
      }

      // ✅ SUCCESS
      this.showToast('Signin successful', 'success');
      this.router.navigate(['/tabs']);

    } catch (err: any) {

      const code = err?.code || '';

      console.log('Firebase Error:', code);

      // ❌ WRONG PASSWORD
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        this.passwordError = 'Password incorrect';
        return;
      }

      // ❌ USER NOT FOUND (EMAIL OR USERNAME)
      if (code === 'auth/user-not-found') {
        this.usernameError = 'User not found';
        return;
      }

      // ❌ INVALID EMAIL
      if (code === 'auth/invalid-email') {
        this.usernameError = 'Invalid email format';
        return;
      }

      // ❌ FALLBACK
      this.showToast('Signin failed', 'danger');
    }
  }

  goToSignup() {
    this.router.navigate(['/login']);
  }
 showToast(
  message: string,
  color: 'success' | 'danger' | 'warning' | 'primary' = 'success'
) {
  this.toast.show(message, color);
}

}

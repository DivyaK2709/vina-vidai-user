import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebaseauth.service';

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
  passwordError = '';   // <-- NEW

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private toastCtrl: ToastController
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

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.isEmailValid = emailRegex.test(this.emailOrUsername);
  }

  ionViewWillEnter() {
    this.emailOrUsername = '';
    this.password = '';
    this.passwordError = '';  // <-- NEW
    setTimeout(() => {
      document.querySelectorAll('input').forEach((input: any) => input.value = '');
    }, 60);
    this.isEmailValid = false;
  }

  async presentToast(message: string, color: string = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top',
      cssClass: 'top-toast'
    });
    await toast.present();
  }

async onSignIn() {
  this.passwordError = ''; // reset error

  if (!this.emailOrUsername || !this.password) {
    return this.presentToast('Please fill all fields', 'warning');
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
    this.presentToast('Signin successful', 'success');
    this.router.navigate(['/tabs']);

  } catch (err: any) {

    const code = err?.code || '';

    console.log('Firebase Error Code:', code);

    // 🔥 WRONG PASSWORD
    if (
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential'
    ) {
      this.passwordError = 'Password incorrect';
      return;
    }

    // 🔥 USER NOT FOUND
    if (
      code === 'auth/user-not-found'
    ) {
      this.presentToast('User not found', 'danger');
      return;
    }

    // 🔥 INVALID EMAIL
    if (
      code === 'auth/invalid-email'
    ) {
      this.presentToast('Invalid email format', 'danger');
      return;
    }

    // ❗ ANY OTHER ERROR
    this.presentToast('Signin failed', 'danger');
  }
}



  goToSignup() {
    this.router.navigate(['/login']);
  }
}

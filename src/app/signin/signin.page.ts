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
  this.passwordError = ''; // reset password error

  if (!this.emailOrUsername || !this.password) {
    return this.presentToast('Please fill all fields', 'warning');
  }

  try {
    if (this.emailOrUsername.includes('@')) {
      await this.firebaseService.signInWithEmail(this.emailOrUsername, this.password);
    } else {
      await this.firebaseService.signInWithUsername(this.emailOrUsername, this.password);
    }

    // SUCCESS LOGIN
    this.presentToast('Signin successful', 'success');
    this.router.navigate(['/tabs']);

  } catch (err: any) {
    let msg = err?.message?.toLowerCase() || '';

    console.log("Firebase Error:", msg); // DEBUG

    // 🔥 PASSWORD WRONG
    if (
      msg.includes('wrong-password') ||
      msg.includes('auth/wrong-password') ||
      msg.includes('invalid password') ||
      msg.includes('password')
    ) {
      this.passwordError = 'Password incorrect';
      return;
    }

    // ❌ USER NOT FOUND
    if (
      msg.includes('user-not-found') ||
      msg.includes('auth/user-not-found') ||
      msg.includes('no user') ||
      msg.includes('invalid email')
    ) {
      return this.presentToast('User not found', 'danger');
    }

    // ❗ ANY OTHER ERROR
    this.presentToast('Signin failed', 'danger');
  }
}


  goToSignup() {
    this.router.navigate(['/login']);
  }
}

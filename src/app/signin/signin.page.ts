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

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.isEmailValid = emailRegex.test(this.emailOrUsername);
  }

  ionViewWillEnter() {
    this.emailOrUsername = '';
    this.password = '';

    // force clear native values
    setTimeout(() => {
      document.querySelectorAll('input').forEach((input: any) => {
        input.value = '';
      });
    }, 60);

    this.isEmailValid = false;
  }

  async presentToast(message: string, color: string = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  async onSignIn() {
    if (!this.emailOrUsername || !this.password) {
      return this.presentToast('Please fill all fields', 'warning');
    }

    try {
      if (this.emailOrUsername.includes('@')) {
        await this.firebaseService.signInWithEmail(this.emailOrUsername, this.password);
      } else {
        await this.firebaseService.signInWithUsername(this.emailOrUsername, this.password);
      }

      this.presentToast('Signin successful', 'success');
      this.router.navigate(['/tabs']);
    } catch (err: any) {
      this.presentToast(err?.message || 'Signin failed', 'danger');
    }
  }

  goToSignup() {
    this.router.navigate(['/login']);
  }
}

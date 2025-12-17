import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebaseauth.service';

type FieldName = 'username' | 'email' | 'password' | 'confirmPassword';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
showConfirmPassword = false;


  isUsernameFocused = false;   // ⭐ NEW

  icons = {
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  };

  emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  updateIcon(field: FieldName) {
    const value = this[field] as string;

    switch (field) {
      case 'username':
        this.icons.username = /^[A-Za-z]{3,}$/.test(value);
        break;

      case 'email':
        this.icons.email = this.emailPattern.test(value);
        break;

      case 'password':
        this.icons.password = value.length >= 6;
        break;

      case 'confirmPassword':
        this.icons.confirmPassword =
          value === this.password && value.length >= 6;
        break;
    }
  }
  togglePassword() {
  this.showPassword = !this.showPassword;
}

toggleConfirmPassword() {
  this.showConfirmPassword = !this.showConfirmPassword;
}


  isUsernameValid() {
    return /^[A-Za-z]{3,}$/.test(this.username);
  }

  isEmailValid() {
    return this.emailPattern.test(this.email);
  }

  isPasswordValid() {
    return this.password.length >= 6;
  }

  isConfirmPasswordValid() {
    return this.password === this.confirmPassword && this.password.length >= 6;
  }

  isFormValid() {
    return (
      this.isUsernameValid() &&
      this.isEmailValid() &&
      this.isPasswordValid() &&
      this.isConfirmPasswordValid()
    );
  }

  async showToast(msg: string, color: string = 'danger') {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color,
      position: 'top',
      cssClass: 'top-toast'
    });
    t.present();
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      this.showToast('Please fix all errors before submitting', 'warning');
      return;
    }

    try {
      await this.firebaseService.signUp(this.email, this.password, this.username);
      this.showToast('Signup successful!', 'success');
      this.router.navigate(['/signin']);
    } catch (error: any) {
      this.showToast(error.message || 'Signup failed');
    }
  }

  goToSignin() {
    this.router.navigate(['/signin']);
  }
}

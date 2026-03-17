import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, authState, signOut } from '@angular/fire/auth';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SettingsPage implements OnInit {

  userName             = '';
  userEmail            = '';
  notificationsEnabled = true;
  darkMode             = false;
  showLogoutAlert      = false;

  private auth  = inject(Auth);
  private toast = inject(ToastController);

  alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => { this.showLogoutAlert = false; }
    },
    {
      text: 'Log Out',
      role: 'confirm',
      handler: () => { this.showLogoutAlert = false; this.goTologout(); }
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    authState(this.auth).subscribe(user => {
      if (user) {
        this.userName  = user.displayName || user.email?.split('@')[0] || 'User';
        this.userEmail = user.email || '';
      }
    });
    this.darkMode = localStorage.getItem('darkMode') === 'true';
  }

  confirmLogout() {
    this.showLogoutAlert = true;
  }

  async goTologout() {
    try {
      await signOut(this.auth);
      localStorage.clear();
      this.router.navigate(['/signin'], { replaceUrl: true });
    } catch {
      const t = await this.toast.create({
        message: 'Logout failed. Try again.',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      t.present();
    }
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark', this.darkMode);
    localStorage.setItem('darkMode', String(this.darkMode));
  }

  async comingSoon() {
    const t = await this.toast.create({
      message: '🚧 Coming soon!',
      duration: 1500,
      color: 'medium',
      position: 'top'
    });
    t.present();
  }
}
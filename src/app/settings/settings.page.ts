import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [CommonModule, IonicModule] // ✅ Add IonicModule here
})
export class SettingsPage {
  constructor(private router: Router) {}

  goTologout() {
    // ✅ Clear all local storage
    localStorage.clear();

    // Optional: Also clear session storage or any other storage if used
    // sessionStorage.clear();

    // ✅ Navigate to login page
    this.router.navigate(['/signin'], { replaceUrl: true });

  }
}


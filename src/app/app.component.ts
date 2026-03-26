import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, setPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AppComponent implements OnInit {

  private auth   = inject(Auth);
  private router = inject(Router);

  ngOnInit() {
    // Set persistence so login survives app restart
    setPersistence(this.auth, browserLocalPersistence).then(() => {
      onAuthStateChanged(this.auth, (user) => {
        const lastLogin   = localStorage.getItem('lastLoginTime');
        const now         = Date.now();
        const hours24     = 24 * 60 * 60 * 1000;
        const sessionValid = lastLogin && (now - Number(lastLogin)) < hours24;

        if (user && sessionValid) {
          // Valid session → go to app
          this.router.navigate(['/tabs'], { replaceUrl: true });
        } else if (user && !sessionValid) {
          // Session expired → sign out
          this.auth.signOut();
          localStorage.clear();
          this.router.navigate(['/signin'], { replaceUrl: true });
        } else {
          // No user → signin
          this.router.navigate(['/signin'], { replaceUrl: true });
        }
      });
    });
  }
}
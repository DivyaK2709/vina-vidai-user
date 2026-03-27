import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, authState, signOut, updateProfile } from '@angular/fire/auth';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

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
  showEditModal        = false;
  editName             = '';
  isSaving             = false;
showRankPanel = false;
rankLoading   = false;
myRank        = 0;
myScore       = 0;
myTests       = 0;
myUid         = '';
allUsers      : any[] = [];

  // ✅ inject() MUST be at field level — not inside methods
  private auth      = inject(Auth);
  private toast     = inject(ToastController);
  private firestore = inject(Firestore);

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
    authState(this.auth).subscribe(async user => {
      if (user) {
        this.userName  = user.displayName || user.email?.split('@')[0] || 'User';
        this.userEmail = user.email || '';
        await this.loadMyRank(user.uid);
      }
    });
    this.darkMode = localStorage.getItem('darkMode') === 'true';
  }



// Replace toggleRank + loadMyRank:
async toggleRank() {
  this.showRankPanel = !this.showRankPanel;
  if (this.showRankPanel && this.allUsers.length === 0) {
    await this.loadLeaderboard();
  }
}

async loadLeaderboard() {
  this.rankLoading = true;
  try {
    const usersSnap  = await getDocs(collection(this.firestore, 'users'));
    const rankings: any[] = [];

    for (const userDoc of usersSnap.docs) {
      const data         = userDoc.data() as any;
      const progressSnap = await getDocs(
        collection(this.firestore, `users/${userDoc.id}/testProgress`)
      );
      let total = 0, tests = 0;
      progressSnap.forEach(d => {
        total += (d.data() as any).score || 0;
        tests++;
      });
      rankings.push({
        uid       : userDoc.id,
        name      : data.displayName || data.username || data.email?.split('@')[0] || 'User',
        totalScore: total,
        testsCount: tests
      });
    }

    this.allUsers = rankings.sort((a, b) => b.totalScore - a.totalScore);

    const idx    = this.allUsers.findIndex(u => u.uid === this.myUid);
    this.myRank  = idx !== -1 ? idx + 1 : 0;
    this.myScore = idx !== -1 ? this.allUsers[idx].totalScore : 0;
    this.myTests = idx !== -1 ? this.allUsers[idx].testsCount : 0;

  } catch (err) {
    console.error('Leaderboard error:', err);
  } finally {
    this.rankLoading = false;
  }
}

// Update loadMyRank to also set myUid:
async loadMyRank(uid: string) {
  this.myUid = uid;
  await this.loadLeaderboard();
}

  openEditProfile() {
    this.editName      = this.userName;
    this.showEditModal = true;
  }

  async saveProfile() {
    if (!this.editName.trim()) return;
    this.isSaving = true;
    try {
      const user = this.auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: this.editName.trim() });
        this.userName      = this.editName.trim();
        this.showEditModal = false;
        const t = await this.toast.create({
          message: 'Profile updated!', duration: 2000,
          color: 'success', position: 'top'
        });
        t.present();
      }
    } catch {
      const t = await this.toast.create({
        message: 'Update failed.', duration: 2000,
        color: 'danger', position: 'top'
      });
      t.present();
    } finally {
      this.isSaving = false;
    }
  }

  confirmLogout() { this.showLogoutAlert = true; }

  async goTologout() {
    try {
      await signOut(this.auth);
      localStorage.clear();
      this.router.navigate(['/signin'], { replaceUrl: true });
    } catch {
      const t = await this.toast.create({
        message: 'Logout failed.', duration: 2000,
        color: 'danger', position: 'top'
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
      duration: 1500, color: 'medium', position: 'top'
    });
    t.present();
  }

  goToRank() {
    this.router.navigate(['/tabs/rank']);
  }
}
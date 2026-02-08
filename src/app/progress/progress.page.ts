import {
  Component,
  OnInit,
  inject,
  Injector,
  runInInjectionContext
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import {
  Firestore,
  collection,
  getDocs
} from '@angular/fire/firestore';

import {
  Auth,
  authState
} from '@angular/fire/auth';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    NgChartsModule
  ],
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss']
})
export class ProgressPage implements OnInit {

  // --------------------------------------------------
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(Injector);

  segment: 'daily' | 'weekly' | 'subjects' = 'daily';

  uid: string | null = null;

  totalPoints = 0;
  lastUpdated = '';

  subjectColors = [
    '#00c9a7',
    '#ff6384',
    '#36a2eb',
    '#ffcd56',
    '#9966ff',
    '#ff9f40',
    '#8c564b'
  ];

  dailyChartData: any = { labels: [], datasets: [] };
  weeklyChartData: any = { labels: [], datasets: [] };
  subjectChartData: any = { labels: [], datasets: [] };

  weeklyLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
   // ================= CHART OPTIONS =================

dailyOptions: any = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' }
  }
};

weeklyOptions: any = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true }
  }
};

subjectOptions: any = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' }
  }
};

  // --------------------------------------------------
  ngOnInit() {

    // 🔐 Everything Firebase inside injection context
    runInInjectionContext(this.injector, () => {

      authState(this.auth).subscribe(user => {

        if (!user) {
          console.warn('❌ User not logged in');
          return;
        }

        this.uid = user.uid;

        // 🔐 Call loader inside same context
        this.loadProgressSafe();

      });

    });
  }

  // --------------------------------------------------
  private loadProgressSafe() {

    runInInjectionContext(this.injector, async () => {
      await this.loadProgress();
    });

  }

  // --------------------------------------------------
 private async loadProgress() {

  if (!this.uid) return;

  try {

    console.log('📡 UID =', this.uid);

    // ✅ CORRECT PATH
    const attemptsRef = collection(
      this.firestore,
      `users/${this.uid}/testProgress`
    );

    const snap = await getDocs(attemptsRef);

    const allAttempts: any[] = [];

    snap.forEach(d => {
      allAttempts.push(d.data());
    });

    console.log('📦 ATTEMPTS FOUND:', allAttempts);

    if (!allAttempts.length) {
      console.warn('❌ No progress data found');
      return;
    }

    // ================= TOTAL =================
    this.totalPoints = allAttempts.reduce(
      (s, a) => s + (a.score || 0),
      0
    );

    // ================= LAST UPDATED =================
    const latest = allAttempts
      .filter(a => a.timestamp)
      .sort(
        (a, b) =>
          b.timestamp.toDate().getTime() -
          a.timestamp.toDate().getTime()
      )[0];

    this.lastUpdated =
      latest?.timestamp
        ?.toDate()
        .toLocaleDateString() || '';

    // ================= DAILY =================
    const todayStr = new Date().toDateString();

    const dailyMap: any = {};

    allAttempts.forEach(a => {

      if (!a.timestamp || !a.subject) return;

      const d = a.timestamp.toDate().toDateString();

      if (d === todayStr) {
        dailyMap[a.subject] =
          (dailyMap[a.subject] || 0) + a.score;
      }
    });

    this.dailyChartData = {
      labels: Object.keys(dailyMap),
      datasets: [{
        data: Object.values(dailyMap),
        backgroundColor: this.subjectColors
      }]
    };

    // ================= WEEKLY =================
    const weeklyMap: any = {
      Mon:0, Tue:0, Wed:0,
      Thu:0, Fri:0, Sat:0, Sun:0
    };

    allAttempts.forEach(a => {

      if (!a.timestamp) return;

      const day =
        a.timestamp
          .toDate()
          .toLocaleDateString('en-US', {
            weekday: 'short'
          });

      weeklyMap[day] =
        (weeklyMap[day] || 0) + a.score;
    });

    this.weeklyChartData = {
      labels: [...this.weeklyLabels],
      datasets: [{
        data: this.weeklyLabels.map(
          d => weeklyMap[d]
        ),
        label: 'Weekly Score',
        backgroundColor: '#00c9a7'
      }]
    };

    // ================= SUBJECT =================
    const subjectMap: any = {};

    allAttempts.forEach(a => {

      if (!a.subject) return;

      subjectMap[a.subject] =
        (subjectMap[a.subject] || 0) + a.score;
    });

    const sLabels = Object.keys(subjectMap);

    this.subjectChartData = {
      labels: sLabels,
      datasets: [{
        data: sLabels.map(l => subjectMap[l]),
        backgroundColor: sLabels.map(
          (_, i) =>
            this.subjectColors[
              i % this.subjectColors.length
            ]
        )
      }]
    };

  } catch (err) {
    console.error('🔥 Firestore load failed:', err);
  }
}


  // --------------------------------------------------
  setSegment(v: 'daily' | 'weekly' | 'subjects') {
    this.segment = v;
  }

}

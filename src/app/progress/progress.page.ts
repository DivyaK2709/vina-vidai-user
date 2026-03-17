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

import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, NgChartsModule],
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss']
})
export class ProgressPage implements OnInit {

  private firestore = inject(Firestore);
  private auth      = inject(Auth);
  private injector  = inject(Injector);

  segment: 'daily' | 'weekly' | 'subjects' = 'daily';

  uid          : string | null = null;
  totalPoints  = 0;
  totalTests   = 0;
  lastUpdated  = '';

  subjectColors = [
    '#00c9a7', '#ff6384', '#36a2eb',
    '#ffcd56', '#9966ff', '#ff9f40', '#8c564b'
  ];

  dailyChartData  : any = { labels: [], datasets: [] };
  weeklyChartData : any = { labels: [], datasets: [] };
  subjectChartData: any = { labels: [], datasets: [] };

  weeklyLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  dailyOptions: any = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } }
    }
  };

  weeklyOptions: any = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } }
    },
    elements: {
      line:  { tension: 0.4, borderColor: '#16a34a', borderWidth: 2 },
      point: { radius: 4, backgroundColor: '#16a34a' }
    }
  };

  subjectOptions: any = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
    }
  };

  // --------------------------------------------------
  ngOnInit() {
    runInInjectionContext(this.injector, () => {
      authState(this.auth).subscribe(user => {
        if (!user) { console.warn('❌ User not logged in'); return; }
        this.uid = user.uid;
        this.loadProgressSafe();
      });
    });
  }

  private loadProgressSafe() {
    runInInjectionContext(this.injector, async () => {
      await this.loadProgress();
    });
  }

  private async loadProgress() {
    if (!this.uid) return;

    try {
      const attemptsRef = collection(this.firestore, `users/${this.uid}/testProgress`);
      const snap        = await getDocs(attemptsRef);
      const allAttempts: any[] = [];
      snap.forEach(d => allAttempts.push(d.data()));

      if (!allAttempts.length) { console.warn('❌ No progress data'); return; }

      // TOTALS
      this.totalPoints = allAttempts.reduce((s, a) => s + (a.score || 0), 0);
      this.totalTests  = allAttempts.length;

      // LAST UPDATED
      const latest = allAttempts
        .filter(a => a.timestamp)
        .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())[0];
      this.lastUpdated = latest?.timestamp?.toDate().toLocaleDateString() || '';

      // DAILY
      const todayStr  = new Date().toDateString();
      const dailyMap: any = {};
      allAttempts.forEach(a => {
        if (!a.timestamp || !a.subject) return;
        if (a.timestamp.toDate().toDateString() === todayStr) {
          dailyMap[a.subject] = (dailyMap[a.subject] || 0) + a.score;
        }
      });
      this.dailyChartData = {
        labels: Object.keys(dailyMap),
        datasets: [{ data: Object.values(dailyMap), backgroundColor: this.subjectColors }]
      };

      // WEEKLY
      const weeklyMap: any = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };
      allAttempts.forEach(a => {
        if (!a.timestamp) return;
        const day = a.timestamp.toDate().toLocaleDateString('en-US', { weekday: 'short' });
        weeklyMap[day] = (weeklyMap[day] || 0) + a.score;
      });
      this.weeklyChartData = {
        labels: [...this.weeklyLabels],
        datasets: [{
          data: this.weeklyLabels.map(d => weeklyMap[d]),
          label: 'Weekly Score',
          backgroundColor: 'rgba(22,163,74,0.15)',
          borderColor: '#16a34a',
          borderWidth: 2,
          fill: true
        }]
      };

      // SUBJECTS
      const subjectMap: any = {};
      allAttempts.forEach(a => {
        if (!a.subject) return;
        subjectMap[a.subject] = (subjectMap[a.subject] || 0) + a.score;
      });
      const sLabels = Object.keys(subjectMap);
      this.subjectChartData = {
        labels: sLabels,
        datasets: [{
          data: sLabels.map(l => subjectMap[l]),
          backgroundColor: sLabels.map((_, i) => this.subjectColors[i % this.subjectColors.length])
        }]
      };

    } catch (err) {
      console.error('🔥 Firestore load failed:', err);
    }
  }

  setSegment(v: 'daily' | 'weekly' | 'subjects') {
    this.segment = v;
  }
}
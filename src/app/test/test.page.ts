import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  getDocs,
  query as firestoreQuery,
  where
} from '@angular/fire/firestore';

interface HistoryItem {
  id?: string;
  title?: string;
  subject?: string;
  questionsCount?: number;
  timeSeconds?: number;
  score?: number;
  attemptNumber?: number;
}

interface SeriesItem {
  id?: string;
  title?: string;
  description?: string;
  subject?: string;
  questionsCount?: number;
  timeSeconds?: number;
  icon?: string;
}

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './test.page.html',
  styleUrls: ['./test.page.scss'],
})
export class TestPage implements OnInit {

  selectedSegment: 'history' | 'series' = 'history';

  testHistory: HistoryItem[] = [];
  testSeries: SeriesItem[] = [];

  selectedSubject: string | null = null;
  selectedQuestions: number | null = null;
  selectedTime: number | null = null;

  loadingHistory = false;
  loadingSeries = false;
  loadingStart = false;

  constructor(
    private firestore: Firestore,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHistory();
    this.loadSeries();
  }

  onSegmentChange(ev: any) {
    this.selectedSegment = ev.detail.value;
  }

  async loadHistory() {
    this.loadingHistory = true;
    try {
      const ref = collection(this.firestore, 'testHistory');
      const snap = await getDocs(ref);
      const arr: HistoryItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        arr.push({
          id: d.id,
          title: data.title,
          subject: data.subject,
          questionsCount: data.questionsCount ?? data.questions,
          timeSeconds: data.timeSeconds ?? data.time,
          score: data.score,
          attemptNumber: data.attemptNumber
        });
      });
      this.testHistory = arr.sort((a,b) => (b.attemptNumber||0) - (a.attemptNumber||0));
    } catch (err) {
      console.error('loadHistory error', err);
      this.showToast('Failed to load history', 'danger');
    } finally {
      this.loadingHistory = false;
    }
  }

  async loadSeries() {
    this.loadingSeries = true;
    try {
      const ref = collection(this.firestore, 'testSeries');
      const snap = await getDocs(ref);
      const arr: SeriesItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        arr.push({
          id: d.id,
          title: data.title || 'Series',
          description: data.description || '',
          subject: data.subject || 'General',
          questionsCount: data.questionsCount || data.questions || 10,
          timeSeconds: data.timeSeconds || data.time || 600,
          icon: data.icon || 'assets/icon/test.png',
        });
      });
      this.testSeries = arr;
    } catch (err) {
      console.error('loadSeries error', err);
      this.showToast('Failed to load series', 'danger');
    } finally {
      this.loadingSeries = false;
    }
  }

private async fetchQuestionsBySubject(subject: string, limit: number): Promise<any[]> {
  try {
    const ref = collection(this.firestore, 'questions');

    // FIRST attempt using exact Firestore field "Subject name"
    const q1 = firestoreQuery(ref, where('subject name', '==', subject));
    let qSnap = await getDocs(q1);

    // SECOND fallback (case insensitive)
    if (qSnap.empty) {
      const q2 = firestoreQuery(ref, where('subject name', '==', subject.toLowerCase()));
      qSnap = await getDocs(q2);
    }

    const items: any[] = [];
    qSnap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    return items.slice(0, limit);

  } catch (err) {
    console.error('fetchQuestionsBySubject error', err);
    throw err;
  }
}


  async confirmStart(s: SeriesItem) {
    const alert = await this.alertCtrl.create({
      header: 'Start Test',
      message: `Start "${s.title}" — ${s.questionsCount} questions?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Start',
          handler: async () => {
            await this.startWithSubject(s.subject || 'General', s.questionsCount || 10, s.timeSeconds || 600);
          },
        },
      ],
    });
    await alert.present();
  }

  async reAttempt(h: HistoryItem) {
    const alert = await this.alertCtrl.create({
      header: 'Re-attempt Test',
      message: `Re-attempt ${h.title || 'this test'}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Start',
          handler: async () => {
            await this.startWithSubject(h.subject || 'General', h.questionsCount || 10, h.timeSeconds || 600);
          }
        }
      ],
    });
    await alert.present();
  }

  viewDetails(h: HistoryItem) {
    this.alertCtrl.create({
      header: h.title || 'Attempt details',
      message: `Subject: ${h.subject || '-'}<br>Questions: ${h.questionsCount}<br>Time: ${this.formatSeconds(h.timeSeconds)}<br>Score: ${h.score ?? '-'}`,
      buttons: ['OK'],
    }).then(a => a.present());
  }

  async startCustomTest() {
    if (!this.selectedSubject || !this.selectedQuestions || !this.selectedTime) {
      this.showToast('Please fill subject, questions and time', 'warning');
      return;
    }
    await this.startWithSubject(this.selectedSubject, this.selectedQuestions, this.selectedTime);
  }

  private async startWithSubject(subject: string, questionsCount: number, timeSeconds: number) {
    this.loadingStart = true;
    try {
      const fetched = await this.fetchQuestionsBySubject(subject, questionsCount);

      if (!fetched || fetched.length === 0) {
        this.showToast(`No questions found for "${subject}"`, 'warning');
        return;
      }

      if (fetched.length < questionsCount) {
        this.showToast(`Only ${fetched.length} questions found for "${subject}". Starting with available questions.`, 'warning');
      }

      localStorage.setItem('current_test_questions', JSON.stringify(fetched));
      localStorage.setItem('current_test_meta', JSON.stringify({
        subject, questionsCount: fetched.length, timeSeconds
      }));
      this.showToast('test gets started');
      this.router.navigate(['/tabs/test-questions'], {
        queryParams: { subject, questions: fetched.length, time: timeSeconds }
      });

    } catch (err) {
      console.error('startWithSubject error', err);
      this.showToast('Failed to start test. Try again.', 'danger');
    } finally {
      this.loadingStart = false;
    }
  }
validateQuestionCount(ev: any) {
  const value = Number(ev.target.value);
  if (value < 10) {
    this.selectedQuestions = 10;
    ev.target.value = 10;
    this.showToast("Minimum 10 questions required", "warning");
  }
}
goPrevious() {
  this.showToast("Previous clicked", "primary");
}

goNext() {
  this.showToast("Next clicked", "primary");
}

  formatSeconds(sec?: number) {
    sec = sec ?? 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  private async showToast(msg: string, color: 'danger'|'success'|'warning'|'primary' = 'primary') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2200, color });
    await t.present();
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import {
  Firestore,
  collection,
  getDocs,
  query as firestoreQuery,
  where
} from '@angular/fire/firestore';

interface HistoryItem {
  id?            : string;
  title?         : string;
  subject?       : string;
  questionsCount?: number;
  timeSeconds?   : number;
  score?         : number;
  attemptNumber? : number;
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

  testHistory    : HistoryItem[] = [];
  loadingHistory  = false;
  loadingStart    = false;

  selectedSubject  : string | null = null;
  selectedQuestions: number | null = null;
  selectedTime     : number | null = null;
  isAutoConfig      = false;
  autoTimeLabel     = '';

  quickCounts = [10, 15, 20, 25, 30];

  timeOptions = [
    { value: 600,  label: '10 min', icon: 'time-outline'      },
    { value: 1200, label: '20 min', icon: 'hourglass-outline' },
    { value: 1800, label: '30 min', icon: 'alarm-outline'     },
    { value: 3600, label: '1 hour', icon: 'timer-outline'     },
  ];

  // ── Auto config map — keys must EXACTLY match Firestore subject field ──
  private examConfig: Record<string, { questions: number; time: number; label: string }> = {
    // TNPSC — 3 hrs, 300 Qs
    'TNPSC Group 1'  : { questions: 300, time: 10800, label: '3 Hours' },
    'TNPSC Group 2'  : { questions: 300, time: 10800, label: '3 Hours' },
    'TNPSC Group 2A' : { questions: 300, time: 10800, label: '3 Hours' },
    'TNPSC Group 3'  : { questions: 300, time: 10800, label: '3 Hours' },
    'TNPSC Group 4'  : { questions: 300, time: 10800, label: '3 Hours' },
    'TNPSC Group 5'  : { questions: 300, time: 10800, label: '3 Hours' },
    'TNPSC Group 6'  : { questions: 300, time: 10800, label: '3 Hours' },
    'TNPSC Group 7'  : { questions: 300, time: 10800, label: '3 Hours' },
    // RRB — 2 hrs, 150 Qs
    'RRB NTPC Graduate'      : { questions: 150, time: 7200, label: '2 Hours' },
    'RRB NTPC Undergraduate' : { questions: 150, time: 7200, label: '2 Hours' },
    'RRB Group D'            : { questions: 150, time: 7200, label: '2 Hours' },
    'RRB JE'                 : { questions: 150, time: 7200, label: '2 Hours' },
    'RRB ALP'                : { questions: 150, time: 7200, label: '2 Hours' },
    // UPSC — 3 hrs, 300 Qs
    'UPSC CDS'  : { questions: 300, time: 10800, label: '3 Hours' },
    'UPSC EPFO' : { questions: 300, time: 10800, label: '3 Hours' },
    'UPSC IAS'  : { questions: 300, time: 10800, label: '3 Hours' },
    'UPSC IPS'  : { questions: 300, time: 10800, label: '3 Hours' },
    'UPSC NDA'  : { questions: 300, time: 10800, label: '3 Hours' },
    'UPSC CAPF' : { questions: 300, time: 10800, label: '3 Hours' },
    // SSC — 3 hrs, 300 Qs
    'SSC CGL'  : { questions: 300, time: 10800, label: '3 Hours' },
    'SSC CHSL' : { questions: 300, time: 10800, label: '3 Hours' },
    'SSC MTS'  : { questions: 300, time: 10800, label: '3 Hours' },
    'SSC CPO'  : { questions: 300, time: 10800, label: '3 Hours' },
    'SSC GD'   : { questions: 300, time: 10800, label: '3 Hours' },
  };

  constructor(
    private firestore : Firestore,
    private alertCtrl : AlertController,
    private toastCtrl : ToastController,
    private router    : Router,
    private toast     : ToastService
  ) {}

  ngOnInit() { this.loadHistory(); }

  onSegmentChange(ev: any) {
    this.selectedSegment = ev.detail.value;
  }

  // ── Returns clean display name (removes prefix) ──────────────────
  getDisplayName(subject: string): string {
    return subject
      .replace('TNPSC ', '')
      .replace('RRB ', '')
      .replace('UPSC ', '')
      .replace('SSC ', '');
  }

  // ── Subject change — auto config or manual ───────────────────────
  onSubjectChange() {
    const config = this.examConfig[this.selectedSubject || ''];
    if (config) {
      this.isAutoConfig      = true;
      this.selectedQuestions = config.questions;
      this.selectedTime      = config.time;
      this.autoTimeLabel     = config.label;
    } else {
      this.isAutoConfig      = false;
      this.selectedQuestions = null;
      this.selectedTime      = null;
      this.autoTimeLabel     = '';
    }
  }

  // ── Load test history ────────────────────────────────────────────
  async loadHistory() {
    this.loadingHistory = true;
    try {
      const ref  = collection(this.firestore, 'testHistory');
      const snap = await getDocs(ref);
      const arr  : HistoryItem[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        arr.push({
          id            : d.id,
          title         : data.title,
          subject       : data.subject,
          questionsCount: data.questionsCount ?? data.questions,
          timeSeconds   : data.timeSeconds    ?? data.time,
          score         : data.score,
          attemptNumber : data.attemptNumber
        });
      });
      this.testHistory = arr.sort(
        (a, b) => (b.attemptNumber || 0) - (a.attemptNumber || 0)
      );
    } catch (err) {
      console.error('loadHistory error', err);
      this.showToast('Failed to load history', 'danger');
    } finally {
      this.loadingHistory = false;
    }
  }

  // ── Fetch questions from Firestore ───────────────────────────────
  private async fetchQuestionsBySubject(
    subject: string,
    limit  : number
  ): Promise<any[]> {
    try {
      const ref         = collection(this.firestore, 'questions');
      const fieldsToTry = ['subject', 'Subject', 'subjectName', 'subject name'];
      let items         : any[] = [];

      // 1) Try exact field match
      for (const field of fieldsToTry) {
        const q    = firestoreQuery(ref, where(field, '==', subject));
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        }
      }

      // 2) Fallback — load all and filter manually
      if (items.length === 0) {
        const snap = await getDocs(ref);
        snap.forEach(doc => {
          const d   = doc.data() as any;
          const sub = (
            d.subject || d.Subject ||
            d.subjectName || d['subject name'] || ''
          ).toLowerCase();
          if (sub === subject.toLowerCase())
            items.push({ id: doc.id, ...doc.data() });
        });
      }

      // 3) Log for debugging
      console.log(`📦 Found ${items.length} questions for "${subject}"`);

      if (items.length === 0) return [];

      // 4) Shuffle
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      return items.slice(0, limit);

    } catch (err) {
      console.error('fetchQuestionsBySubject ERROR:', err);
      throw err;
    }
  }

  // ── Start custom test ────────────────────────────────────────────
  async startCustomTest() {
    if (!this.selectedSubject) {
      this.toast.show('Please select a subject', 'warning');
      return;
    }
    if (!this.isAutoConfig && (!this.selectedQuestions || !this.selectedTime)) {
      this.toast.show('Please fill questions and time', 'warning');
      return;
    }
    await this.startWithSubject(
      this.selectedSubject,
      this.selectedQuestions!,
      this.selectedTime!
    );
  }

  // ── Re-attempt ───────────────────────────────────────────────────
  async reAttempt(h: HistoryItem) {
    const alert = await this.alertCtrl.create({
      header : 'Re-attempt Test',
      message: `Re-attempt ${h.title || 'this test'}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text   : 'Start',
          handler: async () => {
            await this.startWithSubject(
              h.subject        || 'General',
              h.questionsCount || 10,
              h.timeSeconds    || 600
            );
          }
        }
      ]
    });
    await alert.present();
  }

  // ── View details ─────────────────────────────────────────────────
  viewDetails(h: HistoryItem) {
    this.alertCtrl.create({
      header : h.title || 'Attempt Details',
      message: `Subject: ${h.subject || '-'}<br>
                Questions: ${h.questionsCount}<br>
                Time: ${this.formatSeconds(h.timeSeconds)}<br>
                Score: ${h.score ?? '-'}`,
      buttons: ['OK']
    }).then(a => a.present());
  }

  // ── Core start logic ─────────────────────────────────────────────
  private async startWithSubject(
    subject       : string,
    questionsCount: number,
    timeSeconds   : number
  ) {
    this.loadingStart = true;
    try {
      const fetched = await this.fetchQuestionsBySubject(subject, questionsCount);

      if (!fetched || fetched.length === 0) {
        this.toast.show(`No questions found for "${subject}"`, 'warning');
        return;
      }

      if (fetched.length < questionsCount) {
        this.toast.show(
          `Only ${fetched.length} questions found. Starting with available.`,
          'warning'
        );
      }

      localStorage.setItem('current_test_questions', JSON.stringify(fetched));
      localStorage.setItem('current_test_meta', JSON.stringify({
        subject,
        questionsCount: fetched.length,
        timeSeconds
      }));

      await this.showPopup('Your test has started successfully!');

      this.router.navigate(['/tabs/test-questions'], {
        queryParams: { subject, questions: fetched.length, time: timeSeconds }
      });

    } catch (err) {
      console.error('startWithSubject error', err);
      this.toast.show('Failed to start test. Try again.', 'danger');
    } finally {
      this.loadingStart = false;
    }
  }

  // ── Validate question count ──────────────────────────────────────
  validateQuestionCount(ev: any) {
    const value = Number(ev.target.value);
    if (value < 10) {
      this.selectedQuestions = 10;
      ev.target.value        = 10;
      this.toast.show('Minimum 10 questions required', 'warning');
    }
  }

  // ── Start popup ──────────────────────────────────────────────────
  private async showPopup(message: string) {
    const alert = await this.alertCtrl.create({
      header        : 'Test Started',
      message       : `✔️ ${message}`,
      cssClass      : 'custom-test-popup',
      backdropDismiss: false,
      buttons       : [{ text: 'OK', role: 'cancel' }]
    });
    await alert.present();
    this.injectPopupStyles();
  }

  injectPopupStyles() {
    if (document.getElementById('custom-test-popup-style')) return;
    const style     = document.createElement('style');
    style.id        = 'custom-test-popup-style';
    style.innerHTML = `
      ion-alert.custom-test-popup {
        --background: #fff; --width: 320px; --border-radius: 20px;
      }
      ion-alert.custom-test-popup .alert-wrapper {
        border-radius: 20px;
        box-shadow: 0 8px 20px rgba(34,197,94,0.25);
      }
      ion-alert.custom-test-popup .alert-title {
        text-align: center; font-weight: 700; font-size: 18px;
      }
      ion-alert.custom-test-popup .alert-button-group {
        display: flex; justify-content: center; padding-top: 14px;
      }
      ion-alert.custom-test-popup .alert-button {
        border-radius: 10px; font-weight: 600;
        background: #16a34a !important; color: #fff !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Navigation ───────────────────────────────────────────────────
  goToProgress() { this.router.navigate(['/tabs/progress']); }

  // ── Format seconds ───────────────────────────────────────────────
  formatSeconds(sec?: number) {
    sec      = sec ?? 0;
    const h  = Math.floor(sec / 3600);
    const m  = Math.floor((sec % 3600) / 60);
    const s  = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  }

  private async showToast(
    msg  : string,
    color: 'danger' | 'success' | 'warning' | 'primary' = 'primary'
  ) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2200, color });
    await t.present();
  }
}
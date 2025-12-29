import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-test-questions',
  standalone: true,
  imports: [FormsModule, IonicModule, CommonModule],
  templateUrl: './test-questions.page.html',
  styleUrls: ['./test-questions.page.scss'],
})
export class TestQuestionsPage implements OnInit, OnDestroy {

  questions: any[] = [];
  meta: any = {};

  currentIndex = 0;
  currentQuestion: any = null;   // ✅ CRITICAL FIX

  userAnswer: string | null = null;

  score = 0;
  timeLeft = 0;
  formattedTime = '00:00:00';
  timer: any;

  constructor(
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private router: Router,
    private toast: ToastService
  ) {}

  // ======================
  // INIT
  // ======================
  ngOnInit() {
    this.questions = JSON.parse(localStorage.getItem('current_test_questions') || '[]');
    this.meta = JSON.parse(localStorage.getItem('current_test_meta') || '{}');

    if (!this.questions.length) {
      this.toast.show('No questions available!', 'warning');
      return;
    }

    this.timeLeft =
      this.meta.timeSeconds ||
      Number(this.route.snapshot.queryParamMap.get('time')) ||
      600;

    this.loadQuestion(0);
    this.updateFormattedTime();
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ======================
  // TIMER
  // ======================
  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateFormattedTime();
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.showSummaryAlert();
      }
    }, 1000);
  }

  updateFormattedTime() {
    const h = Math.floor(this.timeLeft / 3600);
    const m = Math.floor((this.timeLeft % 3600) / 60);
    const s = this.timeLeft % 60;
    this.formattedTime =
      `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  // ======================
  // QUESTION LOADING (🔥 FIX)
  // ======================
  loadQuestion(index: number) {
    this.saveUserAnswer();

    this.currentIndex = index;

    // 🔥 Detach old view completely
    this.currentQuestion = null;
    this.userAnswer = null;

    setTimeout(() => {
      this.currentQuestion = this.questions[this.currentIndex];
      this.userAnswer = this.currentQuestion?.selected || null;

      if (!this.currentQuestion?.options?.length) {
        this.currentQuestion.options = ['No options available'];
      }
    });
  }

  saveUserAnswer() {
    if (this.currentQuestion) {
      this.currentQuestion.selected = this.userAnswer;
    }
  }

  // ======================
  // NAVIGATION
  // ======================
  previous() {
    if (this.currentIndex > 0) {
      this.loadQuestion(this.currentIndex - 1);
    }
  }

  next() {
    if (this.currentIndex < this.questions.length - 1) {
      this.loadQuestion(this.currentIndex + 1);
    }
  }

  onSelectOption() {
    this.saveUserAnswer();
  }

  trackByOption(_: number, opt: string) {
    return opt;
  }

  // ======================
  // SUBMIT
  // ======================
 async confirmSubmit() {
    const alert = await this.alertCtrl.create({
      header: 'Submit Test?',
      message: 'Are you sure you want to submit your answers?',
      cssClass: 'custom-submit-alert',
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'cancel-btn' },
        { text: 'Submit', handler: () => this.showSummaryAlert(), cssClass: 'submit-btn' }
      ]
    });
    await alert.present();
    this.applyAlertCSS(alert);
  }

applyAlertCSS(alert: HTMLIonAlertElement) {
  const styles = `
    /* 🔹 CENTER BOTH BUTTONS */
    .alert-button-group {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 16px !important;
    }

    /* CANCEL BUTTON */
    .alert-button.cancel-btn {
      color: red !important;
      border: 2px solid red !important;
      background: transparent !important;
      border-radius: 10px !important;
      padding: 10px 18px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
    }

    /* SUBMIT BUTTON */
    .alert-button.submit-btn {
      background: #059669 !important;
      color: white !important;
      border-radius: 10px !important;
      padding: 10px 18px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;

  /* Inject into alert shadow DOM */
  const shadow = alert.shadowRoot;
  if (shadow) {
    shadow.appendChild(styleEl);
  }

  /* Fallback injection (safe) */
  const wrapper = document.querySelector('.custom-submit-alert');
  if (wrapper) {
    wrapper.appendChild(styleEl.cloneNode(true));
  }
}


  // ======================
  // SUMMARY
  // ======================
 
  


  // ======================
  // SUMMARY
  // ======================
private async showSummaryAlert() {
  this.saveUserAnswer();

  let attempted = 0;
  let right = 0;
  let wrong = 0;

  this.questions.forEach(q => {
    if (q.selected) {
      attempted++;
      if (q.answer && q.selected === q.answer) {
        right++;
      } else {
        wrong++;
      }
    }
  });

  // Use non-breaking spaces for column alignment
  const summaryText =
    'Attempted : ' + attempted + '\n' +
    'Correct   : ✔ ' + right + '\n' +
    'Wrong     : ✖ ' + wrong;

  const alert = await this.alertCtrl.create({
    header: 'Test Summary',
    message: summaryText,
    buttons: [
      { text: 'CLOSE', role: 'cancel' },
      {
        text: 'VIEW MORE',
        handler: () => {
          this.router.navigate(
            ['/tabs/progress'],
            { queryParams: { score: right, total: this.questions.length } }
          );
        }
      }
    ]
  });

  await alert.present();

  // Wait for alert to render
  setTimeout(() => {
    // 1️⃣ Format message text
    const msgEl = document.querySelector('ion-alert .alert-message') as HTMLElement;
    if (msgEl) {
      msgEl.style.whiteSpace = 'pre';         // preserve line breaks
      msgEl.style.fontFamily = 'monospace';  // fixed-width font for column alignment
      msgEl.style.fontSize = '15px';
      msgEl.style.lineHeight = '1.6';
    }

    // 2️⃣ Style buttons
    document.querySelectorAll('ion-alert button').forEach(btn => {
      const button = btn as HTMLButtonElement;
      const text = button.textContent || '';

      if (text.includes('CLOSE')) {
        button.style.border = '2px solid #dc2626';
        button.style.color = '#dc2626';
        button.style.background = 'transparent';
        button.style.borderRadius = '10px';
        button.style.padding = '8px 16px';
        button.style.fontWeight = '600';
      }

      if (text.includes('VIEW')) {
        button.style.background = '#16a34a';
        button.style.color = 'white';
        button.style.borderRadius = '10px';
        button.style.padding = '8px 16px';
        button.style.fontWeight = '600';
      }
    });
  }, 50);
}



}

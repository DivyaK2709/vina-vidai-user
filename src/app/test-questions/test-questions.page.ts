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
   .alert-head {
      padding-bottom: 0 !important;
      margin-bottom: 0 !important;
    }
    /* 🔹 CENTER BOTH BUTTONS */
    .alert-button-group {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      padding-top: 6px !important;   /* 🔥 reduce gap */
      padding-bottom: 6px !important;
      
    }
      .alert-message{
       margin-top: 0 !important;
   padding-top: 0 !important;
      padding-bottom: 6px !important;
  line-height: 1.4;
   text-align: center
  }
      .alert-wrapper {
      text-align: center !important;
       margin-top: 0 !important;     /* 🔥 removes extra gap */
      padding-bottom: 0px;
  line-height: 1.4;
    }
         .alert-head::after {
      content: '';
      display: block;
      width: 90px;
      height: 90px;
        margin:  6px auto 4px !important;
       
      background-image: url('assets/icon/warning.png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      
    }
        .alert-title {
      text-align: center !important;
      font-weight: 700 !important;
      margin-bottom: 4px !important;
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
  let unattempted = 0;

  this.questions.forEach(q => {
    if (q.selected) {
      attempted++;
      if (q.answer && q.selected === q.answer) {
        right++;
      } else {
        wrong++;
      }
      
    }
    else {
    unattempted++;
  }
  });

 
const labelWidth = 10;   // 🔥 controls left column
const valueWidth = 3;   // 🔥 controls number spacing

const pad = (text: string, width: number) =>
  text + '\u00A0'.repeat(Math.max(0, width - text.length));

const summaryText =
  pad('Attempted', labelWidth) +  ' : ' + pad(String(attempted), valueWidth) + ' 🟡\n' +
  pad('Unattempted',labelWidth) + ' : ' + pad(String(unattempted), valueWidth) + ' 🔴\n' +
  pad('Correct',   labelWidth) +  ' : ' + pad(String(right),    valueWidth) + ' ✔️\n' +
  pad('Wrong',     labelWidth) +  ' : ' + pad(String(wrong),    valueWidth) + ' ❌';
 const alert = await this.alertCtrl.create({
  header: 'Test Summary',
  message: summaryText,
  cssClass: 'summary-alert',
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

  this.injectSummaryStyles();
}
injectSummaryStyles() {

  if (document.getElementById('summary-style')) return;

  const style = document.createElement('style');
  style.id = 'summary-style';

  style.textContent = `
    ion-alert.summary-alert {
      --width: 320px;
      --border-radius: 20px;
    }

    ion-alert.summary-alert .alert-wrapper {
      border-radius: 20px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.25);
      text-align: center;
    }

    ion-alert.summary-alert .alert-title {
      text-align: center;
      font-weight: 700;
      margin-bottom: 10px;
    }

    ion-alert.summary-alert .alert-message {
      white-space: pre-line;
      text-align: centre; 
      font-size: 15px;
      line-height: 1.9;
      font-weight: 500;
      font-family: 'Courier New', monospace !important;
      padding: 0 26px;                  /* 👈 center visually */
      color: #000;
    }

    ion-alert.summary-alert .alert-message span {
      display: block;
    }

    ion-alert.summary-alert .alert-message {
      color: #000;
    }

    ion-alert.summary-alert .alert-message::first-line {
      color: #ca8a04;
    }

    ion-alert.summary-alert .alert-button-group {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding-top: 14px;
    }

    ion-alert.summary-alert .alert-button {
      border-radius: 10px;
      font-weight: 600;
       
      color: #dc2626;
      background: transparent;
    }
        ======================= */
    ion-alert.summary-alert .alert-button.alert-button-role-cancel {
      border: 2px solid #dc2626;
      color: #dc2626;
      background: transparent;
    }
        ion-alert.summary-alert .alert-button:not(.alert-button-role-cancel) {
      background: #16a34a;
      color: #ffffff;
    }
  `;

  document.head.appendChild(style);
}

}


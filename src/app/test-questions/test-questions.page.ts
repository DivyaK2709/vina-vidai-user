import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  userAnswer: string = "";
  score = 0;
  timeLeft = 0;
  formattedTime = "00:00:00";
  timer: any;

  constructor(
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.questions = JSON.parse(localStorage.getItem('current_test_questions') || '[]');
    this.meta = JSON.parse(localStorage.getItem('current_test_meta') || '{}');

    this.timeLeft = this.meta.timeSeconds || Number(this.route.snapshot.queryParamMap.get('time')) || 600;
    this.userAnswer = this.questions[this.currentIndex]?.selected || "";

    this.updateFormattedTime();
    this.startTimer();
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  startTimer() {
    if (this.timer) return;
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

  previous() { this.saveUserAnswer(); if (this.currentIndex>0) { this.currentIndex--; this.userAnswer = this.questions[this.currentIndex]?.selected || ""; } }
  next() { this.saveUserAnswer(); if (this.currentIndex<this.questions.length-1) { this.currentIndex++; this.userAnswer = this.questions[this.currentIndex]?.selected || ""; } }
  saveUserAnswer() { this.questions[this.currentIndex].selected = this.userAnswer; }
  onSelectOption() { this.saveUserAnswer(); }

  // FIRST CONFIRM POPUP
async confirmSubmit() {
  const alert = await this.alertCtrl.create({
    header: 'Submit Test?',
    message: 'Are you sure you want to submit your answers?',
    cssClass: 'custom-submit-alert',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        cssClass: 'cancel-btn'
      },
      {
        text: 'Submit',
        handler: () => this.showSummaryAlert(),
        cssClass: 'submit-btn'
      }
    ]
  });

  await alert.present();

  // 🔥 Always works in all devices
  this.applyAlertCSS(alert);
}
applyAlertCSS(alert: HTMLIonAlertElement) {
  const styles = `
    .alert-button.cancel-btn {
      color: red !important;
      border: 2px solid red !important;
      background: transparent !important;
      border-radius: 10px !important;
      padding: 10px 18px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
    }

    .alert-button.submit-btn {
      background: #059669 !important;
      color: white !important;
      border-radius: 10px !important;
      padding: 10px 18px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
    }
  `;

  // 🔥 Create <style> tag
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;

  // 🔥 Append inside shadow DOM (works in all Ionic versions)
  const shadow = alert.shadowRoot;
  if (shadow) {
    shadow.appendChild(styleEl);
  }

  // 🔥 Also append to alert wrapper (fallback for Android devices)
  const wrapper = document.querySelector('.custom-submit-alert');
  if (wrapper) {
    wrapper.appendChild(styleEl.cloneNode(true));
  }
}



  // SECOND POPUP: SUMMARY
  private async showSummaryAlert() {
    const summary = this.computeSummary();
    const alert = await this.alertCtrl.create({
      header: 'Test Summary',
      subHeader: `Attempted: ${summary.attempted} | Right: ${summary.right} | Wrong: ${summary.wrong}`,
      cssClass: 'summary-alert',
      buttons: [
        { text: 'Close', role: 'cancel', cssClass: 'close-btn' },
        { text: 'View More', handler: () => { this.router.navigate(['/tabs/progress'], { queryParams: { score: summary.right, total: summary.total } }); }, cssClass: 'view-more-btn' }
      ]
    });
    await alert.present();
  }

  private computeSummary() {
    this.saveUserAnswer();
    const total = this.questions.length;
    let attempted = 0, right = 0, wrong = 0;
    this.questions.forEach(q => {
      if (q.selected) {
        attempted++;
        if (q.answer && q.selected.toLowerCase() === q.answer.toLowerCase()) right++;
        else wrong++;
      }
    });
    this.score = right;
    return { total, attempted, right, wrong };
  }

}

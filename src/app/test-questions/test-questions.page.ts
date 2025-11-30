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

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateFormattedTime();

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.showSummaryPopup();
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

  previous() {
    this.saveUserAnswer();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.userAnswer = this.questions[this.currentIndex].selected || "";
    }
  }

  next() {
    this.saveUserAnswer();
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.userAnswer = this.questions[this.currentIndex].selected || "";
    }
  }

  saveUserAnswer() {
    this.questions[this.currentIndex].selected = this.userAnswer;
  }

  onSelectOption() {
    this.saveUserAnswer();
  }

async confirmSubmit() {
  const alert = await this.alertCtrl.create({
    header: 'Submit Test?',
    message: 'Are you sure you want to submit your answers?',
    cssClass: 'custom-submit-alert', // <-- important
    buttons: [
      { text: 'Cancel', role: 'cancel', cssClass: 'cancel-btn' },
      { text: 'Submit', handler: () => this.showSummaryAlert(), cssClass: 'submit-btn' }
    ]
  });

  await alert.present();
}


// Show second popup with only counts
private async showSummaryAlert() {
  const summary = this.computeSummary();

  const alert = await this.alertCtrl.create({
    header: 'Test Summary',
    subHeader: `Attempted: ${summary.attempted} | Right: ${summary.right} | Wrong: ${summary.wrong}`,
    cssClass: 'summary-alert',
    buttons: [
      {
        text: 'View More',
        handler: () => {
          this.router.navigate(['/tabs/progress'], {
            queryParams: { score: summary.right, total: summary.total }
          });
        },
        cssClass: 'view-more-btn'
      },
      {
        text: 'Close',
        role: 'cancel',
        cssClass: 'close-btn'
      }
    ]
  });

  await alert.present();
}


  private computeSummary() {
    this.saveUserAnswer();

    const total = this.questions.length;
    let attempted = 0;
    let right = 0;
    let wrong = 0;

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

  private async showSummaryPopup() {
    const summary = this.computeSummary();

    const content = `
      <div class="summary-content">
        <div class="summary-row"><div>Total Questions</div><div class="summary-right">${summary.total}</div></div>
        <div class="summary-row"><div>Attempted</div><div class="summary-right">${summary.attempted}</div></div>
        <div class="summary-row"><div>Right</div><div class="summary-right">${summary.right}</div></div>
        <div class="summary-row"><div>Wrong</div><div class="summary-right">${summary.wrong}</div></div>
      </div>
    `;

    const alert = await this.alertCtrl.create({
      header: 'Test Summary',
      message: content,
      cssClass: 'summary-alert',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
          cssClass: 'close-btn'
        },
        {
          text: 'View More',
          handler: () => {
            this.router.navigate(['/tabs/test-result'], {
              queryParams: {
                score: summary.right,
                total: summary.total
              }
            });
          },
          cssClass: 'view-more-btn'
        }
      ]
    });

    await alert.present();
  }
  
}

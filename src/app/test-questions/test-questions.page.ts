import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-questions',
  standalone: true,
  imports: [
    FormsModule,
    IonicModule,
    CommonModule
  ],
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

    // SET TIME
    this.timeLeft = this.meta.timeSeconds ||
      Number(this.route.snapshot.queryParamMap.get('time')) ||
      600;

    // Load previous answer if exists
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
        this.submitAndFinish();
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

  async confirmSubmit() {
    const alert = await this.alertCtrl.create({
      header: 'Submit Test?',
      message: 'Are you sure you want to submit your answers?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: () => this.submitAndFinish()
        }
      ]
    });

    alert.present();
  }

  submitAndFinish() {
    clearInterval(this.timer);

    // Calculate score
    this.score = 0;

    this.questions.forEach(q => {
      if (q.selected?.toLowerCase() === q.answer?.toLowerCase()) {
        this.score++;
      }
    });

    this.router.navigate(['/tabs/test-result'], {
      queryParams: {
        score: this.score,
        total: this.questions.length
      }
    });
  }
}

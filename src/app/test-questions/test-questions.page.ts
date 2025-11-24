import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-test-questions',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './test-questions.page.html',
  styleUrls: ['./test-questions.page.scss']
})
export class TestQuestionsPage implements OnInit {
  questions: any[] = [];
  meta: any = {};
  currentIndex = 0;
  selectedOption: any = null;
  score = 0;
  timeLeft = 0;
  timer: any;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.questions = JSON.parse(localStorage.getItem('current_test_questions') || '[]');
    this.meta = JSON.parse(localStorage.getItem('current_test_meta') || '{}');
    this.timeLeft = this.meta.timeSeconds || Number(this.route.snapshot.queryParamMap.get('time')) || 600;
    this.startTimer();
  }

  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finish();
      }
    }, 1000);
  }

  selectOption(opt: any) {
    this.selectedOption = opt;
  }

  next() {
    const curr = this.questions[this.currentIndex];
    if (!curr) return;
    if (this.selectedOption === curr.answer) {
      this.score++;
    }
    this.selectedOption = null;
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    } else {
      this.finish();
    }
  }

  finish() {
    clearInterval(this.timer);
    // navigate to results page (implement as you like)
    this.router.navigate(['/tabs/test-result'], { queryParams: { score: this.score, total: this.questions.length }});
  }
}

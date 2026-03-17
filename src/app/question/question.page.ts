import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './question.page.html',
  styleUrls: ['./question.page.scss'],
})
export class QuestionPage {

  step = 1;
  numQuestions: number | null = null;
  timeSelected: number | null = null;
  subject = 'General';

  // Quick-select chips
  quickCounts = [5, 10, 15, 20, 25];

  // Time option cards
  timeOptions = [
    { value: 1,  label: '10 min',     sub: '600 seconds',  icon: 'time-outline'          },
    { value: 2,  label: '20 min',     sub: '1200 seconds', icon: 'hourglass-outline'      },
    { value: 3,  label: '30 min',     sub: '1800 seconds', icon: 'alarm-outline'          },
    { value: 4,  label: '10m 5s',     sub: '605 seconds',  icon: 'stopwatch-outline'      },
    { value: 5,  label: '10m 10s',    sub: '610 seconds',  icon: 'timer-outline'          },
  ];

  constructor(private router: Router, private route: ActivatedRoute) {
    // Pick up subject passed from home page
    this.route.queryParams.subscribe(p => {
      if (p['subject']) this.subject = p['subject'];
    });
  }

  nextStep() {
    if (this.step === 1 && this.numQuestions && this.numQuestions >= 1 && this.numQuestions <= 100) {
      this.step = 2;
    } else if (this.step === 2 && this.timeSelected != null) {
      this.router.navigate(['/tabs/test'], {
        queryParams: {
          questions: this.numQuestions,
          time: this.timeSelected,
          subject: this.subject
        }
      });
    }
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }
}
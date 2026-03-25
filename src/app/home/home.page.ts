import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { inject, Injector, runInInjectionContext } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  private auth     = inject(Auth);
  private injector = inject(Injector);

  subjects        : any[] = [];
  filteredSubjects: any[] = [];
  questionCounts  : { [key: string]: number } = {};
  searchQuery     = '';
  isLoading       = true;
  pressedCard     : string | null = null;
  userName        = 'Learner';
  greeting        = '';
  todayDate       = '';

  // ── Exact same structure as admin ────────────────────────────────
  examData: { [key: string]: any[] } = {
    tnpsc: [
      { name: 'Group 1',  icon: 'star-outline',       color: 'linear-gradient(135deg,#f7971e,#e65100)' },
      { name: 'Group 2',  icon: 'ribbon-outline',      color: 'linear-gradient(135deg,#f7971e,#e65100)' },
      { name: 'Group 2A', icon: 'ribbon-outline',      color: 'linear-gradient(135deg,#ff9800,#e65100)' },
      { name: 'Group 4',  icon: 'document-outline',    color: 'linear-gradient(135deg,#ffa726,#e65100)' },
      { name: 'Group 7',  icon: 'school-outline',      color: 'linear-gradient(135deg,#fb8c00,#bf360c)' },
      { name: 'Group 8',  icon: 'briefcase-outline',   color: 'linear-gradient(135deg,#ef6c00,#b71c1c)' },
    ],
    rrb: [
      { name: 'NTPC Graduate',      icon: 'trending-up-outline',  color: 'linear-gradient(135deg,#4facfe,#0078ff)' },
      { name: 'NTPC Undergraduate', icon: 'book-outline',          color: 'linear-gradient(135deg,#29b6f6,#0277bd)' },
      { name: 'Group D',            icon: 'construct-outline',     color: 'linear-gradient(135deg,#26c6da,#00838f)' },
      { name: 'JE',                 icon: 'settings-outline',      color: 'linear-gradient(135deg,#00bcd4,#006064)' },
      { name: 'ALP',                icon: 'train-outline',         color: 'linear-gradient(135deg,#0288d1,#01579b)' },
    ],
    upsc: [
      { name: 'CDS',  icon: 'shield-outline',      color: 'linear-gradient(135deg,#56ab2f,#1b5e20)' },
      { name: 'EPFO', icon: 'wallet-outline',       color: 'linear-gradient(135deg,#43a047,#1b5e20)' },
      { name: 'IAS',  icon: 'globe-outline',        color: 'linear-gradient(135deg,#66bb6a,#2e7d32)' },
      { name: 'IPS',  icon: 'medal-outline',        color: 'linear-gradient(135deg,#26a69a,#00695c)' },
      { name: 'NDA',  icon: 'flag-outline',         color: 'linear-gradient(135deg,#00897b,#004d40)' },
      { name: 'CAPF', icon: 'shield-half-outline',  color: 'linear-gradient(135deg,#00acc1,#006064)' },
    ],
    ssc: [
      { name: 'CGL',  icon: 'trophy-outline',   color: 'linear-gradient(135deg,#ab47bc,#6a1b9a)' },
      { name: 'CHSL', icon: 'document-outline', color: 'linear-gradient(135deg,#7e57c2,#4527a0)' },
      { name: 'MTS',  icon: 'people-outline',   color: 'linear-gradient(135deg,#5c6bc0,#283593)' },
      { name: 'CPO',  icon: 'shield-outline',   color: 'linear-gradient(135deg,#8e24aa,#4a148c)' },
      { name: 'JE',   icon: 'hammer-outline',   color: 'linear-gradient(135deg,#d81b60,#880e4f)' },
      { name: 'GD',   icon: 'walk-outline',     color: 'linear-gradient(135deg,#e91e63,#880e4f)' },
    ],
  };

  filteredExamData: { [key: string]: any[] } = {};

  private staticSubjects = ['Economics', 'Social Science', 'Geography', 'History'];

  get showStaticSubjects(): boolean {
    if (!this.searchQuery.trim()) return true;
    return this.staticSubjects.some(s =>
      s.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get totalCount(): number {
    return Object.values(this.examData).reduce((t, arr) => t + arr.length, 0)
      + this.subjects.length + this.staticSubjects.length;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private firestore: Firestore,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.setGreeting();
    this.filteredExamData = { ...this.examData };
    runInInjectionContext(this.injector, () => {
      authState(this.auth).subscribe(user => {
        if (user) {
          this.userName = user.displayName || user.email?.split('@')[0] || 'Learner';
        }
      });
    });
    this.loadSubjects();
  }

  setGreeting() {
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    this.todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  loadSubjects() {
    this.isLoading = true;
    this.http.get<any[]>('assets/subjects.json').subscribe({
      next: async (data) => {
        this.subjects         = data;
        this.filteredSubjects = data;
        this.isLoading        = false;
        await this.loadQuestionCounts();
      },
      error: () => {
        this.subjects         = [];
        this.filteredSubjects = [];
        this.isLoading        = false;
        this.loadQuestionCounts();
      }
    });
  }

  async loadQuestionCounts() {
    const allTopics = [
      ...Object.values(this.examData).reduce((acc: any[], arr: any[]) => acc.concat(arr), []).map((i: any) => i.name),

      ...this.subjects.map((s: any) => s.name),
      ...this.staticSubjects,
    ];
    const questionsRef = collection(this.firestore, 'questions');
    for (const topic of allTopics) {
      const q = query(questionsRef, where('subject', '==', topic));
      const snap = await getDocs(q);
      this.questionCounts[topic] = snap.size;
    }
  }

  // ── Filter ───────────────────────────────────────────────────────
  filterAll(event: any) {
    const val = (event.target?.value || '').toLowerCase().trim();
    this.searchQuery = event.target?.value || '';

    // Filter each exam group
    Object.keys(this.examData).forEach(key => {
      this.filteredExamData[key] = !val
        ? this.examData[key]
        : this.examData[key].filter(i => i.name.toLowerCase().includes(val));
    });

    this.filteredSubjects = !val
      ? this.subjects
      : this.subjects.filter((s: any) => s.name.toLowerCase().includes(val));
  }

  showSection(key: string): boolean {
    return (this.filteredExamData[key]?.length ?? 0) > 0;
  }

  getFiltered(key: string): any[] {
    return this.filteredExamData[key] || [];
  }

  matchesSearch(name: string): boolean {
    if (!this.searchQuery.trim()) return true;
    return name.toLowerCase().includes(this.searchQuery.toLowerCase());
  }

  onCardPress(name: string)  { this.pressedCard = name; }
  onCardRelease()            { setTimeout(() => this.pressedCard = null, 200); }

  openUploadPage(name: string) {
    this.router.navigate(['/tabs/question'], {
      queryParams: { subject: name }
    });
  }

  async presentToast(message: string, color = 'primary') {
    const toast = await this.toastController.create({
      message, duration: 2000, position: 'top', color
    });
    await toast.present();
  }
}
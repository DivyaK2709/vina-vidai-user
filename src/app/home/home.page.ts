import { Component, OnInit, inject, Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';

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
  questionCounts: { [key: string]: number | undefined } = {};
  searchQuery     = '';
  isLoading       = true;
  pressedCard     : string | null = null;
  userName        = 'Learner';
  greeting        = '';
  todayDate       = '';

  // ── Exact same exam categories as admin ──────────────────────────
  examCategories = [
    { name: 'SSC',   icon: 'school-outline',    color: 'linear-gradient(135deg, #4facfe, #0078ff)' },
    { name: 'TNPSC', icon: 'ribbon-outline',     color: 'linear-gradient(135deg, #f7971e, #e65100)' },
    { name: 'UPSC',  icon: 'globe-outline',      color: 'linear-gradient(135deg, #56ab2f, #1b5e20)' },
    { name: 'NEET',  icon: 'medkit-outline',     color: 'linear-gradient(135deg, #f953c6, #b91d73)' },
    { name: 'JEE',   icon: 'construct-outline',  color: 'linear-gradient(135deg, #f7971e, #d32f2f)' },
    { name: 'RRB',   icon: 'train-outline',      color: 'linear-gradient(135deg, #0f9b8e, #005c5c)' },
  ];

  filteredExams = [...this.examCategories];

  // ── Exact same static subjects as admin ──────────────────────────
  private staticSubjects = ['Economics', 'Social Science', 'Geography', 'History'];

  get showStaticSubjects(): boolean {
    if (!this.searchQuery.trim()) return true;
    return this.staticSubjects.some(s =>
      s.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get totalCount(): number {
    return this.subjects.length + this.staticSubjects.length + this.examCategories.length;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private firestore: Firestore,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.setGreeting();
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

  // ── Same as admin: load from assets/subjects.json ────────────────
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
        this.isLoading = false;
        this.presentToast('Failed to load subjects.', 'danger');
      }
    });
  }

  // ── Same as admin: query Firestore per topic ──────────────────────
  async loadQuestionCounts() {
    const allTopics = [
      ...this.subjects.map((s: any) => s.name),
      ...this.staticSubjects,
      ...this.examCategories.map(e => e.name)
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

    this.filteredSubjects = !val
      ? this.subjects
      : this.subjects.filter(s => s.name.toLowerCase().includes(val));

    this.filteredExams = !val
      ? this.examCategories
      : this.examCategories.filter(e => e.name.toLowerCase().includes(val));
  }

  matchesSearch(name: string): boolean {
    if (!this.searchQuery.trim()) return true;
    return name.toLowerCase().includes(this.searchQuery.toLowerCase());
  }

  onCardPress(name: string)  { this.pressedCard = name; }
  onCardRelease()            { setTimeout(() => this.pressedCard = null, 200); }

  // ── Navigate to quiz setup ────────────────────────────────────────
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
import { Component, OnInit, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {

  private firestore = inject(Firestore);
  private injector  = inject(Injector);

  searchQuery     = '';
  selectedSubject = '';
  isLoading       = false;

  allQuestions : any[] = [];
  results      : any[] = [];
  bookmarks    : any[] = [];
  recentSearches: string[] = [];

  subjectList = [
    'History', 'Geography', 'Economics',
    'Social Science', 'SSC', 'TNPSC',
    'UPSC', 'NEET', 'JEE', 'RRB'
  ];

  private searchTimer: any;

  ngOnInit() {
    this.loadBookmarks();
    this.loadRecentSearches();
    runInInjectionContext(this.injector, () => {
      this.loadAllQuestions();
    });
  }

  async loadAllQuestions() {
    try {
      const snap = await getDocs(collection(this.firestore, 'questions'));
      this.allQuestions = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        showAnswer: false
      }));
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  }

  // ── Search with debounce ─────────────────────────────────────────
  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.runSearch(), 300);
  }

  runSearch() {
    const q = this.searchQuery.toLowerCase().trim();
    const s = this.selectedSubject.toLowerCase();

    if (!q && !s) { this.results = []; return; }

    this.isLoading = true;

    setTimeout(() => {
      this.results = this.allQuestions.filter(item => {
        const matchQ = !q ||
          (item.question || '').toLowerCase().includes(q) ||
          (item.answer   || '').toLowerCase().includes(q);
        const matchS = !s ||
          (item.subject  || '').toLowerCase() === s;
        return matchQ && matchS;
      });

      // Save to recent
      if (q && !this.recentSearches.includes(this.searchQuery)) {
        this.recentSearches.unshift(this.searchQuery);
        if (this.recentSearches.length > 8) this.recentSearches.pop();
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
      }

      this.isLoading = false;
    }, 200);
  }

  setSubject(subject: string) {
    this.selectedSubject = subject;
    this.runSearch();
  }

  clearSearch() {
    this.searchQuery     = '';
    this.selectedSubject = '';
    this.results         = [];
  }

  applyRecent(term: string) {
    this.searchQuery = term;
    this.runSearch();
  }

  clearRecent() {
    this.recentSearches = [];
    localStorage.removeItem('recentSearches');
  }

  loadRecentSearches() {
    const saved = localStorage.getItem('recentSearches');
    this.recentSearches = saved ? JSON.parse(saved) : [];
  }

  // ── Bookmarks ────────────────────────────────────────────────────
  isBookmarked(q: any): boolean {
    return this.bookmarks.some(b => b.id === q.id);
  }

  toggleBookmark(q: any) {
    if (this.isBookmarked(q)) {
      this.bookmarks = this.bookmarks.filter(b => b.id !== q.id);
    } else {
      this.bookmarks.push({ ...q });
    }
    localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
  }

  loadBookmarks() {
    const saved = localStorage.getItem('bookmarks');
    this.bookmarks = saved ? JSON.parse(saved) : [];
  }
}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  subjects: any[] = [];
  filteredSubjects: any[] = [];
  searchQuery: string = '';
  greeting: string = '';
  todayDate: string = '';
  activeTab: string = 'home';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.setGreeting();
    this.http.get<any[]>('assets/subjects.json').subscribe(data => {
      this.subjects = data;
      this.filteredSubjects = data;
    });
  }

  setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good Morning';
    else if (hour < 17) this.greeting = 'Good Afternoon';
    else this.greeting = 'Good Evening';

    this.todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  filterSubjects() {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredSubjects = query
      ? this.subjects.filter(s => s.name.toLowerCase().includes(query))
      : this.subjects;
  }

  openUploadPage(subjectName: string) {
    this.router.navigate(['/tabs/question'], {
      queryParams: { subject: subjectName }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }
}
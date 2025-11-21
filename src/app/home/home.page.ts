import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  subjects: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.http.get<any[]>('assets/subjects.json').subscribe(data => {
      this.subjects = data;
    });
  }

  openUploadPage(subjectName: string) {
    console.log('Navigating to:', subjectName);
    this.router.navigate(['/question'],
       {
      queryParams: { subject: subjectName }
    });
  }
}

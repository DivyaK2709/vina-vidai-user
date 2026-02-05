import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    IonicModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage {
  selectedTab: string = 'home'; // default selected

  onTabChange(event: any) {
    this.selectedTab = event.tab;
    
  }
}

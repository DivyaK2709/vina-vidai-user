import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TestQuestionsPageRoutingModule } from './test-questions-routing.module';

import { TestQuestionsPage } from './test-questions.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TestQuestionsPageRoutingModule
  ],
  declarations: [TestQuestionsPage]
})
export class TestQuestionsPageModule {}

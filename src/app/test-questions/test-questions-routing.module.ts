import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestQuestionsPage } from './test-questions.page';

const routes: Routes = [
  {
    path: '',
    component: TestQuestionsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestQuestionsPageRoutingModule {}

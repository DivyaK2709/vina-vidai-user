import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'signin',
    loadComponent: () => import('./signin/signin.page').then(m => m.SigninPage)
  },
  {
    path: 'question',
    loadComponent: () => import('./question/question.page').then(m => m.QuestionPage)
  },
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'progress',
    loadComponent: () => import('./progress/progress.page').then(m => m.ProgressPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: 'test',
        loadComponent: () => import('./test/test.page').then(m => m.TestPage)
      },
      {
        path: 'progress',
        loadComponent: () => import('./progress/progress.page').then(m => m.ProgressPage)
      },
      {
        path: 'question',
        loadComponent: () => import('./question/question.page').then(m => m.QuestionPage)
      },
      {
        path: 'test-questions',
        loadComponent: () => import('./test-questions/test-questions.page').then(m => m.TestQuestionsPage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

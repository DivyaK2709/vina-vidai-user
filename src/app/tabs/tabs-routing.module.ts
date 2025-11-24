import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'test',
        loadComponent: () =>
          import('../test/test.page').then((m) => m.TestPage),
      },
      {
        path: 'progress',
        loadComponent: () =>
          import('../progress/progress.page').then((m) => m.ProgressPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then((m) => m.SettingsPage),
      },

      // ⭐ Add Question Page here
      {
        path: 'question',
        loadComponent: () =>
          import('../question/question.page').then((m) => m.QuestionPage),
      },

      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
];

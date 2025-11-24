import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestQuestionsPage } from './test-questions.page';

describe('TestQuestionsPage', () => {
  let component: TestQuestionsPage;
  let fixture: ComponentFixture<TestQuestionsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TestQuestionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

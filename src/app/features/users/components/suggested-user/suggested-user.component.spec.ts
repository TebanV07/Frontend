import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedUserComponent } from './suggested-user.component';

describe('SuggestedUserComponent', () => {
  let component: SuggestedUserComponent;
  let fixture: ComponentFixture<SuggestedUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestedUserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SuggestedUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


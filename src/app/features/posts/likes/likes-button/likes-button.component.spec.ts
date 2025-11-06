import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikesButtonComponent } from './likes-button.component';

describe('LikesButtonComponent', () => {
  let component: LikesButtonComponent;
  let fixture: ComponentFixture<LikesButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikesButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LikesButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

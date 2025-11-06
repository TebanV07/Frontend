import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikesCountComponent } from './likes-count.component';

describe('LikesCountComponent', () => {
  let component: LikesCountComponent;
  let fixture: ComponentFixture<LikesCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikesCountComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LikesCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

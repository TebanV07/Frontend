import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorePeopleComponent } from './explore-people.component';

describe('ExplorePeopleComponent', () => {
  let component: ExplorePeopleComponent;
  let fixture: ComponentFixture<ExplorePeopleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorePeopleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExplorePeopleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

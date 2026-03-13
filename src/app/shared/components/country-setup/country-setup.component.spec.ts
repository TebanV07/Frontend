import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountrySetupComponent } from './country-setup.component';

describe('CountrySetupComponent', () => {
  let component: CountrySetupComponent;
  let fixture: ComponentFixture<CountrySetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountrySetupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CountrySetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


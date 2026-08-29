import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalTermsComponent } from './legal-terms.component';

describe('LegalTermsComponent', () => {
  let component: LegalTermsComponent;
  let fixture: ComponentFixture<LegalTermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalTermsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LegalTermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

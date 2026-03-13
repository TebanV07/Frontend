import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoFeedPageComponent } from './video-feed-page.component';

describe('VideoFeedPageComponent', () => {
  let component: VideoFeedPageComponent;
  let fixture: ComponentFixture<VideoFeedPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoFeedPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VideoFeedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


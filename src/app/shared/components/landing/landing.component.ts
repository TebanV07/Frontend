import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftSpeed: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements AfterViewInit, OnDestroy {

  @ViewChild('starfield') private starfieldRef!: ElementRef<HTMLCanvasElement>;

  heroLoaded = false;
  heroTiltTransform = 'rotateX(0deg) rotateY(0deg)';

  private ctx!: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private animationFrameId = 0;
  private resizeObserver?: ResizeObserver;

  private readonly starColor = '201, 154, 62'; // matches --gold-rgb tone

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    // Small delay so the hero entrance transition is visible on load
    setTimeout(() => (this.heroLoaded = true), 60);
    this.setupStarfield();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver?.disconnect();
  }

  onHeroMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    const maxTilt = 6; // degrees
    const rotateY = relX * maxTilt * 2;
    const rotateX = relY * -maxTilt * 2;

    this.heroTiltTransform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  onHeroMouseLeave(): void {
    this.heroTiltTransform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }

  private setupStarfield(): void {
    const canvas = this.starfieldRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    const container = canvas.parentElement as HTMLElement;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.generateStars(width, height);
    };

    resize();

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => resize());
      this.resizeObserver.observe(container);
    } else {
      (window as Window).addEventListener('resize', resize);
    }

    // Run the animation loop outside Angular's change detection for performance
    this.zone.runOutsideAngular(() => this.animate());
  }

  private generateStars(width: number, height: number): void {
    const density = 0.00014; // stars per px^2, tuned for a subtle field
    const count = Math.round(width * height * density);

    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.3 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.25,
      twinkleSpeed: Math.random() * 0.015 + 0.004,
      twinklePhase: Math.random() * Math.PI * 2,
      driftSpeed: Math.random() * 0.012 + 0.004
    }));
  }

  private animate = (): void => {
    const canvas = this.starfieldRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.ctx.clearRect(0, 0, width, height);

    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed;
      star.y -= star.driftSpeed;
      if (star.y < -2) {
        star.y = height + 2;
        star.x = Math.random() * width;
      }

      const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
      const alpha = star.baseAlpha * (0.5 + twinkle * 0.5);

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${this.starColor}, ${alpha})`;
      this.ctx.fill();
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  features = [
    {
      image: '/assets/feature-translation.png',
      title: 'Traducción con IA integrada',
      description: 'Publica posts, videos, chats e imágenes y que se traduzcan automáticamente para que cualquier persona del mundo te entienda, sin importar el idioma.'
    },
    {
      image: '/assets/feature-trends.png',
      title: 'Tendencias de cada país',
      description: 'Descubre qué se habla y qué es popular en cada rincón del mundo, y conoce más sobre su cultura mientras te conectas con su gente.'
    },
    {
      image: '/assets/feature-community.png',
      title: 'Gente nueva, cerca o lejos',
      description: 'TIMQU te sugiere personas de cualquier país para conocer, sin que el idioma sea un obstáculo para empezar la conversación.'
    },
    {
      image: '/assets/feature-voice.png',
      isIcon: true,
      title: 'Voces personalizadas',
      description: 'Los videos traducidos mantienen la personalización de voz de cada creador, para una experiencia más natural y cercana.'
    },
    {
      image: '/assets/feature-maps.png',
      isIcon: true,
      badge: 'Próximamente',
      title: 'Mapas para viajeros',
      description: '¿Viajando a otro país? Encuentra hoteles y restaurantes cerca tuyo sin conocer el idioma local, directo desde TIMQU.'
    }
  ];

  steps = [
    { number: '01', title: 'Crea tu cuenta', description: 'Regístrate gratis en segundos con tu email o con Google.' },
    { number: '02', title: 'Elige tu idioma', description: 'Configura tu idioma nativo y TIMQU traduce todo por ti automáticamente.' },
    { number: '03', title: 'Conecta sin fronteras', description: 'Chatea, publica y descubre contenido de cualquier país como si hablaras su idioma.' }
  ];
}

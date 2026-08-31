import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {

  features = [
    {
      image: '/assets/landing/feature-translation.png',
      title: 'Traducción con IA integrada',
      description: 'Publica posts, videos, chats e imágenes y que se traduzcan automáticamente para que cualquier persona del mundo te entienda, sin importar el idioma.'
    },
    {
      image: '/assets/landing/feature-trends.png',
      title: 'Tendencias de cada país',
      description: 'Descubre qué se habla y qué es popular en cada rincón del mundo, y conoce más sobre su cultura mientras te conectas con su gente.'
    },
    {
      image: '/assets/landing/feature-voice.png',
      title: 'Voces personalizadas',
      description: 'Los videos traducidos mantienen la personalización de voz de cada creador, para una experiencia más natural y cercana.'
    },
    {
      image: '/assets/landing/feature-maps.png',
      title: 'Próximamente: mapas para viajeros',
      description: '¿Viajando a otro país? Encuentra hoteles y restaurantes cerca tuyo sin conocer el idioma local, directo desde TIMQU.'
    },
    {
      image: '/assets/landing/feature-community.png',
      title: 'Traducciones que mejoran contigo',
      description: 'Ayúdanos a perfeccionar las traducciones con jergas locales de cada idioma, con sugerencias de la comunidad y expertos en idiomas.'
    }
  ];

  steps = [
    { number: '01', title: 'Crea tu cuenta', description: 'Regístrate gratis en segundos con tu email o con Google.' },
    { number: '02', title: 'Elige tu idioma', description: 'Configura tu idioma nativo y TIMQU traduce todo por ti automáticamente.' },
    { number: '03', title: 'Conecta sin fronteras', description: 'Chatea, publica y descubre contenido de cualquier país como si hablaras su idioma.' }
  ];
}

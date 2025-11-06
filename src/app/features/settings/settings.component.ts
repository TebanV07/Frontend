import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  badge?: string;
  badgeColor?: string;
  features: PlanFeature[];
  popular?: boolean;
  gradient: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  activeTab: 'account' | 'privacy' | 'notifications' | 'subscription' | 'translation' = 'account';
  
  // User settings
  userSettings = {
    username: 'usuario123',
    email: 'usuario@email.com',
    bio: 'Creador de contenido apasionado por la tecnología',
    country: 'Ecuador',
    language: 'es',
    website: 'https://miportfolio.com'
  };

  // Privacy settings
  privacySettings = {
    profilePublic: true,
    showEmail: false,
    allowMessages: true,
    showActivity: true,
    dataCollection: true
  };

  // Notification settings
  notificationSettings = {
    emailNotifications: true,
    pushNotifications: true,
    newFollowers: true,
    likes: true,
    comments: true,
    mentions: true,
    liveStreams: false
  };

  // Translation settings
  translationSettings = {
    autoTranslate: true,
    preferredLanguage: 'es',
    showOriginal: true,
    translateComments: true
  };

  // Current user subscription
  currentPlan = 'free'; // free, pro, premium

  // Subscription plans
  subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'siempre',
      gradient: 'linear-gradient(135deg, #94a3b8, #64748b)',
      features: [
        { text: '5 videos por mes', included: true },
        { text: 'Traducciones básicas (3 idiomas)', included: true },
        { text: 'Calidad de video 720p', included: true },
        { text: 'Almacenamiento: 500MB', included: true },
        { text: 'Anuncios en el contenido', included: true },
        { text: 'Soporte básico', included: true },
        { text: 'Marca de agua en videos', included: true },
        { text: 'Estadísticas avanzadas', included: false },
        { text: 'Streaming en vivo', included: false },
        { text: 'Prioridad en soporte', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      period: 'mes',
      badge: 'Popular',
      badgeColor: '#3b82f6',
      popular: true,
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      features: [
        { text: '50 videos por mes', included: true },
        { text: 'Traducciones completas (24+ idiomas)', included: true },
        { text: 'Calidad de video 1080p', included: true },
        { text: 'Almacenamiento: 10GB', included: true },
        { text: 'Sin anuncios', included: true },
        { text: 'Estadísticas avanzadas', included: true },
        { text: 'Sin marca de agua', included: true },
        { text: 'Streaming en vivo (2 horas/día)', included: true },
        { text: 'Prioridad en soporte', included: true },
        { text: 'Insignia PRO en perfil', included: true }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      period: 'mes',
      badge: 'Mejor Valor',
      badgeColor: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      features: [
        { text: 'Videos ilimitados', included: true },
        { text: 'Traducciones ilimitadas (todos los idiomas)', included: true },
        { text: 'Calidad de video 4K', included: true },
        { text: 'Almacenamiento: 100GB', included: true },
        { text: 'Sin anuncios + Ad-free para seguidores', included: true },
        { text: 'Estadísticas en tiempo real', included: true },
        { text: 'Streaming en vivo ilimitado', included: true },
        { text: 'Soporte prioritario 24/7', included: true },
        { text: 'Insignia PREMIUM exclusiva', included: true },
        { text: 'Acceso anticipado a funciones', included: true }
      ]
    }
  ];

  languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Load user settings from service
    this.loadUserSettings();
  }

  loadUserSettings() {
    // Simulate loading from API
    console.log('Loading user settings...');
  }

  selectTab(tab: 'account' | 'privacy' | 'notifications' | 'subscription' | 'translation') {
    this.activeTab = tab;
  }

  saveAccountSettings() {
    console.log('Saving account settings:', this.userSettings);
    // Call API to save settings
    this.showSuccessMessage('Configuración de cuenta guardada');
  }

  savePrivacySettings() {
    console.log('Saving privacy settings:', this.privacySettings);
    this.showSuccessMessage('Configuración de privacidad guardada');
  }

  saveNotificationSettings() {
    console.log('Saving notification settings:', this.notificationSettings);
    this.showSuccessMessage('Configuración de notificaciones guardada');
  }

  saveTranslationSettings() {
    console.log('Saving translation settings:', this.translationSettings);
    this.showSuccessMessage('Configuración de traducción guardada');
  }

  selectPlan(planId: string) {
    if (planId === this.currentPlan) return;
    
    if (planId === 'free') {
      this.downgradePlan();
    } else {
      this.upgradePlan(planId);
    }
  }

  upgradePlan(planId: string) {
    console.log('Upgrading to plan:', planId);
    // Redirect to payment gateway
    this.showSuccessMessage(`Redirigiendo a pago para plan ${planId.toUpperCase()}...`);
    // In real app: this.router.navigate(['/checkout', planId]);
  }

  downgradePlan() {
    if (confirm('¿Estás seguro de que quieres cambiar al plan gratuito? Perderás todos los beneficios premium.')) {
      console.log('Downgrading to free plan');
      this.currentPlan = 'free';
      this.showSuccessMessage('Plan cambiado a Free');
    }
  }

  cancelSubscription() {
    if (confirm('¿Estás seguro de que quieres cancelar tu suscripción? Mantendrás los beneficios hasta el final del período actual.')) {
      console.log('Cancelling subscription');
      this.showSuccessMessage('Suscripción cancelada. Activa hasta fin de período.');
    }
  }

  deleteAccount() {
    if (confirm('⚠️ ADVERTENCIA: Esta acción eliminará permanentemente tu cuenta y todo tu contenido. ¿Estás seguro?')) {
      if (confirm('Esta acción NO se puede deshacer. ¿Confirmas que deseas eliminar tu cuenta?')) {
        console.log('Deleting account...');
        // Call API to delete account
        this.router.navigate(['/login']);
      }
    }
  }

  showSuccessMessage(message: string) {
    alert(message);
    // In real app, use a toast notification service
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
# Tinko

> Red social con inteligencia artificial integrada.

🌐 **[tinko.lat](https://tinko.lat)**

---

## ¿Qué es Tinko?

Tinko es una red social moderna que integra inteligencia artificial para mejorar la experiencia de sus usuarios. Permite publicaciones, interacciones en comunidad y funciones potenciadas por IA como transcripción de voz, generación de contenido y más.

Disponible como **aplicación web** y **app Android** (via Capacitor).

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Angular | 17.3.12 |
| Estilos | SCSS | — |
| UI Components | Angular Material + CDK | 17.3.10 |
| Carrusel / Sliders | Swiper | 12.0.3 |
| Rendering | Angular SSR (Express) | 17.3.17 |
| Reactividad | RxJS | 7.8.x |
| Lenguaje | TypeScript | 5.4.x |
| Internacionalización | @ngx-translate/core | 15.0.0 |
| App móvil | Capacitor (Android) | 8.0.2 |
| Deploy web | Vercel | — |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── components/       # Componentes reutilizables de UI
│   ├── pages/            # Vistas y pantallas principales
│   ├── services/         # Servicios y lógica de negocio
│   ├── models/           # Interfaces y tipos TypeScript
│   └── guards/           # Guards de rutas
├── assets/
│   ├── i18n/             # Archivos de traducción (ngx-translate)
│   └── images/           # Imágenes y recursos estáticos
├── styles/               # Estilos globales SCSS y variables
└── environments/         # Configuración por entorno
```

---

## Instalación y desarrollo local

### Requisitos previos

- Node.js 18+ *(Node 24 no es soportado oficialmente por Angular 17)*
- Angular CLI 17 → `npm install -g @angular/cli@17`

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TebanV07/Frontend.git
cd Frontend

# 2. Instalar dependencias
npm install

# 3. Correr en desarrollo
ng serve
```

Navega a `http://localhost:4200/`. La app recarga automáticamente al guardar cambios.

---

## Estilos y diseño

Los estilos están en SCSS modular:

```
src/styles/
├── _variables.scss    # Colores, tipografía y espaciados globales
├── _mixins.scss       # Mixins reutilizables
└── styles.scss        # Entrada principal de estilos
```

**Angular Material** se personaliza mediante theming SCSS en `styles.scss`.
**Swiper** tiene sus propios estilos sobreescribibles vía SCSS.

---

## Build

```bash
# Desarrollo con watch
npm run watch

# Producción
npm run build:prod

# SSR
npm run serve:ssr:Frontend
```

El deploy en producción se hace automáticamente vía Vercel al hacer push a `main`.

---

## App Android (Capacitor)

```bash
# Sincronizar con Capacitor
npm run sync:cap

# Abrir en Android Studio
npm run open:android

# Build APK release
npm run build:apk
```

---

## Internacionalización (i18n)

El proyecto usa `@ngx-translate/core` para soporte multilenguaje.
Archivos de traducción en: `src/assets/i18n/`

---

*Frontend de Tinko — repositorio privado.*

Tinko

Red social con inteligencia artificial integrada — construida con Angular y SCSS.

🌐 tinko.lat

¿Qué es Tinko?
Tinko es una red social moderna que integra inteligencia artificial para mejorar la experiencia de sus usuarios. Permite publicaciones, interacciones en comunidad y funciones potenciadas por IA como transcripción de voz, generación de contenido y más.

Stack tecnológico
CapaTecnologíaFrameworkAngular 17EstilosSCSSDeployVercelInternacionalizaciónngx-translate

Estructura del proyecto
src/
├── app/
│   ├── components/       # Componentes reutilizables de UI
│   ├── pages/            # Vistas y pantallas principales
│   ├── services/         # Servicios y lógica de negocio
│   ├── models/           # Interfaces y tipos TypeScript
│   └── guards/           # Guards de rutas
├── assets/               # Imágenes, íconos y recursos estáticos
├── styles/               # Estilos globales SCSS y variables
└── environments/         # Configuración por entorno

Instalación y desarrollo local
Requisitos previos

Node.js 18+
Angular CLI 17

Pasos
bash# 1. Clonar el repositorio
git clone https://github.com/TebanV07/Frontend.git
cd Frontend

# 2. Instalar dependencias
npm install

# 3. Correr en desarrollo
ng serve
Navega a http://localhost:4200/. La app recarga automáticamente al guardar cambios.

Estilos y diseño
Los estilos están organizados en SCSS modular:
src/styles/
├── _variables.scss    # Colores, tipografía y espaciados globales
├── _mixins.scss       # Mixins reutilizables
└── styles.scss        # Entrada principal de estilos
Para modificar la paleta de colores o tipografía, el punto de entrada es src/styles/_variables.scss.

Build para producción
bashng build
Los archivos compilados se generan en /dist. El deploy en producción se hace automáticamente vía Vercel al hacer push a main.

Internacionalización (i18n)
El proyecto usa ngx-translate para soporte multilenguaje. Los archivos de traducción están en:
src/assets/i18n/
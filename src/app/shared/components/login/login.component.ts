import { Capacitor } from '@capacitor/core';
import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginResponse, RegisterResponse } from '../../../core/services/auth.service';
import { Language, LanguageService } from '../../../core/services/language.service';
import { CountrySetupComponent } from '../index';
import { environment } from '../../../../environments/environment';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
declare const google: any;
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, CountrySetupComponent, TranslateModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  isRegisterMode = false;
  isLoading = false;
  isNative = Capacitor.isNativePlatform();
  showPassword = false;
  errorMessage = '';
  readonly availableLanguages: Language[];

  // Nuevo: mostrar modal de país después del login
  showCountrySetup = false;

  formData = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    nativeLanguage: 'es',
    rememberMe: false
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private languageService: LanguageService
  ) {
    this.availableLanguages = [...this.languageService.SUPPORTED_LANGUAGES];
    this.initializeGoogleSignIn();
  }

  /** Configurar Google Sign-In con el nuevo SDK */
/** Bifurca la inicialización de Google Sign-In según la plataforma */
private initializeGoogleSignIn(): void {
  if (this.isNative) {
    // Flujo nativo (Android/iOS) - plugin de Capacitor
    GoogleAuth.initialize();
  } else {
    // Flujo web - Google Identity Services (GIS)
    this.initializeGoogleSignInWeb();
  }
}

/**
 * Inicializa el botón de Google en la versión WEB usando Google Identity Services.
 * El script de GIS se carga async/defer en index.html, por eso esperamos con un
 * setInterval a que 'google' esté disponible antes de usarlo.
 */
private initializeGoogleSignInWeb(): void {
  const checkGoogleLoaded = setInterval(() => {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      clearInterval(checkGoogleLoaded);

      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => {
          // El callback corre fuera de la zona de Angular, por eso ngZone.run()
          this.ngZone.run(() => {
            this.onGoogleLogin(response.credential);
          });
        }
      });

      const container = document.getElementById('google-btn-container');
      if (container) {
        google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: 280
        });
      }
    }
  }, 200);
}

async signInWithGoogle(): Promise<void> {
  try {
    const user = await GoogleAuth.signIn();
    const idToken = user.authentication.idToken;
    if (idToken) {
      this.onGoogleLogin(idToken);
    } else {
      this.errorMessage = 'No se recibió token de Google';
    }
  } catch (err) {
    console.error('Error de Google Sign-In nativo:', err);
    this.errorMessage = 'Login con Google cancelado o fallido.';
  }
}

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.formData = {
      firstName: '', lastName: '', username: '',
      email: '', password: '', nativeLanguage: 'es', rememberMe: false
    };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  generateUsername(): string {
    return this.formData.username || this.formData.email.split('@')[0];
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.isRegisterMode ? this.register() : this.login();
  }

  // ============================================
  // EMAIL LOGIN / REGISTER
  // ============================================

  private login() {
    this.authService.login(this.formData.email, this.formData.password).subscribe({
      next: async (response: LoginResponse) => {
        this.isLoading = false;
        await this._afterLogin();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (error.status === 500) {
          this.errorMessage = 'Error del servidor. Intenta más tarde.';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Verifica tus datos.';
        }
      }
    });
  }

  private register() {
    const registerData = {
      username: this.generateUsername(),
      email: this.formData.email,
      password: this.formData.password,
      first_name: this.formData.firstName,
      last_name: this.formData.lastName,
      native_language: this.formData.nativeLanguage
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.authService.login(this.formData.email, this.formData.password).subscribe({
          next: async () => {
            this.isLoading = false;
            await this._afterLogin();
          },
          error: () => {
            this.isLoading = false;
            this.isRegisterMode = false;
            this.errorMessage = 'Registro exitoso. Ahora puedes iniciar sesión.';
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 400) {
          if (error.error?.detail?.includes('Email ya registrado')) {
            this.errorMessage = 'Este email ya está registrado';
          } else if (error.error?.detail?.includes('Username ya existe')) {
            this.errorMessage = 'Este nombre de usuario ya existe';
          } else {
            this.errorMessage = error.error?.detail || 'Error en los datos del formulario';
          }
        } else {
          this.errorMessage = 'Error al registrar usuario. Intenta más tarde.';
        }
      }
    });
  }

  // ============================================
  // GOOGLE OAUTH
  // ============================================

  /**
    * Maneja la autenticación con Google.
    * Llama este método desde el callback del SDK de Google.
   */
  onGoogleLogin(googleToken: string | any): void {
    // Si es un objeto de respuesta de Google, obtener el credential
    const token = typeof googleToken === 'string' ? googleToken : googleToken.credential || googleToken;

    if (!token) {
      this.errorMessage = 'No se recibió token de Google';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.loginWithGoogle(token).subscribe({
      next: async () => {
        this.isLoading = false;
        await this._afterLogin();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al iniciar sesion con Google. Verifica el client ID y el origen permitido en Google Cloud Console.';
        console.error('Error de login con Google:', err);
      }
    });
  }

  // ============================================
  // FACEBOOK OAUTH
  // ============================================

  /**
    * Llama este método desde el botón de Facebook.
    * Requiere que el SDK de Facebook esté cargado en index.html:
   *   <script async defer crossorigin="anonymous"
   *     src="https://connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v19.0&appId=TU_APP_ID">
   *   </script>
   */
  onFacebookLogin(): void {
    const FB = (window as any)['FB'];
    if (!FB) {
      this.errorMessage = 'SDK de Facebook no disponible.';
      return;
    }
    this.isLoading = true;
    FB.login((response: any) => {
      if (response.authResponse) {
        this.authService.loginWithFacebook(response.authResponse.accessToken).subscribe({
          next: async () => {
            this.isLoading = false;
            await this._afterLogin();
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = 'Error al iniciar sesión con Facebook.';
            console.error('Facebook login error:', err);
          }
        });
      } else {
        this.isLoading = false;
        this.errorMessage = 'Login con Facebook cancelado.';
      }
    }, { scope: 'email,public_profile' });
  }

  // ============================================
  // APPLE OAUTH
  // ============================================

  /**
    * Llama este método desde el botón de Apple.
   * Requiere el JS SDK de Apple:
   *   <script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
   *
    * Y configuración en ngOnInit:
   *   AppleID.auth.init({
   *     clientId: 'com.tuapp.service',
   *     scope: 'name email',
   *     redirectURI: 'https://tuapp.com/auth/apple/callback',
   *     usePopup: true
   *   });
   */
  async onAppleLogin(): Promise<void> {
    const AppleID = (window as any)['AppleID'];
    if (!AppleID) {
      this.errorMessage = 'SDK de Apple no disponible.';
      return;
    }
    try {
      this.isLoading = true;
      const response = await AppleID.auth.signIn();
      const identityToken = response.authorization?.id_token;
      const firstName = response.user?.name?.firstName;
      const lastName = response.user?.name?.lastName;

      this.authService.loginWithApple(identityToken, firstName, lastName).subscribe({
        next: async () => {
          this.isLoading = false;
          await this._afterLogin();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Error al iniciar sesión con Apple.';
          console.error('Apple login error:', err);
        }
      });
    } catch (err) {
      this.isLoading = false;
      this.errorMessage = 'Login con Apple cancelado o fallido.';
    }
  }

  // ============================================
  // FLUJO POST-LOGIN
  // ============================================

  /**
    * Después de cualquier login exitoso:
    * - Esperar a que se detecte el país
    * - Si el usuario no tiene país -> mostrar modal
    * - Si ya tiene país -> ir directo al home
   */
  private async _afterLogin(): Promise<void> {
    if (this.authService.needsEmailVerification()) {
      this.router.navigate(['/verify-email-required']);
      return;
    }

    // Esperar a que detectCountry() termine.
    await this.authService.waitForCountryDetection();

    if (this.authService.needsCountrySetup()) {
      this.showCountrySetup = true;
    } else {
      this.router.navigate(['/home']);
    }
  }

  /** Cuando el usuario termina de configurar su país */
  onCountrySetupCompleted(): void {
    this.showCountrySetup = false;
    this.router.navigate(['/home']);
  }
}



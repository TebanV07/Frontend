import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse, RegisterResponse } from '../../../core/services/auth.service';
import { CountrySetupComponent } from '../index';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, CountrySetupComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isRegisterMode = false;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  // ⭐ NUEVO: mostrar modal de país después del login
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
    private ngZone: NgZone
  ) {
    this.initializeGoogleSignIn();
  }

  /** Configurar Google Sign-In con el nuevo SDK */
  private initializeGoogleSignIn(): void {
    // Esperar a que el SDK de Google esté disponible
    const checkGoogleSDK = setInterval(() => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        clearInterval(checkGoogleSDK);

        // Obtener CLIENT_ID desde environment o variable global
        const clientId = (window as any)['GOOGLE_CLIENT_ID'] || this.getGoogleClientIdFromEnv();

        if (!clientId || clientId === 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID') {
          console.warn('⚠️ GOOGLE_CLIENT_ID no está configurado. Configúralo en environment o como variable global.');
          return;
        }

        // Inicializar Google Sign-In
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            this.ngZone.run(() => {
              if (response.credential) {
                this.onGoogleLogin(response.credential);
              }
            });
          },
          // Auto-prompt en navegadores que lo soportan
          auto_select: false
        });

        // Renderizar el botón de Google si quisiéramos usarlo
        // google.accounts.id.renderButton(
        //   document.getElementById('google-signin-button'),
        //   { theme: 'outline', size: 'large' }
        // );
      }
    }, 100);

    // Timeout de 5 segundos para evitar loops infinitos
    setTimeout(() => clearInterval(checkGoogleSDK), 5000);
  }

  /** Obtener CLIENT_ID desde el archivo de environment */
  private getGoogleClientIdFromEnv(): string {
    return environment.googleClientId || '';
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
        this.errorMessage = 'Error al iniciar sesión con Google. Asegúrate de configurar GOOGLE_CLIENT_ID en el backend.';
        console.error('Google login error:', err);
      }
    });
  }

  /**
   * Dispara el Google Sign-In cuando el usuario hace click en el botón.
   * Muestra el selector de cuentas de Google.
   */
  triggerGoogleSignIn(): void {
    const google = (window as any).google;
    if (google?.accounts?.id) {
      // Mostrar el selector de cuentas de Google
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Si el prompt automático no se puede mostrar, usa el flujo manual
          // En este caso mostraríamos un diálogo o reduciríamos el flujo
          console.log('Google prompt no disponible, intentando flujo alternativo');
        }
      });
    } else {
      this.errorMessage = 'Google Sign-In no está disponible. Revisa tu configuración.';
      console.warn('Google SDK no disponible');
    }
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
   * - Si el usuario no tiene país → mostrar modal
   * - Si ya tiene país → ir directo al home
   */
  private async _afterLogin(): Promise<void> {
    // ⭐ ESPERAR a que detectCountry() termine (máx 3 segundos)
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

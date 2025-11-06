import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse, RegisterResponse } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isRegisterMode = false;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  
  // Datos del formulario actualizados para coincidir con el backend
  formData = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    nativeLanguage: 'es', // Idioma por defecto
    rememberMe: false
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = ''; // Limpiar mensajes de error al cambiar modo
    // Reset form
    this.formData = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      nativeLanguage: 'es',
      rememberMe: false
    };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Generar username automáticamente desde el email si no se proporciona
  generateUsername(): string {
    if (this.formData.username) {
      return this.formData.username;
    }
    return this.formData.email.split('@')[0]; // Usar la parte antes del @ como username
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.isRegisterMode) {
      this.register();
    } else {
      this.login();
    }
  }

  private login() {
    this.authService.login(this.formData.email, this.formData.password)
      .subscribe({
        next: (response: LoginResponse) => {
          this.isLoading = false;
          console.log('✅ Login exitoso:', response);
          
          // Redirigir al home
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error en login:', error);
          
          // Mostrar mensaje de error amigable
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

    this.authService.register(registerData)
      .subscribe({
        next: (response: RegisterResponse) => {
          this.isLoading = false;
          console.log('✅ Registro exitoso:', response);
          
          // Auto-login después del registro
          this.authService.login(this.formData.email, this.formData.password)
            .subscribe({
              next: () => {
                this.router.navigate(['/home']);
              },
              error: (loginError) => {
                console.error('Error en auto-login:', loginError);
                // Cambiar a modo login para que el usuario haga login manual
                this.isRegisterMode = false;
                this.errorMessage = 'Registro exitoso. Ahora puedes iniciar sesión.';
              }
            });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error en registro:', error);
          
          // Manejar diferentes tipos de errores
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
}
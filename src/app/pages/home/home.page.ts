import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';       // Servicio de Autenticación
import { StorageService } from '../../services/storage.service'; // Servicio de Storage

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  email: string = '';
  password: string = '';
  showPassword: boolean = false; // Variable para controlar la visibilidad de la contraseña

  constructor(private authService: AuthService, private storageService: StorageService, private router: Router) {}

  async onSubmit() {
    try {
      // Iniciar sesión en Firebase Authentication
      const credenciales = await this.authService.login(this.email.trim(), this.password.trim());

      // Guardar sólo datos simples como uid, email en el storage
      const usuarioInfo = {
        uid: credenciales.user?.uid,
        email: credenciales.user?.email
      };

      // Guardar el usuario actual en el storage
      await this.storageService.setItem('usuario_actual', usuarioInfo);

      // Redirigir a la página de selección de rol
      this.router.navigate(['/role-selection']);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    
      // Verificar si el error tiene la propiedad 'message'
      if (error instanceof Error) {
        alert(error.message);  // Mostrar el mensaje del error
      } else {
        alert('Ocurrió un error desconocido.');
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Alternar la visibilidad de la contraseña
  }
}

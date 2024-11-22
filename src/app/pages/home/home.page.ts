import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';       // Servicio de Autenticación
import { StorageService } from '../../services/storage.service'; // Servicio de Storage

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  email: string = '';
  password: string = '';
  showPassword: boolean = false; // Variable para controlar la visibilidad de la contraseña

  constructor(
    private authService: AuthService, 
    private storageService: StorageService, 
    private router: Router
  ) {}

  async ngOnInit() {
    // Intentar cargar la sesión desde el almacenamiento local si no hay conexión
    const usuarioGuardado = await this.storageService.getItem('usuario_actual');
    if (usuarioGuardado) {
      // Redirigir directamente a la página de selección de rol si hay un usuario guardado
      this.router.navigate(['/role-selection']);
    }
  }

  async onSubmit() {
    try {
      // Intentar iniciar sesión en Firebase Authentication
      const credenciales = await this.authService.login(this.email.trim(), this.password.trim());

      // Guardar sólo datos simples como uid, email en el storage
      const usuarioInfo = {
        uid: credenciales.user?.uid,
        email: credenciales.user?.email,
        password: this.password.trim() // Guardar la contraseña para inicio de sesión sin conexión
      };

      // Guardar el usuario actual en el storage
      await this.storageService.setItem('usuario_actual', usuarioInfo);

      // Redirigir a la página de selección de rol
      this.router.navigate(['/role-selection']);
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      // Manejar errores de red para permitir inicio sin conexión
      if (error.code === 'auth/network-request-failed') {
        // Intentar validar con datos almacenados localmente
        const usuarioGuardado = await this.storageService.getItem('usuario_actual');
        if (usuarioGuardado && usuarioGuardado.email === this.email.trim() && usuarioGuardado.password === this.password.trim()) {
          alert('Inicio de sesión sin conexión exitoso.');
          this.router.navigate(['/role-selection']);
        } else {
          alert('No se encontró un usuario válido para iniciar sesión sin conexión.');
        }
      } else if (error.message) {
        alert(error.message); // Mostrar el mensaje del error
      } else {
        alert('Ocurrió un error desconocido.');
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Alternar la visibilidad de la contraseña
  }
}

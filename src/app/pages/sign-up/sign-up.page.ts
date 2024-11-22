import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage {
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  canProceed: boolean = false;
  nombreError: string = '';
  apellidoError: string = '';
  emailError: string = '';
  passwordError: string = '';

  constructor(private authService: AuthService, private storageService: StorageService, private router: Router) {}

  // Validar todos los campos
  Validar() {
    this.nombreError = this.nombre.length >= 5 ? '' : 'El nombre debe tener al menos 5 caracteres.';
    this.apellidoError = this.apellido.length >= 5 ? '' : 'El apellido debe tener al menos 5 caracteres.';
    this.emailError = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(this.email) ? '' : 'Introduce un correo electrónico válido.';
    this.passwordError = this.password.length >= 8 ? '' : 'La contraseña debe tener al menos 8 caracteres.';

    this.canProceed = !this.nombreError && !this.apellidoError && !this.emailError && !this.passwordError;
  }

  // Mostrar Toast con el mensaje
  async presentToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 5000;
    toast.cssClass = 'toast-success'; // Aplica la clase personalizada
    document.body.appendChild(toast);
    return toast.present();
  }

  // Registrar el usuario y enviar el correo de verificación
  async registrarUsuario() {
    if (this.canProceed) {
      try {
        // Registrar usuario en Firebase Authentication
        const credenciales = await this.authService.register(this.email.trim(), this.password.trim());

        // Enviar correo de verificación
        if (credenciales.user) {
          await credenciales.user.sendEmailVerification();
        }

        // Crear el objeto de usuario para guardar en Firestore y Ionic Storage
        const nuevoUsuario = {
          uid: credenciales.user?.uid,
          nombre: this.nombre.trim(),
          apellido: this.apellido.trim(),
          email: this.email.trim(),
          password: this.password.trim(), // Agregamos la contraseña para uso offline
          emailVerified: false,
        };

        // Guardar el usuario en Firestore
        await this.authService.saveUserData(nuevoUsuario);
        console.log('Usuario registrado y guardado en Firestore:', nuevoUsuario);

        // Guardar el usuario en Ionic Storage para uso offline
        await this.storageService.setItem('user', nuevoUsuario);
        console.log('Usuario guardado en Ionic Storage:', nuevoUsuario);

        // Mensaje de éxito
        this.presentToast('Registro exitoso. Por favor revisa tu correo para verificar tu cuenta.');

        // Redirigir a la página de inicio de sesión
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al registrar el usuario:', error);
        this.presentToast('Hubo un error al registrar el usuario. Inténtalo nuevamente.');
      }
    } else {
      this.presentToast('Por favor completa todos los campos correctamente.');
    }
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service'; // Importar el servicio de Storage

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage {

  nombre: string = '';
  apellido: string = '';
  username: string = '';
  password: string = '';
  canProceed: boolean = false;
  nombreError: string = '';
  apellidoError: string = '';
  usernameError: string = '';
  passwordError: string = '';

  constructor(private storageService: StorageService, private router: Router) {}

  // Validar todos los campos
  Validar() {
    this.nombreError = this.nombre.length >= 5 ? '' : 'El nombre debe tener al menos 5 caracteres.';
    this.apellidoError = this.apellido.length >= 5 ? '' : 'El apellido debe tener al menos 5 caracteres.';
    this.usernameError = this.username.length >= 3 ? '' : 'El nombre de usuario debe tener al menos 3 caracteres.';
    this.passwordError = this.password.length >= 8 ? '' : 'La contraseña debe tener al menos 8 caracteres.';

    this.canProceed = !this.nombreError && !this.apellidoError && !this.usernameError && !this.passwordError;
  }
  
  async presentToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    document.body.appendChild(toast);
    return toast.present();
  }

  // Registrar el usuario
  async registrarUsuario() {
    if (this.canProceed) {
      const nuevoUsuario = {
        nombre: this.nombre.trim(),
        apellido: this.apellido.trim(),
        username: this.username.trim(),  // Aseguramos que no haya espacios en blanco al principio/final
        password: this.password.trim()  // Aseguramos que no haya espacios en blanco al principio/final
      };

      // Obtener la lista de usuarios existente desde Ionic Storage
      let usuarios = await this.storageService.getItem('usuarios') || [];

      // Comprobar si el usuario ya existe
      const usuarioExistente = usuarios.find((user: any) => user.username === this.username);
      if (usuarioExistente) {
        console.log('El usuario ya está registrado.');
        this.presentToast('El usuario ya está registrado.');
        return;
      }

      // Agregar el nuevo usuario a la lista
      usuarios.push(nuevoUsuario);

      // Guardar la lista de usuarios actualizada en Ionic Storage
      await this.storageService.setItem('usuarios', usuarios);

      console.log('Usuario registrado:', nuevoUsuario);

      // Navegar a la página de inicio de sesión
      this.router.navigate(['/home']);
    } else {
      console.log('Por favor completa todos los campos correctamente.');
    }
  }

}
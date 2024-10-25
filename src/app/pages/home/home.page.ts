import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  usr = {
    username: '',
    password: ''
  };

  constructor(private storageService: StorageService, private router: Router) {}

  async onSubmit() {
    // Obtener la lista de usuarios guardados en Storage
    const usuarios = await this.storageService.getItem('usuarios') || [];

    if (usuarios.length > 0) {
      // Validar credenciales con el username y la contraseña ingresados
      const usernameIngresado = this.usr.username.trim();
      const passwordIngresado = this.usr.password.trim();

      // Buscar un usuario que coincida con las credenciales ingresadas
      const usuarioEncontrado = usuarios.find((user: any) => 
        user.username === usernameIngresado && user.password === passwordIngresado
      );

      if (usuarioEncontrado) {
        console.log('Inicio de sesión exitoso');
        
        // Guardar el usuario actual en el storage (opcional, para usarlo en otras páginas)
        await this.storageService.setItem('usuario_actual', usuarioEncontrado);

        // Redirigir a la página de selección de rol
        this.router.navigate(['/role-selection']);
      } else {
        console.log('Credenciales incorrectas');
      }
    } else {
      console.log('No hay usuarios registrados');
    }
  }
}
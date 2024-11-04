import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.page.html',
  styleUrls: ['./recuperar.page.scss'],
})
export class RecuperarPage {
  email: string = '';

  constructor(private afAuth: AngularFireAuth, private alertController: AlertController) {}

  async recuperarPassword() {
    if (!this.email) {
      this.presentAlert('Error', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }

    try {
      await this.afAuth.sendPasswordResetEmail(this.email);
      this.presentAlert('Éxito', 'Se ha enviado un correo para restablecer la contraseña.');
    } catch (error) {
      this.presentAlert('Error', 'No se pudo enviar el correo. Verifica tu dirección de correo.');
      console.error('Error enviando correo de recuperación:', error);
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }
}

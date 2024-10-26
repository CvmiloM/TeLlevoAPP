import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore) {}

  // Registrar usuario con correo electrónico
  async register(email: string, password: string) {
    try {
      const credenciales = await this.afAuth.createUserWithEmailAndPassword(email, password);
      
      // Enviar el correo de verificación
      if (credenciales.user) {
        await credenciales.user.sendEmailVerification();
      }

      return credenciales;
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      throw error;
    }
  }

  // Guardar datos de usuario en Firestore
  async saveUserData(user: any) {
    try {
      // Asegúrate de que estás usando el UID para guardar el documento del usuario en Firestore
      return await this.firestore.collection('users').doc(user.uid).set(user);
    } catch (error) {
      console.error('Error al guardar datos del usuario en Firestore:', error);
      throw error;
    }
  }

  // Iniciar sesión con correo electrónico
  async login(email: string, password: string) {
    try {
      const credenciales = await this.afAuth.signInWithEmailAndPassword(email, password);

      // Verificar si el correo ha sido verificado
      if (credenciales.user?.emailVerified) {
        return credenciales;
      } else {
        throw new Error('Correo no verificado. Por favor, verifica tu correo antes de iniciar sesión.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      await this.afAuth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }
}

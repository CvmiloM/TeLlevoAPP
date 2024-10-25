import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private firestore: AngularFirestore) {}

  // Registrar un nuevo usuario
  async register(username: string, password: string) {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(`${username}@example.com`, password);  // Usar username como parte del email ficticio

      // Guardar el username en Firestore
      await this.firestore.collection('users').doc(result.user?.uid).set({
        username: username
      });

      return result;
    } catch (error) {
      console.error('Error al registrar el usuario:', error);
      throw error;
    }
  }

  // Iniciar sesión con username
  async login(username: string, password: string) {
    try {
      // Usa un email ficticio basado en el username
      const result = await this.afAuth.signInWithEmailAndPassword(`${username}@example.com`, password);
      return result;
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

  // Obtener el estado de autenticación del usuario
  getAuthState() {
    return this.afAuth.authState;
  }
}

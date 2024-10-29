import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {
  userId: string | null = null;
  viajes: any[] = [];

  constructor(private db: AngularFireDatabase, private afAuth: AngularFireAuth) {}

  ngOnInit() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.loadHistorialViajes();
      }
    });
  }

  loadHistorialViajes() {
    if (this.userId) {
      this.db.list(`usuarios/${this.userId}/viajes`).snapshotChanges().subscribe(actions => {
        this.viajes = actions.map(action => ({
          key: action.key,
          ...(action.payload.val() as object)
        }));
      });
    }
  }

  async eliminarViaje(viajeId: string) {
    if (this.userId) {
      await this.db.object(`usuarios/${this.userId}/viajes/${viajeId}`).remove();
    }
  }
}

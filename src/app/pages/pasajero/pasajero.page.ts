import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Subscription } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-pasajero',
  templateUrl: './pasajero.page.html',
  styleUrls: ['./pasajero.page.scss'],
})
export class PasajeroPage implements OnInit, OnDestroy {
  viajes: any[] = []; // Arreglo para almacenar los viajes
  viajesSubscription: Subscription | undefined;
  viajeId: string = ''; // ID del viaje que el pasajero acepta

  constructor(private db: AngularFireDatabase) {}

  ngOnInit() {
    // Escuchar los cambios en la base de datos de "viajes"
    this.viajesSubscription = this.db
      .list('viajes', ref => ref.orderByChild('estado').equalTo('activo'))
      .valueChanges()
      .subscribe((data: any[]) => {
        this.viajes = data;
        console.log('Viajes actualizados:', this.viajes);
      });
  }

  ngOnDestroy() {
    // Cancelar la suscripción cuando el componente se destruya para evitar fugas de memoria
    if (this.viajesSubscription) {
      this.viajesSubscription.unsubscribe();
    }
  }

  async aceptarViaje(viaje: any) {
    this.viajeId = viaje.id;
    const posicion = await Geolocation.getCurrentPosition();
    const ubicacionPasajero = [posicion.coords.longitude, posicion.coords.latitude];

    this.db.object(`viajes/${this.viajeId}/ubicacionPasajero`).set(ubicacionPasajero);
    this.db.object(`viajes/${this.viajeId}/asientosDisponibles`).query.ref.transaction(asientosDisponibles => {
      return asientosDisponibles > 0 ? asientosDisponibles - 1 : 0;
    });

    console.log('Viaje aceptado:', viaje);
  }
}

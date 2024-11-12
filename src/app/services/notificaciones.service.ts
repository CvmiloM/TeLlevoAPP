import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  constructor(private db: AngularFireDatabase) {}

  // Notificación para el conductor cuando un pasajero acepta el viaje
  async notificarConductorPasajeroAceptaViaje(viajeId: string, conductorId: string, pasajeroEmail: string) {
    const mensaje = `${pasajeroEmail} ha aceptado tu viaje.`;
    await this.db.list(`usuarios/${conductorId}/notificaciones`).push({
      viajeId,
      mensaje,
      tipo: 'aceptado',
      timestamp: Date.now()
    });
  }

  // Notificación para el conductor cuando un pasajero cancela el viaje
  async notificarConductorPasajeroCancelaViaje(viajeId: string, conductorId: string, pasajeroEmail: string) {
    const mensaje = `${pasajeroEmail} ha cancelado su participación en el viaje.`;
    await this.db.list(`usuarios/${conductorId}/notificaciones`).push({
      viajeId,
      mensaje,
      tipo: 'cancelado_pasajero',
      timestamp: Date.now()
    });
  }
}

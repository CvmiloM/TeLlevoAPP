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
    const mensaje = `${pasajeroEmail} ha cancelado su participación en tu viaje.`;
    await this.db.list(`usuarios/${conductorId}/notificaciones`).push({
      viajeId,
      mensaje,
      tipo: 'cancelado_pasajero',
      timestamp: Date.now()
    });
  }

  // Notificación para el pasajero cuando el conductor cancela el viaje
  async notificarPasajeroConductorCancelaViaje(viajeId: string, pasajeroId: string, conductorEmail: string) {
    const mensaje = `El conductor ${conductorEmail} ha cancelado el viaje.`;
    await this.db.list(`usuarios/${pasajeroId}/notificaciones`).push({
      viajeId,
      mensaje,
      tipo: 'cancelado_conductor',
      timestamp: Date.now()
    });
  }

  // Notificación para el pasajero cuando el conductor pone en marcha el viaje
  async notificarPasajeroConductorEnMarcha(viajeId: string, pasajeroId: string, conductorEmail: string) {
    const mensaje = `El conductor ${conductorEmail} ha puesto en marcha el viaje.`;
    await this.db.list(`usuarios/${pasajeroId}/notificaciones`).push({
      viajeId,
      mensaje,
      tipo: 'en_marcha',
      timestamp: Date.now()
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.page.html',
  styleUrls: ['./role-selection.page.scss'],
})
export class RoleSelectionPage implements OnInit {
  userEmail: string | null = null;
  userId: string | null = null;
  map!: mapboxgl.Map;
  viajeActivo: any = null;
  conductorMarker: mapboxgl.Marker | null = null;
  nuevasNotificaciones: boolean = false; // Bandera para el punto rojo

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private notificacionesService: NotificacionesService
  ) {}

  async ngOnInit() {
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.userEmail = user.email;
        this.userId = user.uid;
        await this.verificarViajeActivo(this.userId);
        this.verificarNotificaciones();
      } else {
        this.userEmail = 'Usuario';
      }
    });
  }

  async verificarViajeActivo(userId: string) {
    const viajeActivoRef = this.db.object(`usuarios/${userId}/viajeActivo`);
    viajeActivoRef.valueChanges().subscribe((viaje: any) => {
      this.viajeActivo = viaje;
      if (viaje && viaje.ruta) {
        this.inicializarMapa(viaje.ruta);
      }
    });
  }

  verificarNotificaciones() {
    if (this.userId) {
      this.db.list(`usuarios/${this.userId}/notificaciones`)
        .valueChanges()
        .subscribe((notificaciones: any[]) => {
          this.nuevasNotificaciones = notificaciones && notificaciones.length > 0;
        });
    }
  }

  inicializarMapa(rutaCoordenadas: [number, number][]) {
    (mapboxgl as any).accessToken = environment.accessToken;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: rutaCoordenadas[0],
      zoom: 14,
    });

    this.map.on('load', () => {
      this.map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: rutaCoordenadas,
          },
          properties: {},
        },
      });

      this.map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#1DB954',
          'line-width': 4,
        },
      });
    });
  }

  async cancelarViaje() {
    if (this.viajeActivo) {
      const viajeId = this.viajeActivo.viajeId;
      const conductorId = this.viajeActivo.conductorId;

      const pasajerosRef = this.db.list(`viajes/${viajeId}/pasajeros`);
      let pasajeroEliminado = false;

      await pasajerosRef.query.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const pasajeroData = childSnapshot.val();
          if (pasajeroData.email === this.userEmail) {
            pasajerosRef.remove(childSnapshot.key!);
            pasajeroEliminado = true;
            return true;
          }
          return false;
        });
      });

      if (pasajeroEliminado) {
        const viajeRef = this.db.object(`viajes/${viajeId}`);
        const pasajerosSnapshot = await pasajerosRef.query.once('value');
        const numeroPasajerosActual = pasajerosSnapshot.numChildren();
        const asientosTotales = this.viajeActivo.asientos;

        await viajeRef.update({
          asientosDisponibles: asientosTotales - numeroPasajerosActual,
        });
      }

      await this.notificacionesService.notificarConductorPasajeroCancelaViaje(viajeId, conductorId, this.userEmail!);

      const userId = (await this.afAuth.currentUser)?.uid;
      if (userId) {
        await this.db.object(`usuarios/${userId}/viajeActivo`).remove();
      }

      this.viajeActivo = null;
      alert('El viaje ha sido cancelado y el asiento está nuevamente disponible.');
    }
  }

  selectConductor() {
    this.router.navigate(['/conductor']);
  }

  selectPasajero() {
    if (this.viajeActivo) {
      alert('Ya tienes un viaje activo. Cancélalo para poder seleccionar otro.');
    } else {
      this.router.navigate(['/pasajero']);
    }
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  goToNotificaciones() {
    this.router.navigate(['/notificaciones']);
    this.nuevasNotificaciones = false; // Reiniciar bandera al visitar notificaciones
  }

  recargarMapa() {
    if (this.viajeActivo && this.viajeActivo.ruta) {
      this.inicializarMapa(this.viajeActivo.ruta);
    }
  }
}

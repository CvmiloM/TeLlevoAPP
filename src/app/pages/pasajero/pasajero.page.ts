import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { Geolocation } from '@capacitor/geolocation';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
  selector: 'app-pasajero',
  templateUrl: './pasajero.page.html',
  styleUrls: ['./pasajero.page.scss'],
})
export class PasajeroPage implements OnInit, OnDestroy {
  viajes: any[] = [];
  viajesSubscription: Subscription | undefined;
  viajeActivoSubscription: Subscription | undefined;
  map!: mapboxgl.Map;
  selectedViaje: any = null;
  userEmail: string | null = null;
  userId: string | null = null;

  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth,
    private storage: Storage,
    private toastController: ToastController,
    private router: Router,
    private notificacionesService: NotificacionesService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userEmail = user.email;
        this.userId = user.uid;
        this.verificarViajeActivo();
      }
    });

    const viajeGuardado = await this.storage.get('viaje_activo');
    if (viajeGuardado) {
      this.selectedViaje = viajeGuardado;
      this.mostrarRutaEnMapa(this.selectedViaje.ruta);
    } else {
      this.escucharViajes();
    }
  }

  ngOnDestroy() {
    if (this.viajesSubscription) {
      this.viajesSubscription.unsubscribe();
    }
    if (this.viajeActivoSubscription) {
      this.viajeActivoSubscription.unsubscribe();
    }
  }

  verificarViajeActivo() {
    if (this.userId) {
      this.viajeActivoSubscription = this.db
        .object(`usuarios/${this.userId}/viajeActivo`)
        .valueChanges()
        .subscribe((viajeActivo) => {
          if (!viajeActivo && this.selectedViaje) {
            this.selectedViaje = null;
            this.storage.remove('viaje_activo');
            this.mostrarToast('Tu participación en el viaje ha sido cancelada.');
            this.router.navigate(['/role-selection']);
          }
        });
    }
  }

  escucharViajes() {
    this.viajesSubscription = this.db
      .list('viajes')
      .snapshotChanges()
      .subscribe((data) => {
        this.viajes = data
          .map((action) => ({ key: action.key, ...action.payload.val() as any }))
          .filter((viaje) => viaje.asientosDisponibles > 0 && viaje.estado !== 'cancelado' && viaje.estado !== 'en curso');
        console.log('Viajes actualizados:', this.viajes);
      });
  }

  seleccionarViaje(viaje: any) {
    this.selectedViaje = viaje;
    this.mostrarRutaEnMapa(this.selectedViaje.ruta);
  }

  async aceptarViaje(viaje: any) {
    if (this.userEmail) {
      const position = await Geolocation.getCurrentPosition();
      const ubicacionPasajero = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const nuevosAsientos = viaje.asientosDisponibles - 1;
      const pasajerosRef = this.db.list(`viajes/${viaje.key}/pasajeros`);
      pasajerosRef.push({ email: this.userEmail, ubicacion: ubicacionPasajero });

      this.db.object(`viajes/${viaje.key}`).update({
        asientosDisponibles: nuevosAsientos,
      });

      const userId = (await this.afAuth.currentUser)?.uid;
      if (userId) {
        await this.db.object(`usuarios/${userId}/viajeActivo`).set({
          ...viaje,
          viajeId: viaje.key,
          ubicacionPasajero,
        });
      }

      await this.storage.set('viaje_activo', { ...viaje, ubicacionPasajero });

      const conductorId = viaje.conductorId;
      await this.notificacionesService.notificarConductorPasajeroAceptaViaje(
        viaje.key,
        conductorId,
        this.userEmail!
      );

      this.router.navigate(['/role-selection']);
    }
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });
    toast.present();
  }

  mostrarRutaEnMapa(rutaCoordenadas: [number, number][]) {
    (mapboxgl as any).accessToken = environment.accessToken;

    this.map = new mapboxgl.Map({
      container: 'mapa-viaje',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.selectedViaje.ubicacionInicial,
      zoom: 12,
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
}

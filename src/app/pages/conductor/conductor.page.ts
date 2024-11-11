import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { AlertController, MenuController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
  selector: 'app-conductor',
  templateUrl: './conductor.page.html',
  styleUrls: ['./conductor.page.scss'],
})
export class ConductorPage implements OnInit {
  pasajeros: any[] = [];
  viajeActivo: any = null;
  userId: string | null = null;
  map!: mapboxgl.Map;
  userEmail: string | null = null;
  passengerMarkers: { [email: string]: mapboxgl.Marker } = {};
  notificacionesConductor: any[] = []; // Para almacenar las notificaciones filtradas

  constructor(
    private db: AngularFireDatabase,
    private storage: Storage,
    private router: Router,
    private alertController: AlertController,
    private afAuth: AngularFireAuth,
    private notificacionesService: NotificacionesService,
    private menuController: MenuController // Agregar controlador de menú
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.userEmail = user.email;
        this.cargarViajes();
        this.cargarNotificacionesConductor(); // Cargar notificaciones filtradas para el conductor
      }
    });
  }

  // Método para cargar notificaciones filtradas para el conductor
  cargarNotificacionesConductor() {
    if (this.userId) {
      this.db.list(`usuarios/${this.userId}/notificaciones`)
        .valueChanges()
        .subscribe((notificaciones: any[]) => {
          this.notificacionesConductor = notificaciones.filter(
            (notificacion) => 
              notificacion.tipo === 'aceptado' || notificacion.tipo === 'cancelado_pasajero'
          );
        });
    }
  }

  // Método para abrir el menú de notificaciones
  abrirMenuNotificaciones() {
    this.menuController.enable(true, 'notificacionesMenu'); // Habilita el menú de notificaciones
    this.menuController.open('notificacionesMenu'); // Abre el menú de notificaciones
  }

  async cargarViajes() {
    this.db.list('viajes').valueChanges().subscribe((viajes: any[]) => {
      this.viajeActivo = viajes.find((viaje) => viaje.conductorId === this.userId && viaje.estado === 'activo');
      if (this.viajeActivo) {
        this.cargarPasajeros();
      }
    });
  }

  async cargarPasajeros() {
    if (this.viajeActivo) {
      this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).snapshotChanges().subscribe((pasajerosSnapshot: any[]) => {
        this.pasajeros = pasajerosSnapshot.map((action) => ({ id: action.key, ...action.payload.val() }));
      });
    }
  }

  visualizarMapa() {
    if (this.viajeActivo) {
      this.inicializarMapa(this.viajeActivo.ruta);
    }
  }

  async inicializarMapa(rutaCoordenadas: [number, number][]) {
    (mapboxgl as any).accessToken = environment.accessToken;

    this.map = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.viajeActivo.ubicacionInicial,
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

      this.agregarMarcadoresPasajeros();
    });
  }

  agregarMarcadoresPasajeros() {
    Object.values(this.passengerMarkers).forEach((marker) => marker.remove());
    this.passengerMarkers = {};

    this.pasajeros.forEach((pasajero) => {
      const { email, ubicacion } = pasajero;
      if (ubicacion) {
        const marker = new mapboxgl.Marker()
          .setLngLat([ubicacion.lng, ubicacion.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="background-color: #333; color: #fff; padding: 5px; border-radius: 5px; font-size: 14px;">
                 Pasajero: ${email}
               </div>`
            )
          )
          .addTo(this.map);

        this.passengerMarkers[email] = marker;
      }
    });
  }

  async cancelarViaje() {
    if (this.viajeActivo) {
      await this.db.object(`viajes/${this.viajeActivo.id}`).update({ estado: 'cancelado' });
      await this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).remove();

      // Notificar a cada pasajero que el viaje ha sido cancelado
      for (let pasajero of this.pasajeros) {
        if (this.userEmail) {
          await this.notificacionesService.notificarPasajeroConductorCancelaViaje(
            this.viajeActivo.id,
            pasajero.id,
            this.userEmail
          );
        }
      }

      this.viajeActivo = null;
      this.pasajeros = [];
      this.presentAlert('Viaje cancelado', 'El viaje ha sido cancelado exitosamente.');
    }
  }

  async marcarComoEnCurso() {
    if (this.viajeActivo) {
      await this.db.object(`viajes/${this.viajeActivo.id}`).update({ estado: 'en curso' });

      // Notificar a cada pasajero que el viaje está en marcha
      for (let pasajero of this.pasajeros) {
        if (this.userEmail) {
          await this.notificacionesService.notificarPasajeroConductorEnMarcha(
            this.viajeActivo.id,
            pasajero.id,
            this.userEmail
          );
        }
      }

      this.presentAlert('Viaje en curso', 'El viaje ha sido marcado como en curso.');
    }
  }

  async crearViaje() {
    if (this.viajeActivo) {
      await this.presentAlert('No puedes crear un viaje', 'No puedes crear un nuevo viaje mientras tienes uno activo.');
    } else {
      this.router.navigate(['/crear-viaje']);
    }
  }

  presentAlert(header: string, message: string) {
    this.alertController
      .create({
        header,
        message,
        buttons: ['OK'],
      })
      .then((alert) => alert.present());
  }
}

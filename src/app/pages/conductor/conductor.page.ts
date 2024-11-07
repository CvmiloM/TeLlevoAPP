import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-conductor',
  templateUrl: './conductor.page.html',
  styleUrls: ['./conductor.page.scss'],
})
export class ConductorPage implements OnInit {
  pasajeros: any[] = [];
  viajeActivo: any = null;
  userId: string | null = null;
  map!: mapboxgl.Map; // Mapa principal de la ruta del viaje
  mapaPasajeros!: mapboxgl.Map; // Mapa dedicado para los pasajeros
  passengerMarkers: { [email: string]: mapboxgl.Marker } = {}; // Almacenar marcadores de pasajeros por email

  constructor(
    private db: AngularFireDatabase,
    private storage: Storage,
    private router: Router,
    private alertController: AlertController,
    private afAuth: AngularFireAuth
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.cargarViajes();
      }
    });
  }

  async cargarViajes() {
    this.db.list('viajes').valueChanges().subscribe((viajes: any[]) => {
      this.viajeActivo = viajes.find((viaje) => viaje.conductorId === this.userId && viaje.estado === 'activo');
      if (this.viajeActivo) {
        this.dibujarRuta(this.viajeActivo.ruta);
        this.cargarPasajeros(); // Cargar los pasajeros en tiempo real
      }
    });
  }

  async cargarPasajeros() {
    if (this.viajeActivo) {
      this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).valueChanges().subscribe((pasajeros: any[]) => {
        this.pasajeros = pasajeros || [];
        this.actualizarMapaPasajeros(); // Actualizar el mapa de pasajeros en tiempo real
      });
    }
  }

  async dibujarRuta(rutaCoordenadas: [number, number][]) {
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
    });
  }

  async inicializarMapaPasajeros() {
    (mapboxgl as any).accessToken = environment.accessToken;

    this.mapaPasajeros = new mapboxgl.Map({
      container: 'mapa-pasajero',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [this.viajeActivo.ubicacionInicial[0], this.viajeActivo.ubicacionInicial[1]],
      zoom: 12,
    });
  }

  visualizarMapaPasajeros() {
    if (this.pasajeros.length > 0) {
        // Inicializa el mapa solo si aún no existe
        if (!this.mapaPasajeros) {
            this.inicializarMapaPasajeros();
        }

        // Limpia marcadores anteriores
        Object.values(this.passengerMarkers).forEach(marker => marker.remove());
        this.passengerMarkers = {}; 

        // Agrega marcadores de cada pasajero en tiempo real
        this.pasajeros.forEach(pasajero => {
            const { email, ubicacion } = pasajero;
            if (ubicacion) {
                const marker = new mapboxgl.Marker()
                    .setLngLat([ubicacion.lng, ubicacion.lat])
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25 })
                        .setHTML(
                          `<div style="background-color: #333; color: #fff; padding: 5px; border-radius: 5px; font-size: 14px;">
                             Pasajero: ${email}
                           </div>`
                        )
                    )
                    .addTo(this.mapaPasajeros);

                // Guardar el marcador para futuras actualizaciones o eliminación
                this.passengerMarkers[email] = marker;
            }
        });
    } else {
        this.presentAlert('No hay pasajeros', 'No hay pasajeros aceptados para mostrar en el mapa.');
    }
  }

  actualizarMapaPasajeros() {
    if (!this.mapaPasajeros) {
      this.inicializarMapaPasajeros();
    }

    // Eliminar los marcadores existentes de pasajeros antes de agregar los nuevos
    Object.values(this.passengerMarkers).forEach(marker => marker.remove());
    this.passengerMarkers = {};

    // Agregar nuevos marcadores para cada pasajero con un popup para el correo electrónico
    this.pasajeros.forEach(pasajero => {
      const { email, ubicacion } = pasajero;
      if (ubicacion) {
        const marker = new mapboxgl.Marker()
          .setLngLat([ubicacion.lng, ubicacion.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(
                `<div style="background-color: #333; color: #fff; padding: 5px; border-radius: 5px; font-size: 14px;">
                   Pasajero: ${email}
                 </div>`
              )
          )
          .addTo(this.mapaPasajeros);

        // Guardar el marcador para futuras actualizaciones o eliminación
        this.passengerMarkers[email] = marker;
      }
    });
  }

  async cancelarViaje() {
    if (this.viajeActivo) {
      await this.db.object(`viajes/${this.viajeActivo.id}`).update({ estado: 'cancelado' });
      await this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).remove();
      this.viajeActivo = null;
      this.presentAlert('Viaje cancelado', 'El viaje ha sido cancelado exitosamente.');
    }
  }

  marcarComoEnCurso() {
    if (this.viajeActivo) {
      this.db.object(`viajes/${this.viajeActivo.id}`).update({ estado: 'en curso' });
      this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).remove();
      this.presentAlert('Viaje en curso', 'El viaje ha sido marcado como en curso.');
      this.viajeActivo = null;
    }
  }

  visualizarMapa() {
    if (this.viajeActivo) {
      this.dibujarRuta(this.viajeActivo.ruta);
    }
  }

  presentAlert(header: string, message: string) {
    this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    }).then(alert => alert.present());
  }

  crearViaje() {
    if (!this.viajeActivo) {
      this.router.navigate(['/crear-viaje']);
    } else {
      this.presentAlert('Viaje en curso', 'No puedes crear un nuevo viaje mientras tengas uno activo.');
    }
  }

  verHistorial() {
    this.router.navigate(['/historial']);
  }
}

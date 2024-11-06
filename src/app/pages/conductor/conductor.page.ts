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
  viajeActivo: any = null; // Almacena el viaje activo del conductor
  userId: string | null = null;
  map!: mapboxgl.Map;
  markers: { [email: string]: mapboxgl.Marker } = {}; // Almacenar marcadores por email

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
      console.log('Viaje activo:', this.viajeActivo);
      if (this.viajeActivo) {
        this.dibujarRuta(this.viajeActivo.ruta);
        this.cargarPasajeros(); // Cargar los pasajeros que aceptaron el viaje activo
      }
    });
  }

  async cargarPasajeros() {
    if (this.viajeActivo) {
      this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).valueChanges().subscribe((pasajeros: any[]) => {
        this.pasajeros = pasajeros || []; // Asegurarse de que no sea undefined
        console.log('Pasajeros cargados:', this.pasajeros);
        this.mostrarUbicacionesPasajeros(); // Mostrar ubicaciones de los pasajeros en el mapa
      });
    }
  }

  async dibujarRuta(rutaCoordenadas: [number, number][]) {
    (mapboxgl as any).accessToken = environment.accessToken;

    this.map = new mapboxgl.Map({
      container: 'mapa', // ID del contenedor en el HTML
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
          properties: {}, // Asegurarse de incluir properties vacíos
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

  visualizarMapaPasajeros() {
    if (this.pasajeros.length > 0) {
      // Tomar la ubicación del primer pasajero y asegurarse de que sea del tipo correcto
      const primeraUbicacion = this.pasajeros[0].ubicacion;
      const centro: [number, number] = [primeraUbicacion.lng, primeraUbicacion.lat]; // Asegurarse de que sea un array de tipo [number, number]
      
      // Crear un mapa para mostrar la ubicación de los pasajeros
      this.map = new mapboxgl.Map({
        container: 'mapa-pasajero', // ID del contenedor en el HTML
        style: 'mapbox://styles/mapbox/streets-v11',
        center: centro,
        zoom: 12,
      });
  
      this.pasajeros.forEach(pasajero => {
        // Agregar un marcador para cada pasajero
        new mapboxgl.Marker()
          .setLngLat([pasajero.ubicacion.lng, pasajero.ubicacion.lat])
          .addTo(this.map);
      });
    } else {
      this.presentAlert('No hay pasajeros', 'No hay pasajeros aceptados para mostrar en el mapa.');
    }
  }

  mostrarUbicacionesPasajeros() {
    if (this.map) {
      // Limpiar los marcadores del mapa antes de agregar nuevos
      Object.values(this.markers).forEach(marker => marker.remove());
      this.markers = {}; // Reiniciar el objeto de marcadores

      // Iterar sobre los pasajeros y mostrar su ubicación en el mapa
      this.pasajeros.forEach(pasajero => {
        const { ubicacion } = pasajero;
        if (ubicacion) {
          // Agregar un marcador para la ubicación del pasajero
          const marker = new mapboxgl.Marker()
            .setLngLat([ubicacion.lng, ubicacion.lat])
            .addTo(this.map);
          
          // Almacenar el marcador en el objeto
          this.markers[pasajero.email] = marker; 

          // Centrar el mapa en la ubicación del pasajero
          this.map.setCenter([ubicacion.lng, ubicacion.lat]);
        }
      });
    }
  }

  async cancelarViaje() {
    if (this.viajeActivo) {
      // Cancelar el viaje en Firebase
      await this.db.object(`viajes/${this.viajeActivo.id}`).update({ estado: 'cancelado' });

      // Eliminar los pasajeros asociados a este viaje
      await this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).remove(); // Eliminar pasajeros asociados

      this.viajeActivo = null; // Limpiar viaje activo
      this.presentAlert('Viaje cancelado', 'El viaje ha sido cancelado exitosamente.');
    }
  }

  marcarComoEnCurso() {
    if (this.viajeActivo) {
      // Actualizar el estado del viaje a 'en curso'
      this.db.object(`viajes/${this.viajeActivo.id}`).update({ estado: 'en curso' });

      // Eliminar los pasajeros asociados a este viaje
      this.db.list(`viajes/${this.viajeActivo.id}/pasajeros`).remove(); 

      this.presentAlert('Viaje en curso', 'El viaje ha sido marcado como en curso.');
      this.viajeActivo = null; // Limpiar viaje activo
    }
  }

  visualizarMapa() {
    if (this.viajeActivo) {
      // Aquí puedes mostrar el mapa o ejecutar la lógica necesaria para mostrarlo
      this.dibujarRuta(this.viajeActivo.ruta); // Por ejemplo, redibujar la ruta
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

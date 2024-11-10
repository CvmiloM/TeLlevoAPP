import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.page.html',
  styleUrls: ['./role-selection.page.scss'],
})
export class RoleSelectionPage implements OnInit {
  userEmail: string | null = null;
  map!: mapboxgl.Map;
  viajeActivo: any = null;  // Guarda el viaje activo del pasajero
  conductorMarker: mapboxgl.Marker | null = null;

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase
  ) {}

  async ngOnInit() {
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.userEmail = user.email;
        const userId = user.uid;
        await this.verificarViajeActivo(userId); // Llamada a verificar el viaje activo
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
        // Cargar el mapa y la ruta del viaje aceptado
        this.inicializarMapa(viaje.ruta);
      }
    });
  }

  inicializarMapa(rutaCoordenadas: [number, number][]) {
    (mapboxgl as any).accessToken = environment.accessToken;
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: rutaCoordenadas[0], // Centrar en el primer punto de la ruta
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
  
      // Incrementar el número de asientos disponibles en Firebase
      const viajeRef = this.db.object(`viajes/${viajeId}`);
      await viajeRef.update({
        asientosDisponibles: this.viajeActivo.asientosDisponibles + 1,
      });
  
      // Buscar y eliminar al pasajero de la lista de pasajeros usando el email
      const pasajerosRef = this.db.list(`viajes/${viajeId}/pasajeros`);
      pasajerosRef.query.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const pasajeroData = childSnapshot.val();
          if (pasajeroData.email === this.userEmail) {
            pasajerosRef.remove(childSnapshot.key!); // Eliminar usando el key encontrado
            return true; // Romper el bucle al encontrar el pasajero
          }
          return false;
        });
      });
  
      // Eliminar el viaje activo del perfil del usuario en Firebase
      const userId = (await this.afAuth.currentUser)?.uid;
      if (userId) {
        await this.db.object(`usuarios/${userId}/viajeActivo`).remove();
      }
  
      this.viajeActivo = null; // Limpiar el viaje activo en la UI
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

  recargarMapa() {
    if (this.viajeActivo && this.viajeActivo.ruta) {
      this.inicializarMapa(this.viajeActivo.ruta);
    }
  }
}

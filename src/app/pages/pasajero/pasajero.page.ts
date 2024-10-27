import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Subscription } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pasajero',
  templateUrl: './pasajero.page.html',
  styleUrls: ['./pasajero.page.scss'],
})
export class PasajeroPage implements OnInit, OnDestroy {
  viajes: any[] = []; // Arreglo para almacenar los viajes
  viajesSubscription: Subscription | undefined;
  map!: mapboxgl.Map;
  selectedViaje: any = null;

  constructor(private db: AngularFireDatabase) {}

  ngOnInit() {
    // Escuchar los cambios en la base de datos de "viajes"
    this.viajesSubscription = this.db.list('viajes').valueChanges().subscribe((data: any[]) => {
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

  seleccionarViaje(viaje: any) {
    this.selectedViaje = viaje;
    this.mostrarRutaEnMapa(this.selectedViaje.ruta);
    console.log('Viaje seleccionado:', viaje);
  }

  mostrarRutaEnMapa(rutaCoordenadas: [number, number][]) {
    // Configurar el token de acceso de Mapbox
    (mapboxgl as any).accessToken = environment.accessToken;

    // Inicializar el mapa
    this.map = new mapboxgl.Map({
      container: 'mapa-viaje', // ID del contenedor en el HTML
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.selectedViaje.ubicacionInicial,
      zoom: 12,
    });

    // Agregar la fuente de la ruta y la capa al mapa
    this.map.on('load', () => {
      this.map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: rutaCoordenadas,
          },
          properties: {}, // Se añade un objeto vacío para cumplir con el tipo
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

import { Component, OnInit, OnDestroy } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from '../../../environments/environment';
import { AngularFireDatabase } from '@angular/fire/compat/database';

@Component({
  selector: 'app-crear-viaje',
  templateUrl: './crear-viaje.page.html',
  styleUrls: ['./crear-viaje.page.scss'],
})
export class CrearViajePage implements OnInit, OnDestroy {
  map!: mapboxgl.Map;
  destino: string = '';
  descripcion: string = '';
  asientos: number | null = null;
  costo: number | null = null;
  ubicacionInicial: [number, number] = [-74.5, 40];
  destinoCoords: [number, number] | null = null;
  suggestions: any[] = [];
  viajeId: string = '';
  conductorId: string = 'conductor-123'; // ID de ejemplo para el conductor

  constructor(private db: AngularFireDatabase) {}

  async ngOnInit() {
    (mapboxgl as any).accessToken = environment.accessToken;

    const posicion = await Geolocation.getCurrentPosition();
    this.ubicacionInicial = [posicion.coords.longitude, posicion.coords.latitude];

    this.map = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.ubicacionInicial,
      zoom: 12,
    });

    new mapboxgl.Marker()
      .setLngLat(this.ubicacionInicial)
      .addTo(this.map);
  }

  ngOnDestroy() {
    this.map.remove();
  }

  buscarDestino() {
    if (this.destino.length > 2) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.destino}.json?access_token=${environment.accessToken}&autocomplete=true&limit=5`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          this.suggestions = data.features.map((feature: any) => ({
            place_name: feature.place_name,
            coordinates: feature.geometry.coordinates
          }));
        })
        .catch(error => console.error('Error al buscar destino:', error));
    } else {
      this.suggestions = [];
    }
  }

  seleccionarDestino(coordinates: [number, number]) {
    this.destinoCoords = coordinates;
    this.suggestions = [];
    this.dibujarRuta(this.destinoCoords);
  }

  async dibujarRuta(destinoCoords: [number, number]): Promise<[number, number][]> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${this.ubicacionInicial.join(',')};${destinoCoords.join(',')}?geometries=geojson&access_token=${environment.accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const route = data.routes[0].geometry.coordinates;

      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
        properties: {}
      } as GeoJSON.Feature;

      if (this.map.getSource('route')) {
        (this.map.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        this.map.addSource('route', {
          type: 'geojson',
          data: geojson
        });

        this.map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#1DB954',
            'line-width': 5
          }
        });
      }

      return route;
    } catch (error) {
      console.error('Error al dibujar la ruta:', error);
      return [];
    }
  }

  isComplete(): boolean {
    return this.destino !== '' && this.descripcion !== '' && this.asientos !== null && this.costo !== null;
  }

  async crearViaje() {
    if (this.isComplete()) {
      const rutaCoordenadas = await this.dibujarRuta(this.destinoCoords!);

      const viajeData = {
        destino: this.destino,
        descripcion: this.descripcion,
        asientos: this.asientos,
        costo: this.costo,
        ubicacionInicial: this.ubicacionInicial,
        destinoCoords: this.destinoCoords,
        asientosDisponibles: this.asientos,
        conductorId: this.conductorId,
        estado: 'activo',
        ruta: rutaCoordenadas,
      };

      const viajeRef = this.db.list('viajes').push(viajeData);
      this.viajeId = viajeRef.key || '';
      this.db.object(`viajesActivos/${this.conductorId}`).set({ id: this.viajeId });

      console.log('Viaje creado y guardado en Firebase:', viajeData);
    } else {
      console.log('Por favor, completa todos los campos.');
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from '../../../environments/environment'; // Asegúrate de la ruta correcta

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
  ubicacionInicial: [number, number] = [-74.5, 40]; // Coordenadas iniciales de ejemplo

  constructor() {}

  async ngOnInit() {
    // Configura el token de acceso de Mapbox
    (mapboxgl as any).accessToken = environment.accessToken;

    // Obtén la ubicación inicial del usuario usando Capacitor Geolocation
    const posicion = await Geolocation.getCurrentPosition();
    this.ubicacionInicial = [posicion.coords.longitude, posicion.coords.latitude];

    // Inicializa el mapa en el contenedor "mapa"
    this.map = new mapboxgl.Map({
      container: 'mapa', // Debe coincidir con el ID del contenedor en el HTML
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.ubicacionInicial,
      zoom: 12,
    });

    // Añade un marcador en la ubicación inicial
    new mapboxgl.Marker()
      .setLngLat(this.ubicacionInicial)
      .addTo(this.map);
  }

  ngOnDestroy() {
    // Elimina el mapa cuando se destruye el componente
    this.map.remove();
  }

  // Función para verificar si todos los campos están completos
  isComplete(): boolean {
    return this.destino !== '' && this.descripcion !== '' && this.asientos !== null && this.costo !== null;
  }

  // Función para crear el viaje
  crearViaje() {
    if (this.isComplete()) {
      console.log('Viaje creado:', {
        destino: this.destino,
        descripcion: this.descripcion,
        asientos: this.asientos,
        costo: this.costo,
        ubicacionInicial: this.ubicacionInicial,
      });
      // Aquí puedes agregar la lógica para almacenar el viaje en tu base de datos o en Firebase
    } else {
      console.log('Por favor, completa todos los campos.');
    }
  }
}

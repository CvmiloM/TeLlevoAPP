import { Component, OnInit, OnDestroy } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from '../../../environments/environment';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

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
  userId: string | null = null;
  userExperience: number = 0;
  userLevel: number = 1;
  experienceNeededForNextLevel: number = 10;

  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth,
    private alertController: AlertController,
    private router: Router,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    (mapboxgl as any).accessToken = environment.accessToken;

    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.loadUserExperience();
      }
    });

    const posicion = await Geolocation.getCurrentPosition();
    this.ubicacionInicial = [posicion.coords.longitude, posicion.coords.latitude];

    this.map = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.ubicacionInicial,
      zoom: 12,
    });

    new mapboxgl.Marker().setLngLat(this.ubicacionInicial).addTo(this.map);
  }

  ngOnDestroy() {
    this.map.remove();
  }

  loadUserExperience() {
    if (this.userId) {
      this.db.object(`usuarios/${this.userId}/profile`).valueChanges().subscribe((profile: any) => {
        if (profile) {
          this.userExperience = profile.experience || 0;
          this.userLevel = profile.level || 1;
        }
      });
    }
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

  seleccionarDestino(coordinates: [number, number], placeName: string) {
    this.destinoCoords = coordinates;
    this.destino = placeName;
    this.suggestions = [];
    this.dibujarRuta(this.destinoCoords);
  }

  async dibujarRuta(destinoCoords: [number, number]): Promise<[number, number][]> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${this.ubicacionInicial.join(',')};${destinoCoords.join(',')}?geometries=geojson&access_token=${environment.accessToken}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const route = data.routes[0].geometry.coordinates;

        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: route,
            },
            properties: {} // Asegúrate de que 'properties' esté presente
        };

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

  async mostrarAlerta(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  async crearViaje() {
    if (this.asientos && this.asientos > 6) {
      await this.mostrarAlerta('El número máximo de asientos permitidos es 6.');
      return;
    }

    if (this.costo && this.costo < 1000) {
      await this.mostrarAlerta('El costo por persona debe ser de al menos 1,000.');
      return;
    }

    if (this.isComplete() && this.userId) {
      const rutaCoordenadas = await this.dibujarRuta(this.destinoCoords!);

      const viajeData = {
        destino: this.destino,
        descripcion: this.descripcion,
        asientos: this.asientos,
        costo: this.costo,
        ubicacionInicial: this.ubicacionInicial,
        destinoCoords: this.destinoCoords,
        asientosDisponibles: this.asientos,
        conductorId: this.userId,
        estado: 'activo', // Establecer estado como activo
        ruta: rutaCoordenadas,
      };

      // Guardar en Firebase
      const viajeRef = this.db.list('viajes').push(viajeData);
      this.viajeId = viajeRef.key || '';
      await this.db.object(`viajes/${this.viajeId}`).update({ id: this.viajeId });

      // Guardar en la ruta específica del usuario
      await this.db.list(`usuarios/${this.userId}/viajes`).set(this.viajeId, viajeData);

      // Guardar en Ionic Storage
      await this.guardarViajeLocal(viajeData);

      // Actualizar experiencia y mostrar éxito
      this.updateExperience(5);
      await this.mostrarAlerta('Su viaje se ha creado correctamente.');
      this.router.navigate(['/conductor']);
    } else {
      await this.mostrarAlerta('Por favor, completa todos los campos.');
    }
  }

  async guardarViajeLocal(viajeData: any) {
    let viajesLocales = await this.storage.get('viajes') || [];
    viajesLocales.push(viajeData);
    await this.storage.set('viajes', viajesLocales);
    console.log('Viaje guardado en Ionic Storage:', viajeData);
  }

  updateExperience(points: number) {
    this.userExperience += points;
    if (this.userExperience >= this.experienceNeededForNextLevel) {
      this.userLevel++;
      this.userExperience -= this.experienceNeededForNextLevel;
      this.experienceNeededForNextLevel += 10;
    }
    this.db.object(`usuarios/${this.userId}/profile`).update({
      level: this.userLevel,
      experience: this.userExperience
    });
  }
}

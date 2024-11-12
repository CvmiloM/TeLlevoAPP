import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { Storage } from '@ionic/storage-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.page.html',
  styleUrls: ['./role-selection.page.scss'],
})
export class RoleSelectionPage implements OnInit, OnDestroy {
  userEmail: string | null = null;
  userId: string | null = null;
  map!: mapboxgl.Map;
  viajeActivo: any = null;
  conductorMarker: mapboxgl.Marker | null = null;
  viajeActivoSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.userEmail = user.email;
        this.userId = user.uid;
        this.verificarViajeActivo(); // Verificar si el viaje ha sido cancelado o removido
      } else {
        this.userEmail = 'Usuario';
        await this.cargarViajeDesdeStorage();
      }
    });
  }

  ngOnDestroy() {
    if (this.viajeActivoSubscription) {
      this.viajeActivoSubscription.unsubscribe();
    }
  }

  verificarViajeActivo() {
    // Escuchar cambios en el viaje activo del usuario en Firebase
    if (this.userId) {
      this.viajeActivoSubscription = this.db
        .object(`usuarios/${this.userId}/viajeActivo`)
        .valueChanges()
        .subscribe(async (viajeActivo) => {
          if (viajeActivo) {
            this.viajeActivo = viajeActivo;
            await this.guardarViajeEnStorage(viajeActivo);
          } else {
            // Si el viaje activo fue eliminado, redirigir al usuario a role-selection
            this.viajeActivo = null;
            await this.storage.remove('viaje_activo');
            alert('El conductor ha cancelado tu participación en el viaje.');
            this.router.navigate(['/role-selection']);
          }
        });
    }
  }

  async cargarViajeDesdeStorage() {
    const viajeGuardado = await this.storage.get('viaje_activo');
    if (viajeGuardado) {
      this.viajeActivo = viajeGuardado;
      this.inicializarMapa(this.viajeActivo.ruta);
    }
  }

  async guardarViajeEnStorage(viaje: any) {
    await this.storage.set('viaje_activo', viaje);
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
      const viajeActivoRef = this.db.object(`usuarios/${this.userId}/viajeActivo`);
      await viajeActivoRef.remove();
      await this.storage.remove('viaje_activo'); // Eliminar el viaje guardado localmente

      this.viajeActivo = null;
      alert('Has cancelado tu participación en el viaje.');
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

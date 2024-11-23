import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { NotificacionesService } from '../../services/notificaciones.service';
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
  nuevasNotificaciones: boolean = false;
  viajeActivoSubscription: Subscription | undefined;
  viajeGuardado: any = null;


  constructor(
    private router: Router,
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase,
    private notificacionesService: NotificacionesService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.userEmail = user.email;
        this.userId = user.uid;
        this.verificarViajeActivo(); // Lógica para viajes en línea
      } else {
        this.userEmail = 'Usuario';
      }
  
      // Cargar el viaje guardado en Ionic Storage
      const viaje = await this.storage.get('viaje_activo');
      if (viaje) {
        this.viajeGuardado = viaje;
      }
    });
  }
  

  

  ngOnDestroy() {
    if (this.viajeActivoSubscription) {
      this.viajeActivoSubscription.unsubscribe();
    }
  }

  verificarViajeActivo() {
    if (this.userId) {
      this.viajeActivoSubscription = this.db
        .object(`usuarios/${this.userId}/viajeActivo`)
        .valueChanges()
        .subscribe(async (viajeActivo) => {
          if (viajeActivo) {
            this.viajeActivo = viajeActivo;
            await this.guardarViajeEnStorage(viajeActivo);
          } else {
            this.viajeActivo = null;
            await this.storage.remove('viaje_activo');
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

  verificarNotificaciones() {
    if (this.userId) {
      this.db.list(`usuarios/${this.userId}/notificaciones`)
        .valueChanges()
        .subscribe((notificaciones: any[]) => {
          this.nuevasNotificaciones = notificaciones && notificaciones.length > 0;
        });
    }
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
      const conductorId = this.viajeActivo.conductorId;
  
      // Eliminar al pasajero de la lista de pasajeros del viaje en Firebase
      const pasajerosRef = this.db.list(`viajes/${viajeId}/pasajeros`);
      let pasajeroEliminado = false;
  
      await pasajerosRef.query.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const pasajeroData = childSnapshot.val();
          if (pasajeroData.email === this.userEmail) {
            pasajerosRef.remove(childSnapshot.key!);
            pasajeroEliminado = true;
            return true;
          }
          return false;
        });
      });
  
      // Actualizar los asientos disponibles si se eliminó al pasajero
      if (pasajeroEliminado) {
        const viajeRef = this.db.object(`viajes/${viajeId}`);
        const pasajerosSnapshot = await pasajerosRef.query.once('value');
        const numeroPasajerosActual = pasajerosSnapshot.numChildren();
        const asientosTotales = this.viajeActivo.asientos;
        await viajeRef.update({
          asientosDisponibles: asientosTotales - numeroPasajerosActual,
        });
      }
  
      // Notificar al conductor que el pasajero canceló el viaje
      await this.notificacionesService.notificarConductorPasajeroCancelaViaje(
        viajeId,
        conductorId,
        this.userEmail!
      );
  
      // Eliminar el viaje activo del usuario en Firebase
      const userId = (await this.afAuth.currentUser)?.uid;
      if (userId) {
        await this.db.object(`usuarios/${userId}/viajeActivo`).remove();
      }
  
      // Borrar la información del viaje guardado en Ionic Storage
      await this.storage.remove('viaje_activo');
      console.log('Viaje guardado eliminado de Ionic Storage');
  
      // Actualizar las variables locales para reflejar los cambios en la vista
      this.viajeActivo = null;
      this.viajeGuardado = null;
  
      // Mostrar mensaje de confirmación
      alert('Has cancelado el viaje correctamente.');
    } else {
      alert('No tienes un viaje activo para cancelar.');
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

  goToNotificaciones() {
    this.router.navigate(['/notificaciones']);
    this.nuevasNotificaciones = false;
  }

  recargarMapa() {
    if (this.viajeActivo && this.viajeActivo.ruta) {
      this.inicializarMapa(this.viajeActivo.ruta);
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-conductor',
  templateUrl: './conductor.page.html',
  styleUrls: ['./conductor.page.scss'],
})
export class ConductorPage implements OnInit {
  disponible: boolean = false;
  pasajeros: any[] = [];

  constructor(
    private db: AngularFireDatabase,
    private storage: Storage,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.storage.create();
    this.cargarPasajerosDesdeStorage();
  }

  cambiarDisponibilidad() {
    if (this.disponible) {
      console.log('Conductor disponible para viajes.');
    } else {
      console.log('Conductor no disponible.');
    }
  }

  async cargarPasajerosDesdeStorage() {
    this.pasajeros = [];
    const keys = await this.storage.keys();

    for (const key of keys) {
      if (key.startsWith('viaje_aceptado_')) {
        const viaje = await this.storage.get(key);
        this.pasajeros.push(viaje);
      }
    }
    console.log('Pasajeros cargados desde Storage:', this.pasajeros);
  }

  verSolicitudes() {
    console.log('Mostrando solicitudes de pasajeros...');
  }

  crearViaje() {
    this.router.navigate(['/crear-viaje']);
  }

  verHistorial() {
    this.router.navigate(['/historial']);
  }
}

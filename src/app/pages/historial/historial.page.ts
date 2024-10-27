import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AuthService } from '../../services/auth.service';; // Asegúrate de tener un servicio de autenticación
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit, OnDestroy {
  viajes: any[] = [];
  viajesSubscription: Subscription | undefined;
  conductorId: string | null = null;

  constructor(private db: AngularFireDatabase, private authService: AuthService) {}

  ngOnInit() {
    // Obtener el ID del conductor autenticado
    

    // Escuchar los cambios en la base de datos de "viajes" y filtrar solo los del conductor
    this.viajesSubscription = this.db.list('viajes').valueChanges().subscribe((data: any[]) => {
      this.viajes = data.filter(viaje => viaje.conductorId === this.conductorId);
      console.log('Historial de viajes:', this.viajes);
    });
  }

  ngOnDestroy() {
    if (this.viajesSubscription) {
      this.viajesSubscription.unsubscribe();
    }
  }
}

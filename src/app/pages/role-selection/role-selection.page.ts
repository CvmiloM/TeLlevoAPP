import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as mapboxgl from 'mapbox-gl';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.page.html',
  styleUrls: ['./role-selection.page.scss'],
})
export class RoleSelectionPage implements OnInit {
  userEmail: string | null = null;
  map!: mapboxgl.Map;

  constructor(
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    // Obtener el correo del usuario autenticado
    this.afAuth.authState.subscribe(user => {
      this.userEmail = user ? user.email : 'Usuario';
    });

    this.loadMap();
  }

  async loadMap() {
    (mapboxgl as any).accessToken = environment.accessToken;

    const position = await Geolocation.getCurrentPosition();
    const coords = [position.coords.longitude, position.coords.latitude] as [number, number];

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: coords,
      zoom: 14,
    });

    new mapboxgl.Marker().setLngLat(coords).addTo(this.map);
  }

  selectConductor() {
    this.router.navigate(['/conductor']);
  }

  selectPasajero() {
    this.router.navigate(['/pasajero']);
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }
}

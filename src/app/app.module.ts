import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { IonicStorageModule } from '@ionic/storage-angular'; //le agregue esto para el storage

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, IonicStorageModule.forRoot(),AngularFireModule.initializeApp(environment.firebaseConfig),AngularFirestoreModule,AngularFireAuthModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}

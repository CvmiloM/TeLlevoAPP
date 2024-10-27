import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {
  userId: string | null = null;
  userEmail: string | null = null;
  profileImageUrl: Observable<string | null> | null = null;
  userLevel: number = 1;
  userExperience: number = 0;
  experienceNeededForNextLevel: number = 10;

  constructor(
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage,
    private db: AngularFireDatabase,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        this.userEmail = user.email;
        this.loadProfileImage();
        this.loadUserLevelAndExperience();
      }
    });
  }

  loadProfileImage() {
    if (this.userId) {
      const filePath = `profile_images/${this.userId}`;
      const ref = this.storage.ref(filePath);
      this.profileImageUrl = ref.getDownloadURL();
    }
  }

  loadUserLevelAndExperience() {
    if (this.userId) {
      this.db.object(`users/${this.userId}/profile`).valueChanges().subscribe((profile: any) => {
        if (profile) {
          this.userLevel = profile.nivel || 1;
          this.userExperience = profile.experiencia || 0;
          console.log("Datos cargados desde la base de datos:", profile); // Depuración
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && this.userId) {
      const filePath = `profile_images/${this.userId}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);

      task.snapshotChanges()
        .pipe(finalize(() => this.profileImageUrl = fileRef.getDownloadURL()))
        .subscribe();
    }
  }

  saveProfileImageUrl() {
    alert('Imagen de perfil actualizada correctamente.');
  }

  updateExperience(points: number) {
    console.log("Experiencia antes de actualizar:", this.userExperience, "Nivel actual:", this.userLevel);
    this.userExperience += points;
    if (this.userExperience >= this.experienceNeededForNextLevel) {
      this.userLevel++;
      this.userExperience -= this.experienceNeededForNextLevel;
      this.experienceNeededForNextLevel += 10;
    }
    console.log("Experiencia después de actualizar:", this.userExperience, "Nuevo nivel:", this.userLevel);
    if (this.userId) {
      this.db.object(`users/${this.userId}/profile`).update({
        nivel: this.userLevel,
        experiencia: this.userExperience
      });
    }
  }

  logout() {
    this.afAuth.signOut().then(() => {
      this.navCtrl.navigateRoot('/home');
    });
  }

  goToRoleSelection() {
    this.navCtrl.navigateBack('/role-selection');
  }
}

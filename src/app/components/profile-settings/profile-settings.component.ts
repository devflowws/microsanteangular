import { Component, EventEmitter, inject, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Auth, updateProfile } from '@angular/fire/auth';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-card animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <h3>Paramètres du compte</h3>
            <p>Gérez vos informations personnelles et votre photo</p>
          </div>
          <button class="close-btn" (click)="onClose()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="profile-preview mb-4 text-center">
            <app-user-avatar [photoUrl]="formData.photoUrl" [initials]="initials" [size]="100" class="mx-auto mb-3 d-block"></app-user-avatar>

            <div class="d-flex justify-content-center gap-2">
              <button type="button" class="ms-btn tertiary sm" (click)="fileInput.click()">
                <i class="bi bi-upload me-1"></i> Sélectionner un fichier
              </button>
              <button type="button" *ngIf="formData.photoUrl" class="ms-btn danger ghost sm" (click)="removePhoto()">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <input #fileInput type="file" hidden accept="image/*" (change)="onFileSelected($event)">
            <div class="form-text mt-1 opacity-75">Formats supportés : JPG, PNG (Max 5MB)</div>
          </div>

          <form (ngSubmit)="onSubmit()" #profileForm="ngForm">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Nom</label>
                <div class="input-group">
                  <i class="bi bi-person"></i>
                  <input type="text" [(ngModel)]="formData.nom" name="nom" required placeholder="Votre nom">
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Prénom</label>
                <div class="input-group">
                  <i class="bi bi-person"></i>
                  <input type="text" [(ngModel)]="formData.prenom" name="prenom" required placeholder="Votre prénom">
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Photo de profil (URL ou Fichier)</label>
              <div class="input-group">
                <i class="bi bi-image"></i>
                <input type="url" [(ngModel)]="formData.photoUrl" name="photoUrl" placeholder="https://exemple.com/photo.jpg ou sélection ci-dessus">
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label">Email</label>
              <div class="input-group disabled">
                <i class="bi bi-envelope"></i>
                <input type="email" [value]="userEmail" disabled>
              </div>
              <div class="form-text mt-1 text-amber">L'email ne peut pas être modifié.</div>
            </div>

            <div class="modal-footer px-0 pb-0">
              <button type="button" class="ms-btn secondary" (click)="onClose()">Annuler</button>
              <button type="submit" class="ms-btn primary" [disabled]="loading() || !profileForm.valid">
                <span *ngIf="!loading()">Sauvegarder les modifications</span>
                <span *ngIf="loading()">Enregistrement...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 2000;
    }
    .modal-card {
      background: var(--surface); width: 100%; max-width: 550px;
      border-radius: 20px; border: 1px solid var(--border);
      box-shadow: 0 20px 50px rgba(0,0,0,0.3); overflow: hidden;
    }
    .modal-header {
      padding: 24px 32px; border-bottom: 1px solid var(--border);
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .header-content h3 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
    .header-content p { margin: 4px 0 0; font-size: 13.5px; color: var(--muted); }
    .close-btn { background: none; border: none; font-size: 20px; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 8px; transition: all 0.2s; }
    .close-btn:hover { background: var(--surface2); color: var(--text); }

    .modal-body { padding: 32px; }

    .avatar-large {
      width: 100px; height: 100px; border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-mid), var(--blue));
      overflow: hidden; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 20px rgba(18, 147, 106, 0.2); border: 4px solid var(--surface);
      position: relative;
    }
    .avatar-large img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-large .initials { font-size: 32px; font-weight: 700; color: white; }

    .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text2); margin-bottom: 8px; }
    .input-group {
      display: flex; align-items: center; background: var(--surface2);
      border: 1px solid var(--border); border-radius: 10px; padding: 0 14px;
      transition: all 0.2s;
    }
    .input-group:focus-within { border-color: var(--teal-mid); box-shadow: 0 0 0 3px rgba(18, 147, 106, 0.1); }
    .input-group.disabled { opacity: 0.6; cursor: not-allowed; }
    .input-group i { font-size: 16px; color: var(--muted); margin-right: 12px; }
    .input-group input {
      border: none; background: none; outline: none; width: 100%;
      height: 42px; font-family: inherit; font-size: 14px; color: var(--text);
    }

    .form-text { font-size: 11.5px; }
    .text-amber { color: var(--amber); }

    .animate-in { animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private utilisateurService = inject(UtilisateurService);
  private auth = inject(Auth);
  private toast = inject(ToastService);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = signal(false);
  initials = '';
  userEmail = '';
  userId = '';

  formData = {
    nom: '',
    prenom: '',
    photoUrl: ''
  };

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.userEmail = user.email || '';
        this.formData.photoUrl = user.photoURL || '';
        const nameParts = (user.displayName || '').split(' ');
        this.formData.nom = nameParts[nameParts.length - 1] || '';
        this.formData.prenom = nameParts.slice(0, -1).join(' ') || '';
        this.updateInitials();
      }
    });
  }

  updateInitials() {
    this.initials = (this.formData.nom[0] || '') + (this.formData.prenom[0] || '');
    this.initials = this.initials.toUpperCase();
  }

  onClose() {
    this.close.emit();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toast.warn('Le fichier est trop volumineux (max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.photoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.formData.photoUrl = '';
  }

  onSubmit() {
    this.loading.set(true);
    const payload = {
      nom: this.formData.nom,
      prenom: this.formData.prenom,
      photoUrl: this.formData.photoUrl
    };

    // 1. Mettre à jour la base PostgreSQL
    this.utilisateurService.update(this.userId, payload).pipe(
      // 2. Mettre à jour le profil Firebase pour rafraîchissement immédiat de l'UI (uniquement displayName ici car photoURL refuse le Base64)
      switchMap(() => {
        const currentUser = this.auth.currentUser;
        if (currentUser) {
          const profileUpdate: any = {
            displayName: `${this.formData.nom} ${this.formData.prenom}`
          };

          // On ne met à jour Firebase photoURL que si c'est une vraie URL (pas du Base64)
          if (this.formData.photoUrl && !this.formData.photoUrl.startsWith('data:')) {
            profileUpdate.photoURL = this.formData.photoUrl;
          }

          return from(updateProfile(currentUser, profileUpdate));
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.toast.success('Profil mis à jour avec succès');
        this.loading.set(false);
        this.saved.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Erreur profil:', err);
        this.loading.set(false);
        this.toast.error('Erreur lors de la mise à jour : ' + (err.error?.message || err.message));
      }
    });
  }
}

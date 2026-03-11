import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestataireService } from '../../services/prestataire.service';
import { Utilisateur } from '../../services/utilisateur.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-prestataire-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="text-xl font-bold">{{ prestataire ? 'Modifier' : 'Ajouter' }} un Prestataire</h2>
          <button class="close-btn" (click)="onClose()"><i class="bi bi-x-lg"></i></button>
        </div>

        <form (ngSubmit)="onSubmit()" #pForm="ngForm" class="modal-body p-4">
          <div class="ms-grid ms-grid-2">
            <div class="mb-3">
              <label class="ms-label">Nom de la structure</label>
              <input type="text" class="ms-input" [(ngModel)]="formData.nom" name="nom" required placeholder="ex: Clinique Saint Pierre">
            </div>
            <div class="mb-3">
              <label class="ms-label">Email de contact</label>
              <input type="email" class="ms-input" [(ngModel)]="formData.email" name="email" required placeholder="contact@clinique.tg" [disabled]="!!prestataire">
            </div>
          </div>

          <div class="ms-grid ms-grid-2">
            <div class="mb-3">
              <label class="ms-label">Prénom du responsable (optionnel)</label>
              <input type="text" class="ms-input" [(ngModel)]="formData.prenom" name="prenom" placeholder="Prénom">
            </div>
            <div class="mb-3">
              <label class="ms-label">Statut initial</label>
              <select class="ms-input" [(ngModel)]="formData.actif" name="actif">
                <option [ngValue]="true">Actif</option>
                <option [ngValue]="false">Inactif</option>
              </select>
            </div>
          </div>

          <div class="mb-3" *ngIf="!prestataire">
            <label class="ms-label">Mot de passe pour le compte</label>
            <div class="ms-input-icon-wrap">
              <i class="bi bi-lock ms-input-icon"></i>
              <input type="password" class="ms-input with-icon" [(ngModel)]="formData.password" name="password" required placeholder="••••••••" minlength="6">
            </div>
            <p class="text-xs text-muted mt-1">Sera utilisé par le prestataire pour se connecter.</p>
          </div>

          <div class="alert info mt-2">
            <i class="bi bi-info-circle"></i> Le rôle par défaut sera <strong>PRESTATAIRE</strong>. Le mot de passe défini permettra l'accès immédiat au portail.
          </div>

          <div class="modal-footer mt-4 flex justify-end gap-2">
            <button type="button" class="ms-btn" (click)="onClose()">Annuler</button>
            <button type="submit" class="ms-btn primary" [disabled]="!pForm.valid || loading()">
              <i class="bi bi-check2" *ngIf="!loading()"></i>
              <span *ngIf="loading()" class="spinner-border spinner-border-sm"></span>
              {{ prestataire ? 'Mettre à jour' : 'Créer le compte' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-content {
      background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
      width: 100%; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      animation: slideUp 0.3s ease-out;
    }
    .modal-header {
      padding: 16px 20px; border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
    }
    .close-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 1.2rem; }
    .alert.info {
      background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2);
      color: var(--blue); padding: 12px; border-radius: 8px; font-size: 13px;
    }
    .ms-input-icon-wrap { position: relative; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class PrestataireFormComponent {
  @Input() prestataire: Utilisateur | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private service = inject(PrestataireService);
  private toast = inject(ToastService);
  loading = signal(false);

  formData = {
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'PRESTATAIRE',
    actif: true
  };

  ngOnChanges() {
    if (this.prestataire) {
      this.formData = {
        nom: this.prestataire.nom,
        prenom: this.prestataire.prenom,
        email: this.prestataire.email,
        password: '',
        role: 'PRESTATAIRE',
        actif: this.prestataire.actif
      };
    }
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    this.loading.set(true);
    const obs = this.prestataire ?
      this.service.toggleStatus(this.prestataire.id, this.formData.actif) : // Simple update for now
      this.service.create(this.formData);

    obs.subscribe({
      next: () => {
        this.toast.success(this.prestataire ? 'Prestataire mis à jour' : 'Prestataire créé avec succès');
        this.saved.emit();
        this.onClose();
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Erreur: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }
}

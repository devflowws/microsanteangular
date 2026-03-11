import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Membre, MembreService } from '../../services/membre.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-membre-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-overlay" (click)="close.emit()">
      <div class="form-container" (click)="$event.stopPropagation()">
        <div class="form-header">
          <h2 class="form-title">{{ membre ? 'Modifier Assuré' : 'Nouvel Assuré' }}</h2>
          <button class="close-btn" (click)="close.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <form [formGroup]="membreForm" (ngSubmit)="onSubmit()" class="form-body">
          <div class="form-grid">
            <div class="form-group">
              <label><i class="bi bi-person me-1"></i> Nom</label>
              <input type="text" formControlName="nom" placeholder="Ex: DOE">
            </div>
            <div class="form-group">
              <label><i class="bi bi-person me-1"></i> Prénom</label>
              <input type="text" formControlName="prenom" placeholder="Ex: John">
            </div>
          </div>

          <div class="form-group">
            <label><i class="bi bi-envelope me-1"></i> Email</label>
            <input type="email" formControlName="email" placeholder="john.doe@exemple.com">
          </div>

          @if (!membre) {
            <div class="form-group">
              <label><i class="bi bi-lock me-1"></i> Mot de passe initial</label>
              <input type="password" formControlName="password" placeholder="••••••••">
            </div>
          }

          <div class="form-grid">
            <div class="form-group">
              <label><i class="bi bi-telephone me-1"></i> Téléphone</label>
              <input type="text" formControlName="telephone" placeholder="+228 90 00 00 00">
            </div>
            <div class="form-group">
              <label><i class="bi bi-shield-check me-1"></i> Rôle</label>
              <select formControlName="role">
                <option value="MEMBRE">Membre (Assuré)</option>
                <option value="AGENT">Agent (Saisie)</option>
                <option value="TRESORIER">Trésorier</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label><i class="bi bi-geo-alt me-1"></i> Adresse / Ville</label>
            <textarea formControlName="adresse" rows="2" placeholder="Quartier, Ville..."></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="close.emit()">Annuler</button>
            <button type="submit" class="btn-submit" [disabled]="membreForm.invalid || loading">
              {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem; animation: fadeIn 0.3s ease-out;
    }
    .form-container {
      background: white; width: 100%; max-width: 550px;
      border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      overflow: hidden; animation: slideUp 0.3s ease-out;
    }
    .form-header {
      padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: center;
      background: #f8fafc;
    }
    .form-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.25rem; color: #64748b; cursor: pointer; transition: 0.2s; }
    .close-btn:hover { color: #ef4444; transform: rotate(90deg); }

    .form-body { padding: 2rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.8rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 12px;
      font-family: inherit; transition: all 0.2s; font-size: 0.95rem;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(67, 56, 202, 0.1);
      background: white;
    }

    .form-actions { display: flex; gap: 1rem; margin-top: 2rem; }
    .btn-cancel {
      flex: 1; padding: 0.8rem; border: 1.5px solid #e2e8f0; border-radius: 12px;
      background: white; color: #64748b; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    .btn-cancel:hover { background: #f8fafc; color: #1e293b; }
    .btn-submit {
      flex: 2; padding: 0.8rem; border: none; border-radius: 12px;
      background: var(--primary); color: white; font-weight: 700; cursor: pointer;
      transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.2);
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
    .btn-submit:hover:not(:disabled) { background: #3730a3; transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(67, 56, 202, 0.3); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class MembreFormComponent {
  private fb = inject(FormBuilder);
  private membreService = inject(MembreService);
  private toast = inject(ToastService);

  @Input() membre: Membre | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = false;
  membreForm: FormGroup;

  constructor() {
    this.membreForm = this.fb.group({
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      telephone: ['', [Validators.required]],
      adresse: [''],
      role: ['MEMBRE', [Validators.required]]
    });
  }

  ngOnInit() {
    if (this.membre) {
      this.membreForm.patchValue({
        nom: this.membre.nom,
        prenom: this.membre.prenom,
        email: this.membre.email || '',
        telephone: this.membre.telephone,
        adresse: this.membre.adresse,
        role: 'MEMBRE'
      });
    } else {
      // Pour une création, le mot de passe est obligatoire
      this.membreForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.membreForm.get('password')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.membreForm.invalid) return;

    this.loading = true;
    const formData = this.membreForm.value;

    if (this.membre) {
      this.membreService.updateMembre(this.membre.id, formData).subscribe({
        next: () => {
          this.toast.success('Membre mis à jour avec succès');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.error('Erreur lors de la mise à jour : ' + (err?.error?.message || err.message));
          this.loading = false;
        }
      });
    } else {
      this.membreService.creerMembre(formData).subscribe({
        next: () => {
          this.toast.success('Nouveau membre créé avec succès');
          this.saved.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.error('Erreur lors de la création : ' + (err?.error?.message || err.message));
          this.loading = false;
        }
      });
    }
  }
}

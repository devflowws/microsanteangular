import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur.service';
import { MembreService } from '../../services/membre.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-personnel-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="form-overlay" (click)="close.emit()">
      <div class="form-container" (click)="$event.stopPropagation()">
        <div class="form-header">
          <h2 class="form-title">{{ user ? 'Modifier Personnel' : 'Ajouter Personnel' }}</h2>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>

        <form [formGroup]="personnelForm" (ngSubmit)="onSubmit()" class="form-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Nom</label>
              <input type="text" formControlName="nom" placeholder="ex: DOE">
            </div>
            <div class="form-group">
              <label>Prénom</label>
              <input type="text" formControlName="prenom" placeholder="ex: John">
            </div>
          </div>

          <div class="form-group">
            <label>Email Professional</label>
            <input type="email" formControlName="email" placeholder="john.doe@microsante.tg" [readOnly]="!!user">
          </div>

          <div class="form-group" *ngIf="!user">
            <label>Mot de passe initial</label>
            <input type="password" formControlName="password" placeholder="Min. 6 caractères">
          </div>

          <div class="form-group">
            <label>Rôle Système</label>
            <select formControlName="role">
              <option value="ADMIN">Administrateur (Tous les droits)</option>
              <option value="TRESORIER">Trésorier (Gestion Sinistres)</option>
              <option value="AGENT">Agent (Saisie Membres)</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="close.emit()">Annuler</button>
            <button type="submit" class="btn-submit" [disabled]="personnelForm.invalid || loading">
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
      background: white; width: 100%; max-width: 500px;
      border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      overflow: hidden; animation: slideUp 0.3s ease-out;
    }
    .form-header {
      padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: center;
    }
    .form-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; }

    .form-body { padding: 2rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; }
    .form-group input, .form-group select {
      width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 10px;
      font-family: inherit; transition: all 0.2s;
    }
    .form-group input:focus, .form-group select:focus {
      outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.1);
    }
    .form-group input[readOnly] { background: #f8fafc; color: #64748b; cursor: not-allowed; }

    .form-actions { display: flex; gap: 1rem; margin-top: 2rem; }
    .btn-cancel {
      flex: 1; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px;
      background: white; color: #64748b; font-weight: 600; cursor: pointer;
    }
    .btn-submit {
      flex: 2; padding: 0.75rem; border: none; border-radius: 10px;
      background: var(--primary); color: white; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-submit:hover:not(:disabled) { background: #3a5bd9; transform: translateY(-1px); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class PersonnelFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private userService = inject(UtilisateurService);
    private membreService = inject(MembreService);
    private toast = inject(ToastService); // Utilisé pour la création (backend réutilise le DTO MembreRequest)

    @Input() user: Utilisateur | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();

    loading = false;
    personnelForm: FormGroup;

    constructor() {
        this.personnelForm = this.fb.group({
            nom: ['', [Validators.required]],
            prenom: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            role: ['AGENT', [Validators.required]]
        });
    }

    ngOnInit() {
        if (this.user) {
            this.personnelForm.patchValue({
                nom: this.user.nom,
                prenom: this.user.prenom,
                email: this.user.email,
                role: this.user.role
            });
        } else {
            this.personnelForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
            this.personnelForm.get('password')?.updateValueAndValidity();
        }
    }

    onSubmit() {
        if (this.personnelForm.invalid) return;

        this.loading = true;
        const formData = this.personnelForm.value;

        if (this.user) {
            this.userService.update(this.user.id, formData).subscribe({
                next: () => {
                    this.toast.success('Personnel mis à jour avec succès');
                    this.saved.emit();
                    this.close.emit();
                },
                error: (err: any) => {
                    this.toast.error('Erreur lors de la mise à jour : ' + (err?.error?.message || err.message));
                    this.loading = false;
                }
            });
        } else {
            this.membreService.creerMembre(formData).subscribe({
                next: () => {
                    this.toast.success('Personnel créé avec succès');
                    this.saved.emit();
                    this.close.emit();
                },
                error: (err: any) => {
                    this.toast.error('Erreur lors de la création : ' + (err?.error?.message || err.message));
                    this.loading = false;
                }
            });
        }
    }
}

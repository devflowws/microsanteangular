import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SinistreService, Sinistre } from '../../services/sinistre.service';
import { MembreService, Membre } from '../../services/membre.service';
import { PrestataireService } from '../../services/prestataire.service';
import { Utilisateur, UtilisateurService } from '../../services/utilisateur.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-sinistre-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content premium-card animate-in" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
           <div>
             <h2 class="text-gradient-teal text-lg font-extrabold">Déclarer un sinistre</h2>
             <p class="text-xs text-muted font-medium">Formulaire de demande de remboursement de soins</p>
           </div>
           <button class="close-btn-p" (click)="onClose()"><i class="bi bi-x"></i></button>
        </div>

        <!-- Info Banner -->
        <div class="p-4 bg-surface2 border-b flex gap-4 text-sm">
           <div class="kpi-icon blue sm h-10 w-10 min-w-[40px]"><i class="bi bi-info-circle"></i></div>
           <div class="text-muted leading-relaxed">
             <strong class="text-text">Modèle avance & remboursement :</strong><br/>
             Le patient paie la clinique, la mutuelle le rembourse ensuite directement sur son compte mobile money.
           </div>
        </div>

        <form (ngSubmit)="onSubmit()" #sForm="ngForm" class="modal-body p-6">
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label class="ms-label-p">Membre bénéficiaire</label>
              <select class="ms-select-p" [(ngModel)]="formData.membreId" name="membreId" required>
                <option value="">Sélectionner un membre...</option>
                <option *ngFor="let m of membres()" [value]="m.id">{{ m.nom }} {{ m.prenom }}</option>
              </select>
            </div>
            <div *ngIf="!isProvider()">
              <label class="ms-label-p">Prestataire de santé</label>
              <select class="ms-select-p" [(ngModel)]="formData.prestataireId" name="prestataireId" required>
                <option value="">Sélectionner clinique/pharmacie...</option>
                <option *ngFor="let p of prestataires()" [value]="p.id">{{ p.nom }}</option>
              </select>
            </div>
            <div *ngIf="isProvider()">
              <label class="ms-label-p">Prestataire (Votre établissement)</label>
              <div class="ms-input-static">{{ currentUser()?.nom || 'Clinique' }}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label class="ms-label-p">Type de Soin</label>
              <select class="ms-select-p" [(ngModel)]="formData.typeSinistre" name="typeSinistre" required>
                <option value="MALADIE">Maladie / Consultation</option>
                <option value="PHARMACIE">Pharmacie / Médicaments</option>
                <option value="HOSPITALISATION">Hospitalisation</option>
                <option value="MATERNITE">Maternité</option>
                <option value="OPTIQUE">Optique / Dentaire</option>
              </select>
            </div>
            <div>
              <label class="ms-label-p">Montant payé par le patient (FCFA)</label>
              <input type="number" class="ms-input-p" [(ngModel)]="formData.montantDemande" name="montantDemande" required placeholder="0">
              <div class="text-xs text-teal font-bold mt-2 flex items-center gap-1">
                <i class="bi bi-shield-check"></i> Prise en charge à 100% : {{ formData.montantDemande || 0 | number:'1.0-0' }} FCFA
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="ms-label-p">Description / Diagnostic (pour archive)</label>
            <textarea class="ms-input-p" [(ngModel)]="formData.description" name="description" rows="2" placeholder="Détails des soins effectués..."></textarea>
          </div>

          <div class="mb-6">
            <label class="ms-label-p">Justificatifs (Reçu ou Ordonnance)</label>
            <div class="premium-upload-box" (click)="fileInput.click()">
              <input #fileInput type="file" hidden accept="image/*" multiple (change)="onFilesSelected($event)">
              <div class="upload-icon-p"><i class="bi bi-cloud-arrow-up"></i></div>
              <div class="upload-text-p">Cliquez pour ajouter des photos</div>
              <div class="upload-sub-p">Formats JPG, PNG (Max 5Mo)</div>
            </div>

            <div class="photos-preview-grid mt-4" *ngIf="selectedPhotos().length > 0">
              <div *ngFor="let photo of selectedPhotos(); let i = index" class="preview-card-p">
                <img [src]="photo" class="preview-img-p">
                <button type="button" class="preview-remove-p" (click)="removePhoto(i)">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="ms-alert-info mb-6">
             <i class="bi bi-info-circle-fill"></i>
             <span>Cette déclaration doit être confirmée par le membre sur son application pour déclencher le remboursement.</span>
          </div>

          <div class="modal-footer-p">
            <button type="button" class="ms-btn ghost" (click)="onClose()">Annuler</button>
            <button type="submit" class="btn-premium px-8" [disabled]="!sForm.valid || loading()">
              <i class="bi bi-check-lg" *ngIf="!loading()"></i>
              <span *ngIf="loading()" class="spinner-border spinner-border-sm mr-2"></span>
              {{ loading() ? 'Envoi...' : 'Déclarer le sinistre' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px);
      z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-content {
      width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .modal-header {
      padding: 24px 32px; border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255, 255, 255, 0.5);
    }
    .close-btn-p {
      width: 32px; height: 32px; border-radius: 50%; border: none;
      background: var(--surface2); color: var(--muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .close-btn-p:hover { background: #fee2e2; color: #ef4444; }

    .ms-label-p { display: block; font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
    .ms-input-p, .ms-select-p {
      width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border);
      background: white; color: var(--text); font-size: 14px; transition: all 0.2s;
    }
    .ms-input-p:focus, .ms-select-p:focus { outline: none; border-color: var(--teal-primary); box-shadow: var(--sh-premium); }
    .ms-input-static { padding: 12px 16px; background: var(--surface2); border-radius: 12px; font-weight: 600; font-size: 14px; }

    .premium-upload-box {
      border: 2px dashed var(--border); border-radius: 16px; padding: 32px 20px;
      display: flex; flex-direction: column; align-items: center; text-align: center;
      cursor: pointer; transition: all 0.2s; background: var(--surface);
    }
    .premium-upload-box:hover { border-color: var(--teal-primary); background: #f0fdfa; }
    .upload-icon-p { font-size: 32px; color: var(--teal-primary); margin-bottom: 12px; }
    .upload-text-p { font-size: 14px; font-weight: 700; color: var(--text); }
    .upload-sub-p { font-size: 11px; color: var(--muted); font-weight: 500; margin-top: 4px; }

    .photos-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
    .preview-card-p { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
    .preview-img-p { width: 100%; height: 100%; object-fit: cover; }
    .preview-remove-p {
      position: absolute; top: 4px; right: 4px; width: 20px; height: 20px;
      background: rgba(239, 68, 68, 0.9); color: white; border: none;
      border-radius: 50%; font-size: 12px; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
    }

    .modal-footer-p { padding: 24px 32px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; background: rgba(250, 251, 252, 0.8); }

    .ms-alert-info {
      padding: 16px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe;
      color: #1e40af; font-size: 13px; font-weight: 500; display: flex; gap: 12px; align-items: center;
    }
    .ms-alert-info i { font-size: 18px; }

    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class SinistreFormComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private sinistreService = inject(SinistreService);
  private toast = inject(ToastService);
  private membreService = inject(MembreService);
  private prestataireService = inject(PrestataireService);

  loading = signal(false);
  membres = signal<Membre[]>([]);
  prestataires = signal<Utilisateur[]>([]);
  selectedPhotos = signal<string[]>([]);

  @Input() set preselectedMember(m: Membre | null) {
    if (m) {
      this.formData.membreId = m.id.toString();
    }
  }

  currentUser = signal<Utilisateur | null>(null);

  formData = {
    membreId: '',
    prestataireId: '',
    typeSinistre: 'MALADIE',
    montantDemande: 0,
    description: '',
  };

  private authService = inject(AuthService);

  ngOnInit() {
    // ... existing ngOnInit ...
    this.membreService.getMembres().subscribe(res => {
      const data = Array.isArray(res) ? res : (res?.content || []);
      this.membres.set(data);
    });

    this.authService.user$.subscribe((user: any) => {
      if (user) {
        this.authService.getMe().subscribe((profile: Utilisateur) => {
          this.currentUser.set(profile);
          if (profile.role === 'PRESTATAIRE') {
            this.formData.prestataireId = profile.id;
          } else {
            this.prestataireService.getAll().subscribe(data => {
              this.prestataires.set(data);
            });
          }
        });
      }
    });
  }

  isProvider(): boolean {
    return this.currentUser()?.role === 'PRESTATAIRE';
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          alert(`Fichier ${file.name} trop lourd (max 5Mo)`);
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedPhotos.update(photos => [...photos, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removePhoto(index: number) {
    this.selectedPhotos.update(photos => photos.filter((_, i) => i !== index));
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (this.selectedPhotos().length === 0) {
      alert('Veuillez ajouter au moins une photo du reçu ou de l\'ordonnance.');
      return;
    }

    this.loading.set(true);

    const payload = {
      membreId: this.formData.membreId,
      prestataireId: this.formData.prestataireId,
      typeSinistre: this.formData.typeSinistre,
      montantDemande: this.formData.montantDemande,
      description: this.formData.description,
      piecesJointes: this.selectedPhotos()
    };

    this.sinistreService.declarerSinistre(payload).subscribe({
      next: () => {
        this.toast.success('Sinistre déclaré avec succès');
        this.saved.emit();
        this.onClose();
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Erreur lors de la déclaration du sinistre');
        console.error('Erreur lors de la déclaration:', err);
        this.loading.set(false);
      }
    });
  }
}

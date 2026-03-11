import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Sinistre } from '../../services/sinistre.service';

@Component({
  selector: 'app-sinistre-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content premium-card animate-in" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
           <div>
             <h2 class="text-gradient-teal text-lg font-extrabold">Détails du Dossier #{{ sinistre?.id?.substring(0,8) }}</h2>
             <p class="text-xs text-muted font-medium">Examen des justificatifs et validation du remboursement</p>
           </div>
           <button class="close-btn-p" (click)="onClose()"><i class="bi bi-x"></i></button>
        </div>

        <div class="modal-body p-8">
          <!-- Summary Row -->
          <div class="flex items-center justify-between mb-8 pb-8 border-b">
            <div>
              <div class="text-xs text-muted font-bold uppercase tracking-widest mb-1">Montant à rembourser</div>
              <div class="text-4xl font-extrabold text-gradient-blue">{{ sinistre?.montantDemande | number:'1.0-0' }} <small class="text-lg opacity-70">FCFA</small></div>
            </div>
            <div class="text-right">
              <span class="ms-badge lg" [class]="getBadgeClass(sinistre?.statut)">
                <i class="bi bi-circle-fill mr-2" style="font-size: 8px;"></i>
                {{ sinistre?.statut }}
              </span>
            </div>
          </div>

          <!-- Beneficiary Info -->
          <div class="ms-card p-6 bg-surface2 mb-8 border-none ring-1 ring-black/[0.03]">
             <div class="flex items-center gap-4 mb-6">
                <div class="kpi-icon blue shadow-premium"><i class="bi bi-person"></i></div>
                <div>
                   <div class="text-lg font-bold">{{ sinistre?.membreNom }}</div>
                   <div class="text-xs text-muted font-medium">Membre bénéficiaire du remboursement automatique</div>
                </div>
             </div>

             <div class="grid grid-cols-2 gap-8">
                <div>
                   <label class="ms-label-p text-[11px] mb-2">ORIGINE DES SOINS</label>
                   <div class="flex items-center gap-2 text-sm font-bold">
                     <i class="bi bi-hospital text-blue-primary"></i> Clinique de l'Espoir
                   </div>
                </div>
                <div>
                   <label class="ms-label-p text-[11px] mb-2">TYPE DE DÉPENSE</label>
                   <div class="flex items-center gap-2 text-sm font-bold">
                     <i class="bi bi-tag text-violet"></i> {{ sinistre?.typeSinistre }}
                   </div>
                </div>
             </div>
          </div>

          <!-- Justificatifs -->
          <div class="mb-8">
             <label class="ms-label-p text-[11px] mb-4">PIÈCES JOINTES & DIAGNOSTIC</label>
             <div class="premium-card p-5 bg-white">
                <div class="text-sm italic mb-5 leading-relaxed text-muted" *ngIf="sinistre?.description">
                  <i class="bi bi-quote text-teal-primary text-xl mr-1"></i>
                  {{ sinistre?.description }}
                </div>
                
                <div *ngIf="sinistre?.piecesJointes?.length" class="photos-preview-grid">
                  <div *ngFor="let img of sinistre?.piecesJointes" class="preview-card-p group" (click)="viewImage(img)">
                    <img [src]="img" *ngIf="img.startsWith('data:image') || img.startsWith('http')" class="preview-img-p">
                    <div *ngIf="!img.startsWith('data:image') && !img.startsWith('http')" class="flex h-full items-center justify-center bg-surface2 text-3xl text-muted">
                      <i class="bi bi-file-earmark-image"></i>
                    </div>
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-300">
                       <i class="bi bi-zoom-in text-2xl"></i>
                    </div>
                  </div>
                </div>

                <div *ngIf="!sinistre?.description && !sinistre?.piecesJointes?.length" class="text-sm text-muted text-center py-4">
                  Aucun justificatif fourni.
                </div>
             </div>
          </div>

          <!-- Status Banners -->
          <div class="ms-alert-info mb-6" *ngIf="sinistre?.statut !== 'SOUMIS'">
             <i class="bi bi-check-circle-fill text-green"></i>
             <span><strong>Validation Membre :</strong> Le patient a confirmé les soins. Remboursement sécurisé.</span>
          </div>

          <div class="ms-alert-info bg-amber-50 border-amber-200 text-amber-800" *ngIf="sinistre?.statut === 'EN_VALIDATION'">
             <i class="bi bi-exclamation-triangle-fill text-amber-500"></i>
             <span><strong>Virement Mobile :</strong> Le remboursement sera envoyé instantanément via PayGate au bénéficiaire.</span>
          </div>
        </div>

        <div class="modal-footer-p border-t flex justify-end gap-3 px-8 py-6">
          <button class="ms-btn ghost" (click)="onClose()">Fermer</button>
          <button *ngIf="sinistre?.statut === 'EN_VALIDATION'" class="btn-premium px-10" (click)="onApprove()">
            Rembourser {{ (sinistre?.montantDemande || 0) | number:'1.0-0' }} FCFA
          </button>
        </div>

        <!-- Image Zoom Overlay -->
        <div class="image-zoom-overlay animate-in" *ngIf="zoomedImage" (click)="zoomedImage = null">
            <div class="zoom-content" (click)="$event.stopPropagation()">
                <img [src]="zoomedImage" class="shadow-2xl ring-1 ring-white/20">
                <button class="close-zoom" (click)="zoomedImage = null"><i class="bi bi-x-lg"></i></button>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px);
      z-index: 1500; display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-content {
      width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto;
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

    .photos-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
    .preview-card-p { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); cursor: pointer; }
    .preview-img-p { width: 100%; height: 100%; object-fit: cover; }

    .modal-footer-p { padding: 24px 32px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; background: rgba(250, 251, 252, 0.8); }

    .ms-alert-info {
      padding: 16px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe;
      color: #1e40af; font-size: 13px; font-weight: 500; display: flex; gap: 12px; align-items: center;
    }

    .image-zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .zoom-content { position: relative; max-width: 90%; max-height: 90%; }
    .zoom-content img { max-width: 100%; max-height: 85vh; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .close-zoom { position: absolute; top: -40px; right: 0; background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }

    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class SinistreDetailComponent {
  @Input() sinistre: Sinistre | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() approve = new EventEmitter<Sinistre>();

  zoomedImage: string | null = null;

  onClose() { this.close.emit(); }
  onApprove() { if (this.sinistre) this.approve.emit(this.sinistre); }
  viewImage(img: string) { this.zoomedImage = img; }

  getBadgeClass(statut?: string): string {
    switch (statut) {
      case 'EN_VALIDATION': return 'violet';
      case 'APPROUVE': return 'green';
      case 'REMBOURSE': return 'gray';
      default: return 'blue';
    }
  }
}

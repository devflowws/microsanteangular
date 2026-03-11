import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Sinistre } from '../../services/sinistre.service';

@Component({
  selector: 'app-sinistre-member-confirm',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content premium-card animate-in h-auto" (click)="$event.stopPropagation()" style="max-width: 480px;">

        <!-- View 1: Confirmation -->
        <div *ngIf="!confirmed()" class="p-10">
          <div class="text-center mb-10">
            <div class="confirm-icon mb-6 flex justify-center">
              <div class="kpi-icon teal shadow-premium h-16 w-16 text-3xl"><i class="bi bi-shield-check"></i></div>
            </div>
            <h2 class="text-gradient-teal text-2xl font-extrabold mb-2">Confirmez vos soins</h2>
            <p class="text-muted text-sm font-medium leading-relaxed">La clinique a déclaré une prestation en votre nom. Validez pour déclencher votre remboursement automatique.</p>
          </div>

          <div class="premium-card p-6 bg-surface2 border-dashed border-2 mb-8 ring-1 ring-black/[0.02]">
            <div class="flex justify-between items-center mb-4">
              <span class="text-xs text-muted font-bold uppercase tracking-widest">Établissement</span>
              <span class="text-sm font-bold text-teal-900">Clinique de l'Espoir</span>
            </div>
            <div class="mb-4">
                <span class="text-xs text-muted font-bold uppercase tracking-widest block mb-2">Montant payé</span>
                <div class="text-3xl font-extrabold text-gradient-blue">{{ (sinistre?.montantDemande || 0) | number:'1.0-0' }} <small class="text-sm opacity-70">FCFA</small></div>
            </div>

            <div class="p-3 bg-white border rounded-xl flex items-center gap-3">
              <i class="bi bi-file-earmark-text text-teal-primary text-xl"></i>
              <div class="flex-1 overflow-hidden">
                 <div class="text-xs font-bold truncate">recu_clinique_001.jpg</div>
                 <div class="text-[10px] text-muted">{{ sinistre?.typeSinistre }} • {{ (sinistre?.montantDemande || 0) | number:'1.0-0' }} FCFA</div>
              </div>
            </div>
          </div>

          <div class="ms-alert-info bg-green-50 border-green-200 text-green-800 mb-8 py-4">
            <i class="bi bi-info-circle-fill text-green-600"></i>
            <span class="text-[13px] leading-snug"><strong>Engagement :</strong> Je confirme avoir bénéficié de ces soins et avoir payé le montant indiqué.</span>
          </div>

          <div class="flex flex-col gap-3">
            <button class="btn-premium w-full py-4 text-base shadow-lg" (click)="onConfirm()">
              Confirmer & être remboursé
            </button>
            <button class="ms-btn ghost w-full" (click)="onClose()">Pas maintenant</button>
          </div>
        </div>

        <!-- View 2: Success -->
        <div *ngIf="confirmed()" class="p-10 text-center animate-in">
          <div class="success-check mb-8 flex justify-center">
             <div class="kpi-icon green shadow-premium h-20 w-20 text-4xl animate-bounce-short"><i class="bi bi-check2-all"></i></div>
          </div>
          <h2 class="text-gradient-teal text-2xl font-extrabold mb-2 text-center w-full">C'est validé !</h2>
          <p class="text-muted text-sm font-medium mb-10 text-center w-full">Votre demande de remboursement a été transmise au service trésorerie.</p>

          <div class="premium-card p-8 bg-surface2 ring-1 ring-black/[0.03] mb-10">
            <div class="flex items-center justify-between mb-8">
              <div class="text-left">
                <div class="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Total attendu</div>
                <div class="text-2xl font-extrabold text-gradient-blue">{{ montant | number:'1.0-0' }} FCFA</div>
              </div>
              <div class="text-right">
                <div class="flex items-center gap-2 text-teal-600">
                  <i class="bi bi-lightning-charge-fill animate-pulse"></i>
                  <span class="text-xs font-bold uppercase tracking-widest">En cours</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 justify-center mb-2">
               <div class="h-10 w-10 rounded-full bg-teal-primary text-white flex items-center justify-center shadow-lg"><i class="bi bi-shield-fill-check"></i></div>
               <div class="h-1 flex-1 bg-gradient-to-r from-teal-primary to-surface2 rounded-full overflow-hidden">
                  <div class="h-full bg-teal-primary animate-progress-fast" style="width: 50%;"></div>
               </div>
               <div class="h-10 w-10 rounded-full bg-surface-2 border-2 border-dashed border-teal-primary/30 text-teal-primary/40 flex items-center justify-center"><i class="bi bi-phone-vibrate"></i></div>
            </div>
            <div class="text-[10px] text-muted font-bold uppercase tracking-widest">Remboursement vers votre compte mobile</div>
          </div>

          <button class="ms-btn ghost w-full py-3" (click)="onClose()">Retour au tableau de bord</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px);
      z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-content {
      width: 100%; max-width: 450px; border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .text-green { color: #10b981; }
    .bg-green-50 { background: rgba(16, 185, 129, 0.05); }

    .timeline { position: relative; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); }
    .dot.active { background: var(--blue-primary); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
    .line { flex: 1; height: 2px; background: var(--border); max-width: 40px; }
    .line.active { background: var(--blue-primary); }

    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-progress-fast { animation: progress 2s ease-out infinite; }
    @keyframes progress { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
    .animate-bounce-short { animation: bounceShort 1s ease-in-out; }
    @keyframes bounceShort { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  `]
})
export class SinistreMemberConfirmComponent {
  @Input() sinistre: Sinistre | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() confirmedEvent = new EventEmitter<void>();

  confirmed = signal(false);

  get montant(): number {
    return this.sinistre?.montantDemande || 0;
  }

  onConfirm() {
    this.confirmed.set(true);
    this.confirmedEvent.emit();
  }

  onClose() {
    this.close.emit();
  }
}

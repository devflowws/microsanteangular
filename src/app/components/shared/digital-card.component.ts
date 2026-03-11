import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Membre } from '../../services/membre.service';

@Component({
    selector: 'app-digital-card',
    standalone: true,
    imports: [CommonModule, DecimalPipe],
    template: `
    <div class="modal-overlay animate-in" (click)="onClose()">
      <div class="card-container premium-card scale-in" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="card-header-gradient">
          <div class="flex items-center gap-4">
             <div class="avatar-ring">
               <div class="avatar-inner">
                 {{ (member.prenom[0] || '') + (member.nom[0] || '') }}
               </div>
             </div>
             <div>
               <h2 class="text-xl font-black text-white leading-tight">{{ member.prenom }} {{ member.nom }}</h2>
               <p class="text-xs text-white/60 font-medium uppercase tracking-widest">Membre Officiel • MicroSanté+</p>
             </div>
          </div>
          <button class="close-btn" (click)="onClose()"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="p-8 flex flex-col items-center">
          <!-- QR Code Area -->
          <div class="qr-wrapper mb-8">
            <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + (member.qrCode || 'no-qr')" 
                 alt="QR Code" 
                 class="qr-image">
            <div class="qr-scan-line"></div>
          </div>

          <p class="text-sm text-muted font-medium mb-1">Présentez ce code au prestataire</p>
          <p class="text-xs font-bold tracking-[0.3em] text-teal-900 uppercase mb-8">
            {{ member.qrCode || 'MS-CERTIFIED' }}
          </p>

          <!-- Info Box -->
          <div class="info-grid w-full">
            <div class="info-item">
              <span class="label">Plafond disponible</span>
              <span class="value text-teal-600">{{ member.plafond | number:'1.0-0' }} <small>FCFA</small></span>
            </div>
            <div class="info-divider"></div>
            <div class="info-item items-end">
              <span class="label">Statut</span>
              <span class="value" [ngClass]="member.statut === 'ACTIF' || member.statut === 'VALIDE' ? 'text-green' : 'text-amber'">
                {{ member.statut }}
              </span>
            </div>
          </div>

          <button class="btn-premium w-full mt-8 py-4 shadow-lg active:scale-95 transition-transform" (click)="onClose()">
            FERMER LA CARTE
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center; z-index: 2000;
    }

    .card-container {
      width: 440px;
      background: white;
      border-radius: 32px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .card-header-gradient {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      padding: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
    }

    .avatar-ring {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--teal-primary); padding: 3px;
    }
    .avatar-inner {
      width: 100%; height: 100%; border-radius: 50%;
      background: white; color: var(--teal-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 20px;
    }

    .close-btn {
      color: white; opacity: 0.5; font-size: 20px; border: none; background: none; cursor: pointer;
      transition: opacity 0.2s;
    }
    .close-btn:hover { opacity: 1; }

    .qr-wrapper {
      padding: 24px;
      background: white;
      border-radius: 24px;
      border: 1px solid #F1F5F9;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    .qr-image { width: 180px; height: 180px; }

    .qr-scan-line {
      position: absolute; top: 24px; left: 24px; width: 180px; height: 2px;
      background: var(--teal-primary);
      box-shadow: 0 0 8px var(--teal-primary);
      animation: scan 2s infinite ease-in-out;
    }

    @keyframes scan {
      0%, 100% { top: 24px; }
      50% { top: 202px; }
    }

    .info-grid {
      display: flex; justify-content: space-between; align-items: center;
      background: #F8FAFC; padding: 20px 28px; border-radius: 20px;
    }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item .label { font-size: 10px; font-weight: 800; color: #94A3B8; letter-spacing: 0.1em; text-transform: uppercase; }
    .info-item .value { font-size: 18px; font-weight: 800; }
    .info-divider { width: 1px; height: 32px; background: #E2E8F0; }

    .animate-in { animation: fadeIn 0.3s ease-out; }
    .scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class DigitalCardComponent {
    @Input({ required: true }) member!: Membre;
    @Output() close = new EventEmitter<void>();

    onClose() {
        this.close.emit();
    }
}

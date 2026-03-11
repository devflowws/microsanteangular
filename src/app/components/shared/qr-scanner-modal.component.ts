import { Component, EventEmitter, Output, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MembreService, Membre } from '../../services/membre.service';

@Component({
    selector: 'app-qr-scanner-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate-in" (click)="onClose()">
      <div class="modal-container premium-card scale-in" (click)="$event.stopPropagation()">
        <div class="flex justify-between items-center p-6 border-b bg-surface2">
          <div>
            <h2 class="text-xl font-bold text-gradient-teal">Scanner le patient</h2>
            <p class="text-xs text-muted font-medium">Vérification instantanée de l'éligibilité</p>
          </div>
          <button class="ms-btn sm ghost" (click)="onClose()"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="p-8">
          <!-- Verification Summary View -->
          <div *ngIf="member()" class="animate-in">
             <div class="flex items-center gap-6 mb-8 p-4 bg-surface2 rounded-2xl border border-teal-100">
                <div class="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                   <img *ngIf="member()?.photoUrl" [src]="member()?.photoUrl" class="w-full h-full object-cover">
                   <i *ngIf="!member()?.photoUrl" class="bi bi-person text-3xl text-teal-primary"></i>
                </div>
                <div>
                   <h3 class="text-2xl font-extrabold text-teal-900">{{ member()?.prenom }} {{ member()?.nom }}</h3>
                   <div class="flex items-center gap-3 mt-1">
                      <span class="ms-badge" [ngClass]="member()?.statut === 'ACTIF' ? 'green' : 'red'">
                         <i class="bi bi-circle-fill mr-1" style="font-size: 6px;"></i>
                         {{ member()?.statut }}
                      </span>
                      <span class="text-xs text-muted font-bold tracking-wider">{{ member()?.telephone }}</span>
                   </div>
                </div>
             </div>

             <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="cover-info-card">
                   <div class="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Plafond Annuel</div>
                   <div class="text-lg font-bold">500 000 <small>FCFA</small></div>
                </div>
                <div class="cover-info-card highlight">
                   <div class="text-[10px] font-black text-teal-primary uppercase tracking-widest mb-1">Disponible</div>
                   <div class="text-xl font-black text-teal-900">{{ member()?.plafond || 0 | number:'1.0-0' }} <small>FCFA</small></div>
                </div>
             </div>

             <div class="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 mb-8">
                <i class="bi bi-info-circle-fill text-amber-500"></i>
                <p class="text-xs text-amber-900 font-medium">Veuillez vérifier l'identité du membre avant de procéder aux soins.</p>
             </div>

             <div class="flex gap-4">
                <button class="ms-btn w-full justify-center ghost" (click)="resetScanner()">Scanner un autre</button>
                <button class="btn-premium w-full justify-center" (click)="onStartClaim()" [disabled]="member()?.statut !== 'ACTIF'">
                   Déclarer un acte médical
                </button>
             </div>
          </div>

          <!-- Scanner View -->
          <div *ngIf="!member()" class="scanner-viewport animate-in">
             <video #videoElement class="web-video" autoplay playsinline></video>
             <canvas #canvasElement class="hidden"></canvas>
             
             <div class="scanner-overlay">
                <div class="scan-frame animate-pulse"></div>
                <div class="scan-hint">Placez le QR Code de l'adhérent dans le cadre</div>
             </div>

             <div class="mt-8 text-center" *ngIf="errorMessage()">
                <div class="ms-badge red md">{{ errorMessage() }}</div>
                <button class="ms-btn sm ghost mt-2" (click)="startCamera()">Réessayer</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-container { width: 520px; max-width: 95%; background: white; max-height: 90vh; overflow-y: auto; }
    
    .scanner-viewport { position: relative; width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 20px; overflow: hidden; }
    .web-video { width: 100%; height: 100%; object-fit: cover; }
    
    .scanner-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .scan-frame {
      width: 220px; height: 220px; border: 3px solid #14B8A6; border-radius: 24px;
      box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.5);
    }
    .scan-hint { margin-top: 24px; color: white; font-size: 13px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
    
    .cover-info-card { padding: 16px; border-radius: 16px; background: var(--surface2); border: 1px solid var(--border); }
    .cover-info-card.highlight { background: #F0FDFA; border-color: #CCFBF1; }

    .animate-in { animation: fadeIn 0.3s ease-out; }
    .scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class QrScannerModalComponent implements OnInit, OnDestroy {
    @Output() close = new EventEmitter<void>();
    @Output() memberScanned = new EventEmitter<Membre>();

    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    private membreService = inject(MembreService);

    member = signal<Membre | null>(null);
    errorMessage = signal<string | null>(null);

    private stream: MediaStream | null = null;
    private animationFrameId: number | null = null;

    ngOnInit() {
        this.startCamera();
    }

    ngOnDestroy() {
        this.stopCamera();
    }

    async startCamera() {
        this.errorMessage.set(null);
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            if (this.videoElement) {
                this.videoElement.nativeElement.srcObject = this.stream;
                this.videoElement.nativeElement.play();
                this.requestScanning();
            }
        } catch (err) {
            console.error('Camera access error:', err);
            this.errorMessage.set('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    requestScanning() {
        this.animationFrameId = requestAnimationFrame(() => this.scan());
    }

    async scan() {
        if (this.member()) return;

        if (this.videoElement?.nativeElement.readyState === this.videoElement?.nativeElement.HAVE_ENOUGH_DATA) {
            const canvas = this.canvasElement.nativeElement;
            const video = this.videoElement.nativeElement;
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                // Use jsQR (assuming it's loaded via CDN in index.html or injected)
                // For simplicity, I'll inject the script if not present
                if (!(window as any).jsQR) {
                    await this.loadJsQR();
                }

                const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    this.handleCodeFound(code.data);
                    return;
                }
            }
        }
        this.requestScanning();
    }

    private loadJsQR(): Promise<void> {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    }

    handleCodeFound(qrData: string) {
        this.stopCamera();
        this.membreService.checkEligibilite(qrData).subscribe({
            next: (m) => this.member.set(m),
            error: () => this.errorMessage.set('Membre introuvable ou invalide.')
        });
    }

    resetScanner() {
        this.member.set(null);
        this.startCamera();
    }

    onStartClaim() {
        if (this.member()) {
            this.memberScanned.emit(this.member()!);
            this.onClose();
        }
    }

    onClose() {
        this.stopCamera();
        this.close.emit();
    }
}

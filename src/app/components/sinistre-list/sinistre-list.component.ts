import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { SinistreService, Sinistre } from '../../services/sinistre.service';
import { Membre } from '../../services/membre.service';
import { FormsModule } from '@angular/forms';
import { GlobalActionService } from '../../services/global-action.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { SinistreFormComponent } from './sinistre-form.component';
import { SinistreMemberConfirmComponent } from './sinistre-member-confirm.component';
import { SinistreDetailComponent } from './sinistre-detail.component';
import { QrScannerModalComponent } from '../shared/qr-scanner-modal.component';

@Component({
  selector: 'app-sinistre-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe, SinistreFormComponent, SinistreMemberConfirmComponent, SinistreDetailComponent, QrScannerModalComponent],
  template: `
    <div class="dash-content animate-in">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-gradient-teal mb-1">Traitement des Sinistres</h1>
          <p class="text-muted text-sm font-medium">Flux de remboursement et validation des dossiers de soins.</p>
        </div>
        <div class="flex gap-3">
          <button class="ms-btn ghost" (click)="onExport()"><i class="bi bi-download mr-1"></i> Export</button>
          <button class="ms-btn teal" (click)="showScanner.set(true)" *ngIf="isProvider()">
            <i class="bi bi-camera-fill mr-1"></i> Scanner QR
          </button>
          <button class="btn-premium" (click)="onAdd()" *ngIf="hasRole(['PRESTATAIRE', 'TRESORIER'])">
            <i class="bi bi-plus-lg"></i> Nouveau sinistre
          </button>
        </div>
      </div>

      <!-- ─── WORKFLOW TABS & FILTERS ─── -->
      <div class="premium-card mb-8 overflow-hidden">
        <div class="flex items-center justify-between p-2 border-b bg-surface2">
          <div class="flex gap-1 p-1">
            <button class="premium-tab" [class.active]="currentStatut() === ''" (click)="onFilter('')" *ngIf="hasRole(['ADMIN', 'AGENT', 'TRESORIER'])">Tous</button>

            <button class="premium-tab" [class.active]="currentStatut() === 'SOUMIS'" (click)="onFilter('SOUMIS')" *ngIf="hasRole(['ADMIN', 'AGENT', 'PRESTATAIRE'])">
               <span class="flex items-center gap-2">
                 {{ isProvider() ? 'Mes envois' : 'Attente Client' }}
                 <span class="p-tab-badge" *ngIf="countSoumis() > 0">{{ countSoumis() }}</span>
               </span>
            </button>

            <button class="premium-tab" [class.active]="currentStatut() === 'CONFIRME_MEMBRE'" (click)="onFilter('CONFIRME_MEMBRE')" *ngIf="hasRole(['ADMIN', 'AGENT'])">
               <span class="flex items-center gap-2">
                 À traiter <span class="p-tab-badge amber" *ngIf="countPending() > 0">{{ countPending() }}</span>
               </span>
            </button>

            <button class="premium-tab" [class.active]="currentStatut() === 'EN_VALIDATION'" (click)="onFilter('EN_VALIDATION')" *ngIf="hasRole(['ADMIN', 'AGENT', 'TRESORIER'])">
               {{ hasRole(['TRESORIER']) ? 'À rembourser' : 'En expertise' }}
            </button>

            <button class="premium-tab" [class.active]="currentStatut() === 'APPROUVE'" (click)="onFilter('APPROUVE')" *ngIf="hasRole(['ADMIN', 'TRESORIER'])">Approuvés</button>
          </div>

          <div class="flex items-center gap-3 px-4">
             <div class="tb-search" style="width: 260px; height: 38px; padding: 0 12px; border-radius: 10px;">
                <i class="bi bi-search" style="font-size: 14px;"></i>
                <input type="text" class="with-icon" placeholder="Rechercher..." [(ngModel)]="searchQuery" (keyup.enter)="fetchSinistres()" style="font-size: 12px; border: none; background: transparent; outline: none; width: 100%;">
             </div>
          </div>
        </div>

        <!-- ─── LIST (Skeleton) ─── -->
        <div class="p-4 bg-surface" *ngIf="loading()">
           <div class="flex flex-col gap-3">
              <div class="claim-item-row shimmer-effect" *ngFor="let i of [1,2,3,4,5]">
                 <div class="skeleton-text" style="width: 50%;"></div>
                 <div class="skeleton-text" style="width: 80%;"></div>
                 <div class="skeleton-text" style="width: 40%;"></div>
                 <div class="skeleton-text" style="width: 60%;"></div>
                 <div class="skeleton-text" style="width: 50%;"></div>
                 <div class="skeleton-text" style="width: 30%;"></div>
              </div>
           </div>
        </div>

        <!-- ─── LIST (Actual Data) ─── -->
        <div class="p-4 bg-surface" *ngIf="!loading()">
           <div class="flex flex-col gap-3">
              @if (sinistres().length === 0) {
                 <div class="p-12 text-center flex flex-col items-center gap-4">
                    <i class="bi bi-inbox empty-icon"></i>
                    <div class="text-muted">Aucun sinistre trouvé pour ce filtre.</div>
                 </div>
              }
              <!-- Item Row -->
              <div class="claim-item-row animate-in" *ngFor="let s of sinistres(); trackBy: trackById" (click)="onView(s)">
                 <div class="claim-id">
                    <span class="mono-id">#{{ s.id.substring(0, 6) }}</span>
                 </div>

                 <div class="claim-main">
                    <div class="font-bold text-sm">{{ s.membreNom }}</div>
                    <div class="text-xs text-muted">ID: MS-{{ s.id.substring(0,4) }} • {{ s.dateDeclaration | date:'dd MMM yyyy' }}</div>
                 </div>

                 <div class="claim-type">
                    <span class="ms-badge violet sm">{{ s.typeSinistre }}</span>
                 </div>

                 <div class="claim-amount">
                    <div class="font-bold">{{ s.montantDemande | number:'1.0-0' }} <small class="opacity-70">FCFA</small></div>
                 </div>

                 <div class="claim-status">
                    <span class="ms-badge" [class]="getBadgeClass(s.statut)">
                       <i class="bi bi-circle-fill mr-1" style="font-size: 6px;"></i> {{ getStatutLabel(s.statut) }}
                    </span>
                 </div>

                 <div class="claim-actions">
                    <div class="flex justify-end gap-2">
                       <button class="ms-btn sm amber" (click)="onConfirmMember(s); $event.stopPropagation()" *ngIf="s.statut === 'SOUMIS' && hasRole(['ADMIN', 'MEMBRE'])">
                           Confirmer
                       </button>

                       <button class="ms-btn sm success" (click)="onInstruire(s); $event.stopPropagation()" *ngIf="s.statut === 'CONFIRME_MEMBRE' && hasRole(['ADMIN', 'AGENT'])">
                           Instruire
                       </button>

                       <button class="ms-btn sm primary" (click)="onView(s); $event.stopPropagation()" *ngIf="s.statut === 'EN_VALIDATION' && hasRole(['ADMIN', 'TRESORIER'])">
                           Approuver
                       </button>
                       <i class="bi bi-chevron-right text-muted opacity-30"></i>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <!-- ─── PAGINATION ─── -->
        <div class="p-3 border-top flex justify-between items-center bg-surface2">
          <div class="text-xs text-muted">Page 1 sur 1</div>
          <div class="flex gap-1">
            <button class="ms-btn sm" disabled><i class="bi bi-chevron-left"></i></button>
            <button class="ms-btn sm primary">1</button>
            <button class="ms-btn sm" disabled><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <app-sinistre-form *ngIf="showForm()"
      [preselectedMember]="preselectedMember()"
      (close)="showForm.set(false)"
      (saved)="fetchSinistres()">
    </app-sinistre-form>

    <app-qr-scanner-modal *ngIf="showScanner()"
      (close)="showScanner.set(false)"
      (memberScanned)="onMemberScanned($event)">
    </app-qr-scanner-modal>

    <!-- Dossier Detail (Treasurer view) -->
    <app-sinistre-detail *ngIf="showDetailModal()"
      [sinistre]="selectedSinistre()"
      (close)="showDetailModal.set(false)"
      (approve)="onApprouver($event)">
    </app-sinistre-detail>

    <!-- Simulation Confirmation Membre -->
    <app-sinistre-member-confirm *ngIf="showConfirmModal()"
      [sinistre]="selectedSinistre()"
      (close)="showConfirmModal.set(false)"
      (confirmedEvent)="onMemberConfirmed()">
    </app-sinistre-member-confirm>
  `,
  styles: [`
    .premium-tab {
      padding: 12px 20px; border: none; background: none; cursor: pointer;
      font-size: 13.5px; font-weight: 600; color: var(--muted);
      border-radius: 10px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .premium-tab:hover { background: var(--surface); color: var(--blue-primary); }
    .premium-tab.active { background: #FFFFFF; color: var(--blue-primary); box-shadow: var(--sh-premium); }
    .p-tab-badge { font-size: 10px; background: var(--surface2); color: var(--text-2); padding: 2px 8px; border-radius: 99px; }
    .p-tab-badge.amber { background: #FFF7ED; color: #F59E0B; }

    .claim-item-row {
      display: grid; grid-template-columns: 80px 1fr 140px 120px 180px 180px;
      align-items: center; padding: 16px 20px; background: white;
      border: 1px solid var(--border); border-radius: 16px;
      cursor: pointer; transition: all 0.2s; margin-bottom: 8px;
    }
    .claim-item-row:hover { border-color: var(--teal-primary); box-shadow: var(--sh-premium); transform: translateX(4px); }

    .mono-id { font-family: var(--mono); font-size: 11px; color: var(--muted); background: var(--surface2); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border); }
    .tb-search { display: flex; align-items: center; background: var(--surface2); border: 1px solid var(--border); transition: all 0.2s; }
    .tb-search:focus-within { background: white; border-color: var(--blue-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

    .empty-icon { font-size: 48px; color: var(--muted); opacity: 0.5; }
    .activity-loader { display: inline-flex; gap: 8px; align-items: center; justify-content: center; }
    .activity-loader .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue-primary); box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); animation: bounce 0.8s infinite ease-in-out; }
    .activity-loader .dot:nth-child(2) { animation-delay: 0.1s; }
    .activity-loader .dot:nth-child(3) { animation-delay: 0.2s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class SinistreListComponent implements OnInit, OnDestroy {
  private sinistreService = inject(SinistreService);
  private toast = inject(ToastService);
  private globalActionService = inject(GlobalActionService);
  private authService = inject(AuthService);
  private sub = new Subscription();

  sinistres = signal<Sinistre[]>([]);
  loading = signal(true);
  currentStatut = signal('');
  countPending = signal(0);
  countSoumis = signal(0);
  searchQuery = '';
  showForm = signal(false);

  userRole = signal<string | null>(null);

  showConfirmModal = signal(false);
  showDetailModal = signal(false);
  selectedSinistre = signal<Sinistre | null>(null);

  showScanner = signal(false);
  preselectedMember = signal<Membre | null>(null);

  isProvider(): boolean {
    return this.userRole() === 'PRESTATAIRE';
  }

  ngOnInit() {
    this.authService.getRole().subscribe(role => this.userRole.set(role));
    this.fetchSinistres();

    this.sub.add(this.globalActionService.actionTriggered$.subscribe(action => {
      if (action === 'Déclarer un sinistre') {
        this.onAdd();
      }
    }));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  hasRole(roles: string[]): boolean {
    const current = this.userRole();
    return !!current && roles.includes(current);
  }

  fetchSinistres() {
    this.loading.set(true);
    this.sinistreService.getSinistres(this.currentStatut()).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : (res.content || []);
        this.sinistres.set(data);
        const pending = data.filter((s: any) => s.statut === 'CONFIRME_MEMBRE').length;
        this.countPending.set(pending);
        const soumis = data.filter((s: any) => s.statut === 'SOUMIS').length;
        this.countSoumis.set(soumis);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilter(statut: string) {
    this.currentStatut.set(statut);
    this.fetchSinistres();
  }

  onAdd() {
    this.preselectedMember.set(null);
    this.showForm.set(true);
  }

  onMemberScanned(member: Membre) {
    this.showScanner.set(false);
    this.preselectedMember.set(member);
    this.showForm.set(true);
  }

  onConfirmMember(s: Sinistre) {
    this.selectedSinistre.set(s);
    this.showConfirmModal.set(true);
  }

  onView(s: Sinistre) {
    this.selectedSinistre.set(s);
    this.showDetailModal.set(true);
  }

  onMemberConfirmed() {
    // Dans la vraie app, cet appel serait fait par l'API mobile.
    // Ici on simule le passage du statut OUVERT à CONFIRME_MEMBRE
    if (this.selectedSinistre()) {
      const s = this.selectedSinistre()!;
      if (s.statut === 'SOUMIS') {
        this.sinistreService.confirmeSinistre(s.id).subscribe(() => {
          this.fetchSinistres();
        });
      }
    }
  }

  onInstruire(sinistre: Sinistre) {
    if (confirm(`Transmettre en validation au Trésorier ?\nLe membre a déjà payé les ${sinistre.montantDemande} FCFA à la clinique.`)) {
      this.sinistreService.instruireSinistre(sinistre.id).subscribe(() => {
        this.fetchSinistres();
      });
    }
  }

  onApprouver(sinistre: Sinistre) {
    const montantStr = prompt(`Paiement de ${sinistre.montantDemande} FCFA par T-Money à ${sinistre.membreNom}.\nConfirmer le montant final :`, sinistre.montantDemande.toString());
    if (montantStr) {
      const montant = parseFloat(montantStr);
      this.sinistreService.approuverSinistre(sinistre.id, montant).subscribe(() => {
        this.toast.success('Dossier approuvé ! Prêt pour le virement dans "Remboursements".');
        this.showDetailModal.set(false);
        this.fetchSinistres();
      });
    }
  }

  onRejeter(sinistre: Sinistre) {
    const motif = prompt("Motif du rejet :");
    if (motif) {
      this.sinistreService.rejeterSinistre(sinistre.id, motif).subscribe(() => {
        this.toast.error('Dossier rejeté', 'Rejeté');
        this.showDetailModal.set(false);
        this.fetchSinistres();
      });
    }
  }

  onExport() {
    this.toast.info('Exportation des dossiers en cours...');
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'SOUMIS': return 'blue';
      case 'CONFIRME_MEMBRE': return 'amber';
      case 'EN_VALIDATION': return 'violet';
      case 'APPROUVE': return 'green';
      case 'REMBOURSE': return 'gray';
      case 'REJETE': return 'red';
      default: return 'gray';
    }
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'SOUMIS': 'Déclaré (À confirmer)',
      'CONFIRME_MEMBRE': 'Confirmé par Membre',
      'EN_VALIDATION': 'Expertise Trésorier',
      'APPROUVE': 'Virement ordonné',
      'REMBOURSE': 'Remboursé',
      'REJETE': 'Rejeté'
    };
    return labels[statut] || statut;
  }

  trackById(index: number, item: Sinistre) {
    return item.id;
  }
}

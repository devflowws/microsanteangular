import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { SinistreService, Sinistre } from '../../services/sinistre.service';
import { AuthService } from '../../services/auth.service';
import { MembreService } from '../../services/membre.service';
import { SinistreMemberConfirmComponent } from '../sinistre-list/sinistre-member-confirm.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-member-sinistres',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, SinistreMemberConfirmComponent],
  template: `
    <div class="dash-content">

      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-end mb-6">
        <div>
          <h1 class="font-bold text-2xl mb-1">Mes Dossiers de Soins</h1>
          <p class="text-muted text-sm">Retrouvez ici tous vos sinistres déclarés et confirmez votre remboursement.</p>
        </div>
        <div class="wallet-badge">
          <div class="text-xs text-muted uppercase font-bold tracking-wider">Mon Solde Disponible</div>
          <div class="font-bold text-xl text-blue">
            {{ (memberBalance() || 0) | number:'1.0-0' }} <small>FCFA</small>
          </div>
        </div>
      </div>

      <!-- ─── ALERT : À CONFIRMER ─── -->
      <div class="ms-alert amber mb-6" *ngIf="sinistresAConfirmer().length > 0">
        <div class="flex items-center gap-3">
          <i class="bi bi-bell-fill text-xl"></i>
          <div>
            <div class="font-bold">Action requise !</div>
            <div class="text-sm font-medium">
              Vous avez {{ sinistresAConfirmer().length }} soin(s) déclaré(s) par votre clinique en attente de votre confirmation.
            </div>
          </div>
        </div>
      </div>

      <!-- ─── FILTER TABS ─── -->
      <div class="ms-card mb-6">
        <div class="flex border-b px-4">
          <button class="tab-btn" [class.active]="activeTab() === 'tous'" (click)="activeTab.set('tous')">
            Tous les dossiers
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'action'" (click)="activeTab.set('action')">
            À confirmer <span class="tab-badge" *ngIf="sinistresAConfirmer().length > 0">{{ sinistresAConfirmer().length }}</span>
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'cours'" (click)="activeTab.set('cours')">En cours</button>
          <button class="tab-btn" [class.active]="activeTab() === 'termines'" (click)="activeTab.set('termines')">Terminés</button>
        </div>

        <!-- ─── LISTE CARDS ─── -->
        <div class="p-4">

          <div *ngIf="loading()" class="p-8 text-center">
            <div class="table-loader mx-auto mb-2">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
            <div class="text-muted text-sm">Chargement de vos dossiers...</div>
          </div>

          <div *ngIf="!loading() && filteredSinistres().length === 0" class="p-10 text-center text-muted">
            <i class="bi bi-folder-x text-4xl mb-3 block text-muted opacity-40"></i>
            <div class="font-bold mb-1">Aucun dossier trouvé</div>
            <div class="text-sm">Votre clinique n'a pas encore déclaré de sinistre en votre nom.</div>
          </div>

          <div class="sinistre-cards" *ngIf="!loading() && filteredSinistres().length > 0">
            <div class="sinistre-card" *ngFor="let s of filteredSinistres()" [class.needs-action]="s.statut === 'SOUMIS'">

              <!-- Card Header -->
              <div class="card-header">
                <div class="flex items-center gap-3">
                  <div class="type-icon" [class]="getTypeIconClass(s.typeSinistre)">
                    <i [class]="getTypeIcon(s.typeSinistre)"></i>
                  </div>
                  <div>
                    <div class="font-bold text-sm">{{ s.typeSinistre }}</div>
                    <div class="text-xs text-muted">#{{ s.id.substring(0, 8).toUpperCase() }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="ms-badge" [class]="getBadgeClass(s.statut)">{{ getStatutLabel(s.statut) }}</span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="card-body">
                <div class="amount-row">
                  <div>
                    <div class="text-xs text-muted">Montant demandé</div>
                    <div class="font-bold text-lg">{{ s.montantDemande | number:'1.0-0' }} <small>FCFA</small></div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-muted">Date de déclaration</div>
                    <div class="font-bold text-sm">{{ s.dateDeclaration | date:'dd MMM yyyy' }}</div>
                  </div>
                </div>

                <div class="description-box" *ngIf="s.description">
                  <i class="bi bi-card-text text-muted"></i>
                  <span class="text-sm">{{ s.description }}</span>
                </div>

                <!-- Timeline Progress -->
                <div class="timeline-progress">
                  <div class="step" [class.done]="isStepDone(s.statut, 1)" [class.current]="s.statut === 'SOUMIS'">
                    <div class="step-dot"><i class="bi bi-1-circle-fill" *ngIf="isStepDone(s.statut, 1)"></i><span *ngIf="!isStepDone(s.statut, 1)">1</span></div>
                    <div class="step-label">Déclaré</div>
                  </div>
                  <div class="step-line" [class.done]="isStepDone(s.statut, 2)"></div>
                  <div class="step" [class.done]="isStepDone(s.statut, 2)" [class.current]="s.statut === 'CONFIRME_MEMBRE'">
                    <div class="step-dot">2</div>
                    <div class="step-label">Confirmé</div>
                  </div>
                  <div class="step-line" [class.done]="isStepDone(s.statut, 3)"></div>
                  <div class="step" [class.done]="isStepDone(s.statut, 3)" [class.current]="s.statut === 'EN_VALIDATION'">
                    <div class="step-dot">3</div>
                    <div class="step-label">En expertise</div>
                  </div>
                  <div class="step-line" [class.done]="isStepDone(s.statut, 4)"></div>
                  <div class="step" [class.done]="isStepDone(s.statut, 4)">
                    <div class="step-dot">4</div>
                    <div class="step-label">Remboursé</div>
                  </div>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="card-footer">
                <!-- Action: Confirmer (SOUMIS) -->
                <button class="ms-btn primary w-full py-3" *ngIf="s.statut === 'SOUMIS'" (click)="onConfirmer(s)">
                  <i class="bi bi-shield-check"></i> Confirmer mes soins & demander le remboursement
                </button>
                <!-- Status Info -->
                <div class="status-info" *ngIf="s.statut !== 'SOUMIS'">
                  <i class="bi bi-info-circle text-muted"></i>
                  <span class="text-sm text-muted">{{ getStatusMessage(s.statut) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── MODAL CONFIRMATION ─── -->
    <app-sinistre-member-confirm
      *ngIf="showConfirmModal()"
      [sinistre]="selectedSinistre()"
      (close)="showConfirmModal.set(false)"
      (confirmedEvent)="onMemberConfirmed()">
    </app-sinistre-member-confirm>
  `,
  styles: [`
    .wallet-badge {
      background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
      border: 1px solid #BFDBFE;
      border-radius: 12px;
      padding: 12px 20px;
      text-align: right;
    }
    .text-blue { color: #2563EB; }

    .tab-btn {
      padding: 14px 16px; border: none; background: none; cursor: pointer;
      font-size: 13px; font-weight: 500; color: var(--muted);
      position: relative; transition: color .2s;
    }
    .tab-btn.active { color: var(--blue-primary); font-weight: 700; }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: 0; left: 16px; right: 16px;
      height: 2px; background: var(--blue-primary); border-radius: 2px;
    }
    .tab-badge {
      background: var(--amber-lite, #FFF7ED); color: #D97706;
      font-size: 10px; font-weight: 700; padding: 1px 6px;
      border-radius: 99px; margin-left: 4px;
    }

    .sinistre-cards { display: flex; flex-direction: column; gap: 16px; }

    .sinistre-card {
      border: 1px solid var(--border); border-radius: 16px;
      background: #fff; overflow: hidden; transition: all 0.2s;
    }
    .sinistre-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .sinistre-card.needs-action {
      border-color: #FCD34D;
      box-shadow: 0 0 0 3px rgba(252, 211, 77, 0.15);
    }

    .card-header {
      padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--border); background: var(--surface2);
    }
    .type-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .type-icon.maladie { background: #FEF9C3; color: #CA8A04; }
    .type-icon.accident { background: #FEE2E2; color: #DC2626; }
    .type-icon.maternite { background: #FCE7F3; color: #DB2777; }
    .type-icon.default { background: var(--surface2); color: var(--muted); }

    .card-body { padding: 20px; }
    .amount-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .description-box {
      display: flex; align-items: flex-start; gap: 8px;
      background: var(--surface2); border-radius: 8px; padding: 10px 12px;
      margin-bottom: 16px; border: 1px solid var(--border);
    }

    /* Timeline */
    .timeline-progress { display: flex; align-items: center; margin-top: 4px; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: #E2E8F0; color: #94A3B8;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; border: 2px solid #E2E8F0;
    }
    .step.done .step-dot { background: var(--blue-primary, #3B82F6); color: white; border-color: var(--blue-primary, #3B82F6); }
    .step.current .step-dot { background: white; color: var(--blue-primary, #3B82F6); border-color: var(--blue-primary, #3B82F6); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
    .step-label { font-size: 10px; color: var(--muted); white-space: nowrap; }
    .step-line { flex: 1; height: 2px; background: #E2E8F0; margin: 0 4px; margin-bottom: 12px; }
    .step-line.done { background: var(--blue-primary, #3B82F6); }

    .card-footer {
      padding: 16px 20px; border-top: 1px solid var(--border); background: var(--surface2);
    }
    .status-info { display: flex; align-items: center; gap: 8px; }
    .needs-action .card-footer { background: #FFFBEB; border-top-color: #FDE68A; }

    .table-loader { display: inline-flex; gap: 8px; align-items: center; }
    .table-loader .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue-primary, #3B82F6); box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); animation: bounce 0.8s infinite ease-in-out; }
    .table-loader .dot:nth-child(2) { animation-delay: 0.1s; }
    .table-loader .dot:nth-child(3) { animation-delay: 0.2s; }
    @keyframes bounce { 0%, 80%, 100% { transform: scale(0); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }

    .ms-alert.amber {
      background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px;
      display: flex; align-items: center; justify-content: space-between;
      color: #92400E;
    }
  `]
})
export class MemberSinistresComponent implements OnInit {
  private sinistreService = inject(SinistreService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private membreService = inject(MembreService);

  sinistres = signal<Sinistre[]>([]);
  loading = signal(true);
  activeTab = signal<'tous' | 'action' | 'cours' | 'termines'>('tous');
  memberBalance = signal<number>(0);

  showConfirmModal = signal(false);
  selectedSinistre = signal<Sinistre | null>(null);

  sinistresAConfirmer = computed(() => this.sinistres().filter(s => s.statut === 'SOUMIS'));

  ngOnInit() {
    this.fetchSinistres();
    this.loadBalance();
  }

  loadBalance() {
    this.membreService.getMe().subscribe({
      next: (m) => this.memberBalance.set(m.plafond || 0),
      error: () => { }
    });
  }

  fetchSinistres() {
    this.loading.set(true);
    this.sinistreService.getMesSinistres().subscribe({
      next: (data) => {
        this.sinistres.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }


  filteredSinistres() {
    const tab = this.activeTab();
    const all = this.sinistres();
    switch (tab) {
      case 'action': return all.filter(s => s.statut === 'SOUMIS');
      case 'cours': return all.filter(s => ['CONFIRME_MEMBRE', 'EN_VALIDATION'].includes(s.statut));
      case 'termines': return all.filter(s => ['APPROUVE', 'REMBOURSE', 'REJETE'].includes(s.statut));
      default: return all;
    }
  }

  onConfirmer(s: Sinistre) {
    this.selectedSinistre.set(s);
    this.showConfirmModal.set(true);
  }

  onMemberConfirmed() {
    const s = this.selectedSinistre();
    if (!s) return;
    this.sinistreService.confirmeSinistre(s.id).subscribe({
      next: () => {
        this.toast.success('Sinistre confirmé avec succès');
        this.showConfirmModal.set(false);
        this.fetchSinistres();
        this.loadBalance();
      },
      error: (err) => {
        this.toast.error('Erreur : ' + (err?.error?.message || 'Impossible de confirmer'));
        this.showConfirmModal.set(false);
      }
    });
  }

  isStepDone(statut: string, step: number): boolean {
    const steps: { [key: string]: number } = {
      'SOUMIS': 1, 'CONFIRME_MEMBRE': 2, 'EN_VALIDATION': 3, 'APPROUVE': 4, 'REMBOURSE': 4, 'REJETE': -1
    };
    return (steps[statut] || 0) >= step;
  }

  getBadgeClass(statut: string): string {
    const map: { [k: string]: string } = {
      'SOUMIS': 'amber', 'CONFIRME_MEMBRE': 'blue', 'EN_VALIDATION': 'violet',
      'APPROUVE': 'green', 'REMBOURSE': 'blue', 'REJETE': 'red'
    };
    return map[statut] || 'gray';
  }

  getStatutLabel(statut: string): string {
    const labels: { [k: string]: string } = {
      'SOUMIS': '⚡ À confirmer',
      'CONFIRME_MEMBRE': '✅ Confirmé',
      'EN_VALIDATION': '🔍 En expertise',
      'APPROUVE': '💸 Virement lancé',
      'REMBOURSE': '🎉 Remboursé',
      'REJETE': '❌ Rejeté'
    };
    return labels[statut] || statut;
  }

  getStatusMessage(statut: string): string {
    const msgs: { [k: string]: string } = {
      'CONFIRME_MEMBRE': 'Votre dossier est en attente de traitement par un agent.',
      'EN_VALIDATION': 'Le Trésorier examine votre dossier.',
      'APPROUVE': 'Le virement MoMo est en cours vers votre clinique.',
      'REMBOURSE': 'Vous avez été remboursé avec succès.',
      'REJETE': 'Votre dossier a été rejeté. Contactez un conseiller.'
    };
    return msgs[statut] || '';
  }

  getTypeIcon(type: string): string {
    const icons: { [k: string]: string } = {
      'MALADIE': 'bi bi-heart-pulse-fill',
      'ACCIDENT': 'bi bi-exclamation-triangle-fill',
      'MATERNITE': 'bi bi-gender-female',
      'DECES': 'bi bi-flower1'
    };
    return icons[type] || 'bi bi-clipboard2-pulse';
  }

  getTypeIconClass(type: string): string {
    const classes: { [k: string]: string } = {
      'MALADIE': 'maladie', 'ACCIDENT': 'accident', 'MATERNITE': 'maternite'
    };
    return classes[type] || 'default';
  }
}

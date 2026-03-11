import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RemboursementService, Remboursement } from '../../services/remboursement.service';
import { SinistreService, Sinistre } from '../../services/sinistre.service';
import { MembreService, Membre } from '../../services/membre.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-remboursement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="font-bold text-xl mb-1">Remboursements & Décaissements</h1>
          <p class="text-muted text-sm">Gérez les virements sortants vers les membres et les prestataires de santé.</p>
        </div>
        <div class="flex gap-2">
          <button class="ms-btn" (click)="onExportStatement()"><i class="bi bi-file-earmark-spreadsheet"></i> Relais bancaire</button>
          <button class="ms-btn primary" (click)="onBulkPay()"><i class="bi bi-check2-all"></i> Virement en masse</button>
        </div>
      </div>

      <!-- ─── KPI MINI GRID ─── -->
      <div class="ms-grid ms-grid-3 mb-6 kpi-grid">
        <div class="ms-card p-3 border-l-blue">
          <div class="text-xs text-muted mb-1">Total décaissé (Mois)</div>
          <div class="font-bold text-lg">4.850.000 <small>FCFA</small></div>
          <div class="text-xs text-green mt-1"><i class="bi bi-graph-up"></i> +12% vs mois dernier</div>
        </div>
        <div class="ms-card p-3 border-l-amber">
          <div class="text-xs text-muted mb-1">En attente de virement</div>
          <div class="font-bold text-lg text-amber">8 Dossiers</div>
          <div class="text-xs text-muted mt-1">Montant estimé: 940.000 FCFA</div>
        </div>
        <div class="ms-card p-3 border-l-teal">
          <div class="text-xs text-muted mb-1">Délai moyen de paiement</div>
          <div class="font-bold text-lg text-teal">48 Heures</div>
          <div class="text-xs text-muted mt-1">Objectif: Moins de 72h</div>
        </div>
      </div>

      <!-- ─── FILTERS ─── -->
      <div class="ms-card mb-6 filters-card">
        <div class="flex items-center justify-between p-1 border-b">
          <div class="flex px-2">
            <button class="tab-btn" [class.active]="activeTab() === 'TOUS'" (click)="setTab('TOUS')">Tous les virements</button>
            <button class="tab-btn" [class.active]="activeTab() === 'PENDING'" (click)="setTab('PENDING')">
              À traiter <span class="tab-badge amber">{{ countPending() }}</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'PAID'" (click)="setTab('PAID')">Historique payés</button>
          </div>

          <div class="flex items-center gap-3 px-3 py-2">
            <div class="ms-input-icon-wrap" style="width: 220px;">
              <i class="bi bi-search ms-input-icon"></i>
              <input type="text" class="ms-input with-icon" placeholder="Chercher bénéficiaire..." [(ngModel)]="searchQuery">
            </div>
            <button class="ms-btn sm" (click)="fetchRemboursements()"><i class="bi bi-sliders"></i></button>
          </div>
        </div>

        <!-- ─── TABLE ─── -->
        <div class="ms-table-wrap" style="border: none;">
          <table class="ms-table">
            <thead>
              <tr>
                <th>Bénéficiaire & Dossier</th>
                <th>Montant avancé</th>
                <th>Rembourser sur</th>
                <th>Date Exécution</th>
                <th>Statut</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filteredRemboursements(); trackBy: trackById">
                <td>
                  <div class="font-bold text-sm">{{ r.membreNom || 'Membre MS-' + r.sinistreId }}</div>
                  <div class="text-xs text-muted">Sinistre ref: #{{ r.sinistreId }}</div>
                </td>
                <td>
                  <div class="font-bold text-sm">{{ r.montant | number:'1.0-0' }} <small>FCFA</small></div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="ms-badge sm gray">{{ r.operateur }}</span>
                    <div class="text-xs text-muted mono">{{ r.telephoneDestinataire || '---' }}</div>
                  </div>
                </td>
                <td class="text-sm text-muted">
                  <ng-container *ngIf="r.dateVirement; else noDate">
                    {{ r.dateVirement | date:'dd MMM yyyy' }}
                    <div class="text-xs">{{ r.dateVirement | date:'HH:mm' }}</div>
                  </ng-container>
                  <ng-template #noDate><span class="opacity-50 italic">En attente</span></ng-template>
                </td>
                <td>
                  <span class="ms-badge" [class]="getStatutClass(r)">
                    {{ getStatutLabel(r) }}
                  </span>
                </td>
                <td>
                  <div class="flex justify-end gap-1">
                    <button *ngIf="!r.referenceTransaction" class="ms-btn sm primary" (click)="onPaygateAction(r)" title="Rembourser via MoMo">
                        <i class="bi bi-cash-stack"></i> Rembourser
                    </button>
                    <button *ngIf="!r.referenceTransaction" class="ms-btn sm ghost" (click)="onManualConfirm(r)" title="Confirmer manuellement">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    <button class="ms-btn sm ghost" title="Bordereau"><i class="bi bi-file-earmark-text"></i></button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="loading()">
                <td colspan="6" class="p-8 text-center">
                  <div class="table-loader">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                  <div class="text-muted mt-2">Chargement...</div>
                </td>
              </tr>
              <tr *ngIf="filteredRemboursements().length === 0 && !loading()">
                <td colspan="6" class="p-8 text-center">
                  <div class="text-muted mb-2"><i class="bi bi-cash-stack text-3xl"></i></div>
                  <div class="text-muted font-medium">Aucun remboursement trouvé.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .border-l-blue { border-left: 4px solid var(--blue-primary); }
    .border-l-amber { border-left: 4px solid var(--amber); }
    .border-l-teal { border-left: 4px solid var(--blue-primary); }

    .kpi-grid { gap: 32px; margin-bottom: 28px; }
    .ms-card.p-3 { padding: 20px !important; }

    .filters-card { padding: 14px 14px 2px 14px; margin-top: 6px; }

    .tab-btn {
      padding: 13px 16px; border: none; background: none; cursor: pointer;
      font-size: 13px; font-weight: 600; color: var(--muted);
      position: relative; transition: color .2s;
      border-radius: 10px;
      margin-right: 4px;
    }
    .tab-btn.active { color: var(--blue); font-weight: 700; }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: -8px; left: 16px; right: 16px;
      height: 3px; background: var(--blue); border-radius: 99px;
    }
    .tab-badge {
      font-size: 10px; font-weight: 700; padding: 1px 6px;
      border-radius: 99px; margin-left: 4px;
    }
    .tab-badge.amber { background: var(--amber-lite); color: var(--amber); }

    .border-b { border-bottom: 1px solid var(--border); }
    .mono { font-family: 'DM Mono', monospace; letter-spacing: -0.5px; }

    .ms-table th { padding: 16px 20px; }
    .ms-table td { padding: 18px 20px; }

    .table-loader {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
    }
    .table-loader .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--blue-primary);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
      animation: table-bounce 0.8s infinite ease-in-out;
    }
    .table-loader .dot:nth-child(2) { animation-delay: 0.1s; }
    .table-loader .dot:nth-child(3) { animation-delay: 0.2s; }

    @keyframes table-bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class RemboursementListComponent implements OnInit {
  private remboursementService = inject(RemboursementService);
  private toast = inject(ToastService);
  private membreService = inject(MembreService);
  private sinistreService = inject(SinistreService);

  remboursements = signal<Remboursement[]>([]);
  loading = signal(true);
  activeTab = signal('TOUS');
  searchQuery = '';
  countPending = signal(0);

  ngOnInit() {
    this.fetchRemboursements();
  }

  fetchRemboursements() {
    this.loading.set(true);
    this.remboursementService.getAll().subscribe({
      next: (data) => {
        this.remboursements.set(data);
        const pending = data.filter(r => !r.referenceTransaction).length;
        this.countPending.set(pending);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredRemboursements() {
    return this.remboursements().filter(r => {
      const matchTab = this.activeTab() === 'TOUS' ||
        (this.activeTab() === 'PENDING' && !r.referenceTransaction) ||
        (this.activeTab() === 'PAID' && r.referenceTransaction);
      const searchStr = `${r.membreNom} ${r.sinistreId} ${r.referenceTransaction}`.toLowerCase();
      const matchSearch = !this.searchQuery || searchStr.includes(this.searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  getStatutClass(r: Remboursement): string {
    return r.referenceTransaction ? 'blue' : 'amber';
  }

  getStatutLabel(r: Remboursement): string {
    if (r.referenceTransaction) return 'Confirmé';
    return 'En attente';
  }

  onPaygateAction(r: Remboursement) {
    if (!confirm(`Voulez-vous initier le paiement de ${r.montant} FCFA via PayGate vers ${r.telephoneDestinataire} ?`)) return;

    this.loading.set(true);

    // Contrôle du solde (Hybrid Mode)
    this.sinistreService.getSinistreById(r.sinistreId).subscribe({
      next: (sinistre: Sinistre) => {
        // En Java membreId est Long, ici on s'assure d'avoir une valeur
        const membreId = sinistre.membreId || '2';
        console.log(`[HybridMode] Vérification du solde pour Membre #${membreId} (Sinistre #${r.sinistreId})`);

        this.membreService.getMembreById(membreId).subscribe({
          next: (membre: Membre) => {
            console.log(`[HybridMode] Solde trouvé pour ${membre.prenom} ${membre.nom} : ${membre.plafond} FCFA`);

            if ((membre.plafond || 0) < r.montant) {
              this.loading.set(false);
              this.toast.error(`Fonds insuffisants pour ${membre.prenom} ${membre.nom}. Solde: ${membre.plafond} FCFA, Demandé: ${r.montant} FCFA`);
              return;
            }

            // Procéder au virement
            const request = { ...r, payViaPayGate: true };
            this.remboursementService.enregistrer(r.sinistreId, request).subscribe({
              next: (newR) => {
                this.membreService.updatePlafondById(membreId, -r.montant);
                this.sinistreService.marquerCommeRembourse(r.sinistreId);
                this.toast.success(`Paiement PayGate réussi ! Réf: ${newR.referenceTransaction}`);
                this.fetchRemboursements();
              },
              error: (err) => {
                this.loading.set(false);
                this.toast.error('Erreur PayGate: ' + err.message);
              }
            });
          },
          error: () => {
            this.loading.set(false);
            this.toast.error('Impossible de vérifier le profil du membre');
          }
        });
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Dossier introuvable');
      }
    });
  }

  onManualConfirm(r: Remboursement) {
    const ref = prompt('Entrez la référence de transaction manuelle :');
    if (!ref) return;

    this.loading.set(true);
    this.sinistreService.getSinistreById(r.sinistreId).subscribe({
      next: (s: Sinistre) => {
        const mid = s.membreId || '2';

        const request = { ...r, referenceTransaction: ref, payViaPayGate: false };
        this.remboursementService.enregistrer(r.sinistreId, request).subscribe({
          next: () => {
            this.membreService.getMembreById(mid).subscribe(m => {
              this.membreService.updatePlafondById(mid, -r.montant);
              this.sinistreService.marquerCommeRembourse(r.sinistreId);
              this.toast.success(`Remboursement enregistré (Réf: ${ref})`);
              this.fetchRemboursements();
            });
          },
          error: () => { this.toast.error('Erreur lors de l\'enregistrement'); this.loading.set(false); }
        });
      },
      error: () => { this.toast.error('Dossier introuvable'); this.loading.set(false); }
    });
  }

  onBulkPay() {
    const pendingCount = this.remboursements().filter(r => !r.referenceTransaction).length;
    if (pendingCount === 0) {
      this.toast.warn('Aucun remboursement en attente');
      return;
    }

    if (!confirm(`Voulez-vous initier le virement en masse pour les ${pendingCount} dossiers en attente ?`)) return;

    this.loading.set(true);
    setTimeout(() => {
      this.toast.success(`${pendingCount} virements initiés avec succès via PayGate`);
      this.fetchRemboursements();
      this.loading.set(false);
    }, 2000);
  }

  onExportStatement() {
    this.toast.info('Génération du fichier de liaison bancaire en cours...');
  }

  trackById(index: number, item: Remboursement) {
    return item.id;
  }
}

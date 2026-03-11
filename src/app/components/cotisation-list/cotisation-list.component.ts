import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CotisationService, Cotisation } from '../../services/cotisation.service';
import { MembreService } from '../../services/membre.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cotisation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="font-bold text-xl mb-1">{{ userRole() === 'MEMBRE' ? 'Mes Cotisations' : 'Suivi des Cotisations' }}</h1>
          <p class="text-muted text-sm">{{ userRole() === 'MEMBRE' ? 'Historique de vos paiements et statut de couverture.' : 'Gérez les encaissements mensuels et relancez les membres en retard.' }}</p>
        </div>
        <div class="flex gap-2" *ngIf="userRole() !== 'MEMBRE'">
          <button class="ms-btn" (click)="onExportPDF()"><i class="bi bi-file-earmark-pdf"></i> Rapport financier</button>
          <button class="ms-btn primary" (click)="onAddPayment()"><i class="bi bi-plus-lg"></i> Enregistrer un paiement</button>
        </div>
        <div class="flex gap-2" *ngIf="userRole() === 'MEMBRE' && (env.simulationMode || env.mockPayments)">
          <button class="ms-btn primary" (click)="onAddPayment()"><i class="bi bi-plus-lg"></i> Effectuer un paiement (Sim)</button>
        </div>
      </div>

      <!-- ─── KPI MINI GRID (Hidden for members if simple view) ─── -->
      <div class="ms-grid ms-grid-3 mb-6 kpi-grid" *ngIf="userRole() !== 'MEMBRE'">
        <div class="ms-card kpi-card">
          <div class="text-xs text-muted mb-1">Total Collecté (Mois)</div>
          <div class="font-bold text-lg">1.250.000 FCFA</div>
          <div class="progress-bar-small mt-2"><div class="fill green" style="width: 85%"></div></div>
          <div class="text-xs text-muted mt-1">85% de l'objectif</div>
        </div>
        <div class="ms-card kpi-card">
          <div class="text-xs text-muted mb-1">Membres en retard</div>
          <div class="font-bold text-lg text-red">14 Membres</div>
          <div class="text-xs text-muted mt-1">Estimé: 280.000 FCFA à recouvrer</div>
        </div>
        <div class="ms-card kpi-card">
          <div class="text-xs text-muted mb-1">Dernière relance SMS</div>
          <div class="font-bold text-lg text-blue">Hier, 14:20</div>
          <button class="ms-btn sm w-full mt-2 amber" (click)="onSendReminders()"><i class="bi bi-send"></i> Relancer les impayés</button>
        </div>
      </div>

      <!-- ─── FILTERS ─── -->
      <div class="ms-card mb-6 filters-card">
        <div class="flex items-center justify-between px-3 py-3 border-b">
          <div class="flex px-1 tabs-row">
            <button class="tab-btn" [class.active]="activeTab() === 'TOUS'" (click)="setTab('TOUS')">Tous les paiements</button>
            <button class="tab-btn" [class.active]="activeTab() === 'RETARD'" (click)="setTab('RETARD')">
              En retard <span class="tab-badge" *ngIf="countRetard() > 0">{{ countRetard() }}</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'MOIS'" (click)="setTab('MOIS')">Mois en cours</button>
          </div>

          <div class="flex items-center gap-3 px-2 py-1 search-row">
            <div class="ms-input-icon-wrap" style="width: 220px;">
              <i class="bi bi-search ms-input-icon"></i>
              <input type="text" class="ms-input with-icon" placeholder="Chercher membre..." [(ngModel)]="searchQuery">
            </div>
            <button class="ms-btn sm" (click)="fetchCotisations()"><i class="bi bi-funnel"></i></button>
          </div>
        </div>

        <!-- ─── TABLE ─── -->
        <div class="ms-table-wrap" style="border: none;">
          <table class="ms-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Mois / Période</th>
                <th>Montant</th>
                <th>Date de Paiement</th>
                <th>Statut</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCotisations(); trackBy: trackById">
                <td>
                  <div class="font-bold text-sm">{{ c.membreNom }}</div>
                  <div class="text-xs text-muted">ID: MS-{{ c.membreId }}</div>
                </td>
                <td>
                  <span class="text-sm font-semibold">{{ c.moisCorrespondant }}</span>
                </td>
                <td>
                  <div class="font-bold text-sm">{{ c.montant | number:'1.0-0' }} <small>FCFA</small></div>
                </td>
                <td class="text-sm text-muted">
                  {{ c.datePaiement | date:'dd MMM yyyy, HH:mm' }}
                </td>
                <td>
                  <span class="ms-badge" [class]="c.estEnRetard ? 'amber' : 'green'">
                    {{ c.estEnRetard ? 'En Retard' : 'À jour' }}
                  </span>
                </td>
                <td>
                  <div class="flex justify-end gap-1">
                    <button class="ms-btn sm ghost"><i class="bi bi-printer"></i></button>
                    <button class="ms-btn sm ghost"><i class="bi bi-three-dots"></i></button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="loading()">
                <td colspan="6" class="p-4 text-center">
                  <div class="table-loader">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                  <div class="text-muted mt-2">Chargement...</div>
                </td>
              </tr>
              <tr *ngIf="filteredCotisations().length === 0 && !loading()">
                <td colspan="6" class="p-4 text-center text-muted">Aucun paiement trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ─── PAGINATION ─── -->
        <div class="p-4 border-top flex justify-between items-center bg-surface2">
          <div class="text-xs text-muted">Affichage de {{ filteredCotisations().length }} paiements</div>
          <div class="flex gap-1">
            <button class="ms-btn sm" disabled><i class="bi bi-chevron-left"></i></button>
            <button class="ms-btn sm primary">1</button>
            <button class="ms-btn sm" disabled><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-red { color: var(--red); }
    .text-blue { color: var(--blue); }

    .kpi-grid { gap: 32px; margin-bottom: 28px; }
    .kpi-card { padding: 20px 22px; min-height: 140px; }
    .kpi-card .text-lg { font-size: 20px; }

    .filters-card { padding: 14px 14px 2px 14px; margin-top: 6px; }
    .tabs-row { gap: 8px; }
    .search-row { gap: 12px; }

    .tab-btn {
      padding: 13px 16px; border: none; background: none; cursor: pointer;
      font-size: 13px; font-weight: 600; color: var(--muted);
      position: relative; transition: color .2s;
      border-radius: 10px;
      margin-right: 4px;
    }
    .tab-btn:hover { background: var(--surface2); }
    .tab-btn.active { color: var(--blue); font-weight: 700; }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: -8px; left: 16px; right: 16px;
      height: 3px; background: var(--blue); border-radius: 99px;
    }
    .tab-badge {
      background: var(--amber-lite); color: var(--amber);
      font-size: 10px; font-weight: 700; padding: 1px 6px;
      border-radius: 99px; margin-left: 4px;
    }

    .progress-bar-small {
      height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden;
    }
    .progress-bar-small .fill { height: 100%; border-radius: 3px; }
    .progress-bar-small .fill.green { background: var(--blue-primary); }

    .border-b { border-bottom: 1px solid var(--border); }
    .border-top { border-top: 1px solid var(--border); }
    .ms-input-icon-wrap { position: relative; }

    .table-loader { display: inline-flex; gap: 8px; align-items: center; justify-content: center; }
    .table-loader .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue-primary); box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); animation: table-bounce 0.8s infinite ease-in-out; }
    .table-loader .dot:nth-child(2) { animation-delay: 0.1s; }
    .table-loader .dot:nth-child(3) { animation-delay: 0.2s; }

    @keyframes table-bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class CotisationListComponent implements OnInit {
  private cotisationService = inject(CotisationService);
  private toast = inject(ToastService);
  private membreService = inject(MembreService);
  private authService = inject(AuthService);
  env = environment as any;

  cotisations = signal<Cotisation[]>([]);
  loading = signal(true);
  activeTab = signal('TOUS');
  searchQuery = '';
  countRetard = signal(0);
  userRole = signal<string | null>(null);

  ngOnInit() {
    this.authService.getRole().subscribe(role => {
      this.userRole.set(role);
      this.fetchCotisations();
    });
  }

  fetchCotisations() {
    this.loading.set(true);
    const role = this.userRole();
    const obs = (role === 'MEMBRE')
      ? this.cotisationService.getCotisationsByMembre(this.membreService.currentUserSubjectValue?.id || 0)
      : this.cotisationService.getAllCotisations();

    obs.subscribe({
      next: (data) => {
        this.cotisations.set(data);
        this.countRetard.set(data.filter(c => c.estEnRetard).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredCotisations() {
    return this.cotisations().filter(c => {
      const matchTab = this.activeTab() === 'TOUS' || (this.activeTab() === 'RETARD' && c.estEnRetard);
      const matchSearch = !this.searchQuery || c.membreNom.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  onAddPayment() {
    if (environment.simulationMode || (environment as any).mockPayments) {
      const amount = 5000;
      if (confirm(`SIMULATION : Enregistrer un paiement de ${amount} FCFA ?`)) {
        this.loading.set(true);
        this.cotisationService.payerCotisation({
          membreId: this.membreService.currentUserSubjectValue?.id || 1,
          montant: amount,
          datePaiement: new Date().toISOString(),
          moisCorrespondant: 'Mars 2026'
        }).subscribe({
          next: (c) => {
            this.membreService.updatePlafondLocal(amount);
            this.fetchCotisations();
            this.toast.success(`Paiement de ${amount} FCFA effectué ! Votre plafond a été augmenté.`);
          },
          error: () => { this.toast.error('Erreur lors du paiement'); this.loading.set(false); }
        });
      }
    } else {
      this.toast.warn('Saisie réelle non configurée pour cette démo');
    }
  }

  onSendReminders() {
    if (confirm('Voulez-vous envoyer une relance SMS aux 14 membres en retard ?')) {
      this.toast.success('Relances envoyées avec succès');
    }
  }

  onExportPDF() {
    this.toast.info('Génération du rapport financier en cours...');
  }

  trackById(index: number, item: Cotisation) {
    return item.id;
  }
}

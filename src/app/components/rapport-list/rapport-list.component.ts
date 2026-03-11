import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RapportService, Report } from '../../services/rapport.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-rapport-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="dash-content">
      <!-- ─── LOGO HEADER ─── -->
      <div class="logo-header mb-6">
        <div class="logo-mark">
          <i class="bi bi-hospital"></i>
        </div>
        <div class="logo-text">
          <h2>Micro<span>Santé+</span></h2>
          <p>Rapports & Statistiques</p>
        </div>
      </div>

      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="font-bold text-xl mb-1">Rapports & Statistiques</h1>
          <p class="text-muted text-sm">Générez et consultez les synthèses financières et opérationnelles.</p>
        </div>
        <button class="ms-btn primary" (click)="generating.set(true)" [disabled]="loading()">
          <i class="bi" [class]="loading() ? 'bi-hourglass-split' : 'bi-plus-circle'"></i>
          {{ loading() ? 'Génération en cours...' : 'Générer un rapport' }}
        </button>
      </div>

      <!-- ─── QUICK STATS ─── -->
      <div class="ms-grid ms-grid-3 mb-6">
        <div class="ms-card report-kpi">
          <div class="flex items-center gap-3">
            <div class="icon teal"><i class="bi bi-file-earmark-check"></i></div>
            <div>
              <div class="text-2xl font-bold">12</div>
              <div class="text-xs text-muted font-semibold uppercase tracking-wider">Rapports archivés</div>
            </div>
          </div>
        </div>
        <div class="ms-card report-kpi">
           <div class="flex items-center gap-3">
            <div class="icon blue"><i class="bi bi-graph-up-arrow"></i></div>
            <div>
              <div class="text-2xl font-bold">100%</div>
              <div class="text-xs text-muted font-semibold uppercase tracking-wider">Fiabilité des données</div>
            </div>
          </div>
        </div>
        <div class="ms-card report-kpi">
           <div class="flex items-center gap-3">
            <div class="icon amber"><i class="bi bi-clock-history"></i></div>
            <div>
              <div class="text-2xl font-bold">Dernier: Hier</div>
              <div class="text-xs text-muted font-semibold uppercase tracking-wider">Mise à jour caisse</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <!-- ─── GENERATION WIZARD (Overlay behavior if generating) ─── -->
        <div class="ms-card col-span-12 lg:col-span-12" *ngIf="generating()">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="font-bold text-sm uppercase">Nouveau Rapport</h3>
                <button class="close-btn" (click)="generating.set(false)">×</button>
            </div>
            <div class="p-6">
                <div class="flex gap-4 mb-6">
                    <div class="type-option" [class.active]="selectedType === 'MONTHLY'" (click)="selectedType = 'MONTHLY'">
                        <i class="bi bi-calendar3"></i>
                        <span>Mensuel</span>
                    </div>
                    <div class="type-option" [class.active]="selectedType === 'CLAIMS'" (click)="selectedType = 'CLAIMS'">
                        <i class="bi bi-shield-check"></i>
                        <span>Sinistres</span>
                    </div>
                    <div class="type-option" [class.active]="selectedType === 'ANNUAL'" (click)="selectedType = 'ANNUAL'">
                        <i class="bi bi-trophy"></i>
                        <span>Annuel</span>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <button class="ms-btn ghost" (click)="generating.set(false)">Annuler</button>
                    <button class="ms-btn primary" (click)="onGenerate()">Lancer la génération</button>
                </div>
            </div>
        </div>

        <!-- ─── LIST OF ARCHIVED REPORTS ─── -->
        <div class="ms-card col-span-12">
            <div class="p-4 border-b">
                <h3 class="font-bold text-sm uppercase tracking-wider text-muted">Historique des Rapports</h3>
            </div>
            <div class="p-0 overflow-x-auto">
                <table class="ms-table">
                    <thead>
                        <tr>
                            <th>Titre du Rapport</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Statut</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let r of reports()">
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-surface2 rounded"><i class="bi bi-file-pdf text-red"></i></div>
                                    <span class="font-semibold">{{ r.title }}</span>
                                </div>
                            </td>
                            <td>{{ r.date | date:'longDate' }}</td>
                            <td>
                                <span class="ms-badge sm gray">{{ r.type }}</span>
                            </td>
                            <td>
                                <span class="ms-badge sm" [class]="r.status === 'GENERATED' ? 'green' : 'amber'">
                                    {{ r.status === 'GENERATED' ? 'Disponible' : 'En cours' }}
                                </span>
                            </td>
                            <td class="text-right">
                                <button class="ms-btn sm ghost" (click)="onDownload(r)"><i class="bi bi-download"></i></button>
                                <button class="ms-btn sm ghost text-red"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                        <tr *ngIf="loading()">
                            <td colspan="5" class="text-center p-8">
                                <div class="table-loader">
                                    <span class="dot"></span>
                                    <span class="dot"></span>
                                    <span class="dot"></span>
                                </div>
                                <div class="text-muted mt-2">Chargement...</div>
                            </td>
                        </tr>
                        <tr *ngIf="reports().length === 0 && !loading()">
                            <td colspan="5" class="text-center p-8 text-muted">Aucun rapport archivé.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .logo-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: linear-gradient(135deg, #0D6EFD 0%, #0D9488 100%);
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(13, 110, 253, 0.2);
      margin-bottom: 28px;
    }

    .logo-mark {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
      color: #0D6EFD;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .logo-text {
      flex: 1;
    }

    .logo-text h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }

    .logo-text h2 span {
      color: #60A5FA;
      font-weight: 700;
    }

    .logo-text p {
      margin: 4px 0 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }

    .report-kpi { padding: 1.25rem; }
    .report-kpi .icon {
        width: 48px; height: 48px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.5rem;
    }
    .icon.teal { background: rgba(59, 130, 246, 0.15); color: var(--blue-primary); }
    .icon.blue { background: rgba(59, 130, 246, 0.15); color: var(--blue-primary); }
    .icon.amber { background: var(--amber-lite); color: var(--amber); }

    .type-option {
        flex: 1; padding: 1.5rem; border: 1px solid var(--border); border-radius: 12px;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        cursor: pointer; transition: all .2s;
    }
    .type-option i { font-size: 2rem; color: var(--muted); }
    .type-option span { font-weight: 600; color: var(--muted); }
    .type-option:hover { border-color: var(--blue-primary); background: var(--surface2); }
    .type-option.active { border-color: var(--blue-primary); background: rgba(59, 130, 246, 0.1); }
    .type-option.active i, .type-option.active span { color: var(--blue-primary); }

    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--muted); cursor: pointer; }
    .text-red { color: var(--red); }
    .bg-surface2 { background: var(--surface2); }

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
export class RapportListComponent implements OnInit {
    private rapportService = inject(RapportService);
    private toast = inject(ToastService);

    reports = signal<Report[]>([]);
    loading = signal(false);
    generating = signal(false);
    selectedType: 'MONTHLY' | 'ANNUAL' | 'CLAIMS' = 'MONTHLY';

    ngOnInit() {
        this.fetchReports();
    }

    fetchReports() {
        this.loading.set(true);
        this.rapportService.getArchivedReports().subscribe({
            next: (data) => {
                this.reports.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    onGenerate() {
        this.loading.set(true);
        this.generating.set(false);
        this.rapportService.generateReport(this.selectedType).subscribe({
            next: (report) => {
                this.reports.update(prev => [report, ...prev]);
                this.loading.set(false);
                this.toast.success('Rapport généré avec succès');
            },
            error: () => { this.toast.error('Erreur lors de la génération du rapport'); this.loading.set(false); }
        });
    }

    onDownload(r: Report) {
        this.toast.info(`Téléchargement de ${r.title} en cours...`);
    }
}

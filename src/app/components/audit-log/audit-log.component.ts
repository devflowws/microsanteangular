import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService, AuditLog } from '../../services/audit.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-audit-log',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="font-bold text-xl mb-1">Journal d'Audit</h1>
          <p class="text-muted text-sm">Traçabilité complète des actions effectuées par le personnel administratif.</p>
        </div>
        <button class="ms-btn" (click)="fetchLogs()"><i class="bi bi-arrow-clockwise"></i> Actualiser</button>
      </div>

      <!-- ─── FILTERS ─── -->
      <div class="ms-card mb-4">
        <div class="flex items-center gap-4 p-4">
             <div class="ms-input-icon-wrap flex-1">
                <i class="bi bi-search ms-input-icon"></i>
                <input type="text" class="ms-input with-icon" placeholder="Filtrer par utilisateur, action ou entité..." [(ngModel)]="searchQuery">
            </div>
            <select class="ms-input" style="width: 180px;" [(ngModel)]="filterAction">
                <option value="">Toutes les actions</option>
                <option value="CREATE">Création</option>
                <option value="UPDATE">Modification</option>
                <option value="DELETE">Suppression</option>
                <option value="LOGIN">Connexion</option>
            </select>
        </div>

        <div class="p-0 overflow-x-auto">
          <table class="ms-table">
            <thead>
              <tr>
                <th>Horodatage</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of filteredLogs()">
                <td>
                    <div class="text-xs font-mono text-muted">{{ log.timestamp | date:'dd/MM/yyyy' }}</div>
                    <div class="font-bold">{{ log.timestamp | date:'HH:mm:ss' }}</div>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <div class="avatar sm">{{ log.utilisateur.charAt(0).toUpperCase() }}</div>
                        <span class="text-sm font-medium">{{ log.utilisateur }}</span>
                    </div>
                </td>
                <td>
                    <span class="ms-badge sm" [ngClass]="getActionClass(log.action)">
                        {{ log.action }}
                    </span>
                </td>
                <td><span class="text-xs font-bold uppercase tracking-tighter opacity-70">{{ log.entite }}</span></td>
                <td>
                    <div class="text-sm max-w-md truncate hover:whitespace-normal cursor-help" [title]="log.details">
                        {{ log.details }}
                    </div>
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
              <tr *ngIf="filteredLogs().length === 0 && !loading()">
                <td colspan="5" class="text-center p-8 text-muted">
                    <i class="bi bi-file-earmark-text text-3xl mb-2 block"></i>
                    Aucune trace trouvée.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .avatar.sm { width: 24px; height: 24px; font-size: 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .max-w-md { max-width: 400px; }

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
export class AuditLogComponent implements OnInit {
    private auditService = inject(AuditService);

    logs = signal<AuditLog[]>([]);
    loading = signal(false);
    searchQuery = '';
    filterAction = '';

    ngOnInit() {
        this.fetchLogs();
    }

    fetchLogs() {
        this.loading.set(true);
        this.auditService.getLogs().subscribe({
            next: (data) => {
                this.logs.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    filteredLogs() {
        return this.logs().filter(l => {
            const matchesSearch = !this.searchQuery ||
                `${l.utilisateur} ${l.details} ${l.entite}`.toLowerCase().includes(this.searchQuery.toLowerCase());
            const matchesAction = !this.filterAction || l.action === this.filterAction;
            return matchesSearch && matchesAction;
        });
    }

    getActionClass(action: string): string {
        switch (action) {
            case 'CREATE': return 'green';
            case 'UPDATE': return 'blue';
            case 'DELETE': return 'red';
            case 'LOGIN': return 'violet';
            default: return 'gray';
        }
    }
}

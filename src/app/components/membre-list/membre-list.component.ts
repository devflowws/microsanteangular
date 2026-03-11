import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembreService, Membre } from '../../services/membre.service';
import { AuthService } from '../../services/auth.service';
import { MembreFormComponent } from './membre-form.component';
import { FormsModule } from '@angular/forms';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-membre-list',
  standalone: true,
  imports: [CommonModule, MembreFormComponent, FormsModule, UserAvatarComponent],
  template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="font-bold text-xl mb-1">Membres de la Mutuelle</h1>
          <p class="text-muted text-sm">Gérez les adhésions, validez les dossiers et suivez les assurés.</p>
        </div>
        <div class="flex gap-2" *ngIf="hasRole(['ADMIN', 'AGENT'])">
          <button class="ms-btn" (click)="onExport()"><i class="bi bi-download"></i> Exporter CSV</button>
          <button class="ms-btn primary" (click)="onAdd()"><i class="bi bi-person-plus-fill"></i> Inscrire un membre</button>
        </div>
      </div>

      <!-- ─── TABS & FILTERS ─── -->
      <div class="ms-card mb-4">
        <div class="flex items-center justify-between p-1 border-b">
          <div class="flex px-2">
            <button class="tab-btn" [class.active]="activeTab() === 'TOUS'" (click)="setTab('TOUS')">Tous les membres</button>
            <button class="tab-btn" [class.active]="activeTab() === 'EN_ATTENTE'" (click)="setTab('EN_ATTENTE')">
              En attente <span class="tab-badge" *ngIf="countPending() > 0">{{ countPending() }}</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'VALIDE'" (click)="setTab('VALIDE')">Validés</button>
            <button class="tab-btn" [class.active]="activeTab() === 'SUSPENDU'" (click)="setTab('SUSPENDU')">Suspendus</button>
          </div>

          <div class="flex items-center gap-3 px-3 py-2">
            <div class="ms-input-icon-wrap" style="width: 240px;">
              <i class="bi bi-search ms-input-icon"></i>
              <input type="text" class="ms-input with-icon" placeholder="Rechercher nom, n°..." [(ngModel)]="searchQuery" (keyup.enter)="fetchMembres()">
            </div>
            <button class="ms-btn sm" (click)="fetchMembres()"><i class="bi bi-filter"></i> Filtres</button>
          </div>
        </div>

        <!-- ─── TABLE ─── -->
        <div class="ms-table-wrap" style="border: none;">
          <table class="ms-table">
            <thead>
              <tr>
                <th style="width: 40px;"><input type="checkbox"></th>
                <th>Membre & Référence</th>
                <th>Contact & MoMo</th>
                <th>Localisation</th>
                <th>Adhésion</th>
                <th>Statut</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- ─── SKELETON ROWS ─── -->
              <tr *ngIf="loading()">
                <td colspan="7" class="p-0">
                  <div class="shimmer-effect" style="height: 60px; margin-bottom: 4px;" *ngFor="let i of [1,2,3,4,5]"></div>
                </td>
              </tr>

              <!-- ─── ACTUAL DATA ─── -->
              <ng-container *ngIf="!loading()">
                <tr *ngFor="let m of membres(); trackBy: trackById">
                  <td><input type="checkbox"></td>
                  <td>
                    <div class="flex items-center gap-3">
                      <app-user-avatar [photoUrl]="m.photoUrl" [initials]="m.nom.charAt(0) + m.prenom.charAt(0)" [size]="32"></app-user-avatar>
                      <div>
                        <div class="font-bold text-sm">{{ m.nom }} {{ m.prenom }}</div>
                        <div class="text-xs text-muted mono">#{{ m.id.toString().padStart(4, '0') }}-{{ m.qrCode.substring(0,4) }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="text-sm font-semibold">{{ m.telephone }}</div>
                    <div class="text-xs text-muted">{{ m.email || 'Pas d\\'email' }}</div>
                  </td>
                  <td class="text-sm text-muted">
                    {{ m.adresse }}
                  </td>
                  <td class="text-sm">
                     24 Juin 2024
                  </td>
                  <td>
                    <span class="ms-badge" [class]="getBadgeClass(m.statut)">
                      {{ m.statut }}
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-end gap-1">
                      @if (m.statut === 'EN_ATTENTE') {
                        <button class="ms-btn sm success ghost" (click)="onValider(m)" title="Valider">
                          <i class="bi bi-check-circle-fill"></i>
                        </button>
                      }
                      <button class="ms-btn sm ghost" (click)="onEdit(m)"><i class="bi bi-pencil-square"></i></button>
                      <button class="ms-btn sm ghost"><i class="bi bi-three-dots"></i></button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="membres().length === 0">
                  <td colspan="7" class="p-12 text-center text-muted">
                    <i class="bi bi-person-x empty-icon block mb-2" style="font-size: 32px;"></i>
                    Aucun membre trouvé.
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- ─── PAGINATION ─── -->
        <div class="p-3 border-top flex justify-between items-center bg-surface2">
          <div class="text-xs text-muted">Affichage de {{ membres().length }} sur 124 membres</div>
          <div class="flex gap-1">
            <button class="ms-btn sm" disabled><i class="bi bi-chevron-left"></i></button>
            <button class="ms-btn sm primary">1</button>
            <button class="ms-btn sm">2</button>
            <button class="ms-btn sm">3</button>
            <button class="ms-btn sm"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Side Panel Form -->
    @if (showForm()) {
      <app-membre-form
        [membre]="selectedMembre()"
        (close)="showForm.set(false)"
        (saved)="fetchMembres()">
      </app-membre-form>
    }
  `,
  styles: [`
    .tab-btn {
      padding: 12px 16px; border: none; background: none; cursor: pointer;
      font-size: 13.5px; font-weight: 500; color: var(--muted);
      position: relative; transition: color .2s;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--blue-primary); font-weight: 700; }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: 0; left: 16px; right: 16px;
      height: 2px; background: var(--blue-primary); border-radius: 2px;
    }
    .tab-badge {
      background: var(--amber-lite); color: var(--amber);
      font-size: 10px; font-weight: 700; padding: 1px 6px;
      border-radius: 99px; margin-left: 4px; border: 1px solid #FFE4A0;
    }

    .av-circle {
      width: 32px; height: 32px; border-radius: 50%; background: var(--surface2);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: var(--muted); border: 1px solid var(--border);
    }

    .ms-input-icon-wrap { position: relative; }
    .border-top { border-top: 1px solid var(--border); }
    .border-b { border-bottom: 1px solid var(--border); }

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
export class MembreListComponent implements OnInit {
  private membreService = inject(MembreService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  membres = signal<Membre[]>([]);
  loading = signal(true);
  userRole = signal<string | null>(null);
  activeTab = signal('TOUS');
  countPending = signal(0);
  searchQuery = '';

  showForm = signal(false);
  selectedMembre = signal<Membre | null>(null);

  ngOnInit() {
    this.authService.getRole().subscribe(role => this.userRole.set(role));
    this.fetchMembres();
  }

  hasRole(roles: string[]): boolean {
    const current = this.userRole();
    return !!current && roles.includes(current);
  }

  fetchMembres() {
    this.loading.set(true);
    const params: any = {};
    if (this.activeTab() !== 'TOUS') params.statut = this.activeTab();
    if (this.searchQuery) params.search = this.searchQuery;

    this.membreService.getMembres(params).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.content || []);
        this.membres.set(data);
        if (this.activeTab() === 'TOUS') {
          this.countPending.set(data.filter((m: any) => m.statut === 'EN_ATTENTE').length);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    this.fetchMembres();
  }

  onExport() {
    this.toast.info('Exportation des membres en cours...');
  }

  onAdd() {
    this.selectedMembre.set(null);
    this.showForm.set(true);
  }

  onEdit(membre: Membre) {
    this.selectedMembre.set(membre);
    this.showForm.set(true);
  }

  onValider(membre: Membre) {
    if (confirm(`Voulez-vous valider l'inscription de ${membre.nom} ${membre.prenom} ?`)) {
      this.membreService.validerMembre(membre.id).subscribe(() => {
        this.toast.success(`${membre.prenom} ${membre.nom} validé avec succès`);
        this.fetchMembres();
      });
    }
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'VALIDE': return 'green';
      case 'EN_ATTENTE': return 'amber';
      case 'SUSPENDU': return 'red';
      case 'REJETE': return 'gray';
      default: return 'gray';
    }
  }

  trackById(index: number, item: Membre) {
    return item.id;
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilisateurService, Utilisateur } from '../../services/utilisateur.service';
import { PersonnelFormComponent } from './personnel-form.component';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-personnel-list',
  standalone: true,
  imports: [CommonModule, PersonnelFormComponent, FormsModule],
  template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="font-bold text-xl mb-1">Équipe & Personnel</h1>
          <p class="text-muted text-sm">Gérez les accès internes, les rôles de sécurité et les agents de terrain.</p>
        </div>
        <div class="flex gap-2">
          <button class="ms-btn primary" (click)="onAdd()"><i class="bi bi-person-plus-fill"></i> Ajouter un membre</button>
        </div>
      </div>

      <!-- ─── ROLE TABS & FILTERS ─── -->
      <div class="ms-card mb-4">
        <div class="flex items-center justify-between p-1 border-b">
          <div class="flex px-2">
            <button class="tab-btn" [class.active]="activeTab() === 'TOUT'" (click)="setTab('TOUT')">Tous</button>
            <button class="tab-btn" [class.active]="activeTab() === 'ADMIN'" (click)="setTab('ADMIN')">Administrateurs</button>
            <button class="tab-btn" [class.active]="activeTab() === 'TRESORIER'" (click)="setTab('TRESORIER')">Trésoriers</button>
            <button class="tab-btn" [class.active]="activeTab() === 'AGENT'" (click)="setTab('AGENT')">Agents Terrain</button>
          </div>

          <div class="flex items-center gap-3 px-3 py-2">
            <div class="ms-input-icon-wrap" style="width: 220px;">
              <i class="bi bi-search ms-input-icon"></i>
              <input type="text" class="ms-input with-icon" placeholder="Chercher nom..." [(ngModel)]="searchQuery">
            </div>
            <button class="ms-btn sm" (click)="fetchUsers()"><i class="bi bi-arrow-clockwise"></i></button>
          </div>
        </div>

        <!-- ─── TABLE ─── -->
        <div class="ms-table-wrap" style="border: none;">
          <table class="ms-table">
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Rôle Accès</th>
                <th>Statut</th>
                <th>Dernière connexion</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers(); trackBy: trackById">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="av-rect">{{ u.nom.charAt(0) }}{{ u.prenom.charAt(0) }}</div>
                    <div>
                      <div class="font-bold text-sm">{{ u.nom }} {{ u.prenom }}</div>
                      <div class="text-xs text-muted">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="ms-badge" [class]="getRoleClass(u.role)">
                    {{ u.role }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="dot" [class.active]="u.actif"></span>
                    <span class="text-sm">{{ u.actif ? 'Actif' : 'Inactif' }}</span>
                  </div>
                </td>
                <td class="text-sm text-muted">
                  {{ u.createdAt | date:'dd MMM yyyy' }}
                </td>
                <td>
                  <div class="flex justify-end gap-1">
                    <button class="ms-btn sm ghost" (click)="onEdit(u)"><i class="bi bi-pencil-square"></i></button>
                    <button class="ms-btn sm ghost danger" (click)="onDelete(u)"><i class="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="loading()">
                <td colspan="5" class="p-4 text-center">
                  <div class="table-loader">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                  <div class="text-muted mt-2">Chargement...</div>
                </td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0 && !loading()">
                <td colspan="5" class="p-4 text-center text-muted">Aucun personnel trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    @if (showForm()) {
      <app-personnel-form
        [user]="selectedUser()"
        (close)="showForm.set(false)"
        (saved)="fetchUsers()">
      </app-personnel-form>
    }
  `,
  styles: [`
    .tab-btn {
      padding: 12px 14px; border: none; background: none; cursor: pointer;
      font-size: 13px; font-weight: 500; color: var(--muted);
      position: relative; transition: color .2s;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--blue-primary); font-weight: 700; }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: 0; left: 14px; right: 14px;
      height: 2px; background: var(--blue-primary); border-radius: 2px;
    }

    .av-rect {
      width: 32px; height: 32px; border-radius: 8px; background: var(--surface2);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: var(--muted); border: 1px solid var(--border);
    }

    .dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
    .dot.active { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }

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
export class PersonnelListComponent implements OnInit {
  private userService = inject(UtilisateurService);
  private toast = inject(ToastService);

  users = signal<Utilisateur[]>([]);
  loading = signal(true);
  activeTab = signal('TOUT');
  searchQuery = '';

  showForm = signal(false);
  selectedUser = signal<Utilisateur | null>(null);

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredUsers() {
    return this.users().filter(u => {
      const matchTab = this.activeTab() === 'TOUT' || u.role === this.activeTab();
      const matchSearch = !this.searchQuery ||
        `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'TRESORIER': return 'violet';
      case 'AGENT': return 'blue';
      case 'MUTUELLE': return 'amber';
      default: return 'gray';
    }
  }

  onAdd() {
    this.selectedUser.set(null);
    this.showForm.set(true);
  }

  onEdit(user: Utilisateur) {
    this.selectedUser.set(user);
    this.showForm.set(true);
  }

  onDelete(user: Utilisateur) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.nom} ${user.prenom} ?`)) {
      this.userService.delete(user.id).subscribe({
        next: () => { this.toast.success('Personnel supprimé avec succès'); this.fetchUsers(); },
        error: (err) => this.toast.error('Erreur lors de la suppression : ' + (err?.error?.message || err.message))
      });
    }
  }

  trackById(index: number, item: Utilisateur) {
    return item.id;
  }
}

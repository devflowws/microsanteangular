import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrestataireService } from '../../services/prestataire.service';
import { Utilisateur } from '../../services/utilisateur.service';
import { PrestataireFormComponent } from './prestataire-form.component';
import { GlobalActionService } from '../../services/global-action.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { PersonnelFormComponent } from '../personnel-list/personnel-form.component';

@Component({
  selector: 'app-prestataire-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PrestataireFormComponent],
  template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="font-bold text-xl mb-1">Réseau de Soins</h1>
          <p class="text-muted text-sm">Gérez les cliniques, pharmacies et laboratoires partenaires agréés.</p>
        </div>
        <div class="flex gap-2">
          <button class="ms-btn" (click)="onExport()"><i class="bi bi-geo-alt"></i> Carte du réseau</button>
          <button class="ms-btn primary" (click)="onAdd()"><i class="bi bi-plus-lg"></i> Ajouter prestataire</button>
        </div>
      </div>

      <!-- ─── FILTERS ─── -->
      <div class="ms-card mb-4">
        <div class="flex items-center justify-between p-1 border-b">
          <div class="flex px-2">
            <button class="tab-btn" [class.active]="activeTab() === 'TOUS'" (click)="activeTab.set('TOUS')">Tous les partenaires</button>
            <button class="tab-btn" [class.active]="activeTab() === 'CLINIQUE'" (click)="activeTab.set('CLINIQUE')">Cliniques</button>
            <button class="tab-btn" [class.active]="activeTab() === 'PHARMACIE'" (click)="activeTab.set('PHARMACIE')">Pharmacies</button>
            <button class="tab-btn" [class.active]="activeTab() === 'LABO'" (click)="activeTab.set('LABO')">Laboratoires</button>
          </div>

          <div class="flex items-center gap-3 px-3 py-2">
            <div class="ms-input-icon-wrap" style="width: 220px;">
              <i class="bi bi-search ms-input-icon"></i>
              <input type="text" class="ms-input with-icon" placeholder="Chercher nom..." [(ngModel)]="searchQuery">
            </div>
            <button class="ms-btn sm" (click)="fetchPrestataires()"><i class="bi bi-arrow-clockwise"></i></button>
          </div>
        </div>

        <!-- ─── GRID / CARDS ─── -->
        <div class="p-4 grid grid-prestataires gap-4">
          <ng-container *ngIf="loading(); else prestatairesGrid">
            <div class="col-span-full loader-wrap">
              <div class="table-loader">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <div class="text-muted mt-2">Chargement...</div>
            </div>
          </ng-container>
          <ng-template #prestatairesGrid>
            <div *ngFor="let p of filteredPrestataires(); trackBy: trackById" class="prestataire-card ms-card border-none bg-surface2">
              <div class="flex justify-between items-start mb-3">
                <div class="p-icon bg-white">
                  <i [class]="getIcon(p)"></i>
                </div>
                <div class="flex gap-1">
                   <button class="action-sm" (click)="onEdit(p)"><i class="bi bi-pencil"></i></button>
                   <button class="action-sm delete" (click)="onDelete(p)"><i class="bi bi-trash"></i></button>
                </div>
              </div>

              <div class="mb-3">
                  <div class="font-bold text-sm leading-tight">{{ p.nom }} {{ p.prenom }}</div>
                  <div class="text-xs text-muted flex items-center gap-1 mt-1">
                      <i class="bi bi-envelope"></i> {{ p.email }}
                  </div>
              </div>

              <div class="flex justify-between items-center mt-auto pt-3 border-t-dashed">
                  <span class="ms-badge sm" [class]="p.actif ? 'green' : 'gray'">
                      {{ p.actif ? 'Agréé' : 'Suspendu' }}
                  </span>
                  <div class="flex items-center gap-1 cursor-pointer hover:text-teal transition-colors" (click)="onToggleStatus(p)">
                      <span class="text-xs font-semibold">{{ p.actif ? 'Actif' : 'Réactiver' }}</span>
                      <i class="bi" [class]="p.actif ? 'bi-toggle-on text-teal text-xl' : 'bi-toggle-off text-muted text-xl'"></i>
                  </div>
              </div>
            </div>

            <div *ngIf="filteredPrestataires().length === 0 && !loading()" class="col-span-full p-8 text-center text-muted">
              <i class="bi bi-building-slash text-3xl mb-2 block"></i>
              Aucun prestataire trouvé.
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <app-prestataire-form *ngIf="showForm()"
      [prestataire]="selectedPrestataire()"
      (close)="showForm.set(false)"
      (saved)="fetchPrestataires()">
    </app-prestataire-form>
  `,
  styles: [`
    .grid-prestataires {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }

    .prestataire-card {
        padding: 1.25rem;
        transition: transform .2s, box-shadow .2s;
        border: 1px solid var(--border) !important;
    }
    .prestataire-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        border-color: var(--teal) !important;
    }

    .p-icon {
        width: 42px; height: 42px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem; color: var(--teal);
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    .action-sm {
        width: 28px; height: 28px; border-radius: 6px; border: none;
        background: var(--surface); color: var(--muted); cursor: pointer;
        display: flex; align-items: center; justify-content: center; transition: all .2s;
    }
    .action-sm:hover { color: var(--teal); background: var(--teal-lite); }
    .action-sm.delete:hover { color: var(--red); background: var(--red-lite); }

    .border-t-dashed { border-top: 1px dashed var(--border); }

    .tab-btn {
      padding: 12px 14px; border: none; background: none; cursor: pointer;
      font-size: 13px; font-weight: 500; color: var(--muted);
      position: relative; transition: color .2s;
    }
    .tab-btn.active { color: var(--blue-primary); font-weight: 700; }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: 0; left: 14px; right: 14px;
      height: 2px; background: var(--blue-primary); border-radius: 2px;
    }

    .table-loader { display: inline-flex; gap: 8px; align-items: center; justify-content: center; }
    .table-loader .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue-primary); box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); animation: table-bounce 0.8s infinite ease-in-out; }
    .table-loader .dot:nth-child(2) { animation-delay: 0.1s; }
    .table-loader .dot:nth-child(3) { animation-delay: 0.2s; }

    .loader-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 140px; }

    @keyframes table-bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class PrestataireListComponent implements OnInit, OnDestroy {
  private prestataireService = inject(PrestataireService);
  private toast = inject(ToastService);
  private globalActionService = inject(GlobalActionService);
  private sub = new Subscription();

  prestataires = signal<Utilisateur[]>([]);
  loading = signal(true);
  activeTab = signal('TOUS');
  searchQuery = '';

  showForm = signal(false);
  selectedPrestataire = signal<Utilisateur | null>(null);

  ngOnInit() {
    this.fetchPrestataires();

    // Écouter les actions globales du Shell
    this.sub.add(this.globalActionService.actionTriggered$.subscribe(action => {
      if (action === 'Ajouter prestataire') {
        this.onAdd();
      }
    }));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  fetchPrestataires() {
    this.loading.set(true);
    this.prestataireService.getAll().subscribe({
      next: (data) => {
        this.prestataires.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredPrestataires() {
    return this.prestataires().filter(p => {
      // Pour l'instant on simule le type par le nom si pas en base
      const type = p.nom.toLowerCase().includes('clinique') ? 'CLINIQUE' :
        p.nom.toLowerCase().includes('pharmacie') ? 'PHARMACIE' :
          p.nom.toLowerCase().includes('labo') ? 'LABO' : 'CLINIQUE';

      const matchTab = this.activeTab() === 'TOUS' || type === this.activeTab();
      const matchSearch = !this.searchQuery ||
        `${p.nom} ${p.prenom} ${p.email}`.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }

  getIcon(p: Utilisateur): string {
    const name = p.nom.toLowerCase();
    if (name.includes('pharmacie')) return 'bi-capsule';
    if (name.includes('labo')) return 'bi-microscope';
    return 'bi-hospital';
  }

  onAdd() {
    this.selectedPrestataire.set(null);
    this.showForm.set(true);
  }

  onEdit(p: Utilisateur) {
    this.selectedPrestataire.set(p);
    this.showForm.set(true);
  }

  onToggleStatus(p: Utilisateur) {
    this.prestataireService.toggleStatus(p.id, !p.actif).subscribe(() => {
      this.toast.success(p.actif ? 'Prestataire désactivé' : 'Prestataire activé');
      this.fetchPrestataires();
    });
  }

  onDelete(p: Utilisateur) {
    if (confirm(`Révoquer l'agrément de ${p.nom} ?`)) {
      this.prestataireService.delete(p.id).subscribe({
        next: () => { this.toast.success('Prestataire supprimé'); this.fetchPrestataires(); },
        error: (err) => this.toast.error('Erreur: ' + (err?.error?.message || err.message))
      });
    }
  }

  onExport() {
    this.toast.info('Ouverture de la carte interactive du réseau...');
  }

  trackById(index: number, item: Utilisateur) {
    return item.id;
  }
}

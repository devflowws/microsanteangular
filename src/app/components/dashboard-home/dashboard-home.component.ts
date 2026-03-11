import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { RouterLink, Router } from '@angular/router';
import { MembreService, Membre } from '../../services/membre.service';
import { GlobalActionService } from '../../services/global-action.service';
import { QrScannerModalComponent } from '../shared/qr-scanner-modal.component';
import { SinistreFormComponent } from '../sinistre-list/sinistre-form.component';
import { DigitalCardComponent } from '../shared/digital-card.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink, QrScannerModalComponent, SinistreFormComponent, DigitalCardComponent],
  template: `
    <div class="dash-content animate-in">

      <!-- ═══ LOADING STATE (Skeletons) ═══ -->
      <div *ngIf="loading()">
        <div class="dash-header">
           <div class="skeleton-title" style="width: 300px; height: 32px;"></div>
        </div>
        <div class="kpi-row">
           <div class="kpi-card skeleton-card shimmer-effect" *ngFor="let i of [1,2,3,4]"></div>
        </div>
        <div class="bottom-row">
           <div class="activity-card skeleton-card shimmer-effect" style="height: 400px;"></div>
           <div class="actions-panel skeleton-card shimmer-effect" style="height: 400px;"></div>
        </div>
      </div>

      <!-- ═══ AUTHENTICATED STATE ═══ -->
      <div *ngIf="!loading()">
        <!-- ═══ HEADER ═══ -->
        <div class="dash-header">
          <div>
            <h1 class="dash-title">Tableau de Bord</h1>
            <p class="dash-subtitle">Bonjour <strong>{{ userName() }}</strong>, voici l'état actuel de votre mutuelle.</p>
          </div>
          <div class="dash-solde" *ngIf="hasRole(['ADMIN','TRESORIER','AGENT'])">
            <span class="dash-solde-label">Solde de Caisse</span>
            <span class="dash-solde-value">{{ (stats()?.soldeCaisse || 0) | number:'1.0-0' }} FCFA</span>
          </div>
        </div>

        <!-- ═══ KPI CARDS (Admin/Staff) ═══ -->
        <div class="kpi-row" *ngIf="hasRole(['ADMIN', 'TRESORIER', 'AGENT'])">
          <!-- Card 1 — Membres Actifs -->
          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-ic blue"><i class="bi bi-people-fill"></i></div>
              <span class="kpi-pct green">+5% ↑</span>
            </div>
            <div class="kpi-value">{{ stats()?.totalMembres || 0 }}</div>
            <div class="kpi-label">Membres Actifs</div>
          </div>

          <!-- Card 2 — Nouveaux Sinistres -->
          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-ic orange"><i class="bi bi-clipboard2-pulse"></i></div>
              <span class="kpi-pct muted">Mois</span>
            </div>
            <div class="kpi-value">{{ stats()?.totalSinistresMois || 0 }}</div>
            <div class="kpi-label">Nouveaux Sinistres</div>
          </div>

          <!-- Card 3 — Collecte du mois -->
          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-ic teal"><i class="bi bi-folder2-open"></i></div>
              <span class="kpi-pct green">+12% ↑</span>
            </div>
            <div class="kpi-value">{{ (stats()?.totalCotisationsMois || 0) | number:'1.0-0' }}</div>
            <div class="kpi-label">Collecte du mois (FCFA)</div>
          </div>

          <!-- Card 4 — Décaissements -->
          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-ic red"><i class="bi bi-camera-video"></i></div>
              <span class="kpi-pct red-text">-4% ↓</span>
            </div>
            <div class="kpi-value">{{ (stats()?.totalRemboursementsMois || 0) | number:'1.0-0' }}</div>
            <div class="kpi-label">Décaissements (FCFA)</div>
          </div>
        </div>

        <!-- ═══ KPI CARDS (Member) ═══ -->
        <div class="kpi-row" *ngIf="hasRole(['MEMBRE'])">
          <!-- Statut -->
          <div class="kpi-card flex flex-row items-center gap-4 text-left">
            <div class="kpi-ic teal"><i class="bi bi-shield-lock-fill"></i></div>
            <div>
              <div class="kpi-label uppercase text-[10px] tracking-widest">Protection Santé</div>
              <div class="text-lg font-black text-slate-800">Couverture Active</div>
              <span class="ms-badge green sm mt-1">VÉRIFIÉ</span>
            </div>
          </div>

          <!-- Solde -->
          <div class="kpi-card p-0 overflow-hidden cursor-pointer" (click)="showDigitalCard.set(true)">
             <div class="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white h-full relative">
                <div class="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Plafond Disponible</div>
                <div class="text-2xl font-black text-white">{{ memberBalance() | number:'1.0-0' }} <small class="text-xs opacity-50">FCFA</small></div>
                <div class="h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div class="h-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" [style.width.%]="(memberBalance() / 500000) * 100"></div>
                </div>
                <i class="bi bi-wallet2 absolute bottom-2 right-4 text-white/5 text-4xl"></i>
             </div>
          </div>

          <!-- Mutuelle -->
          <div class="kpi-card flex flex-row items-center gap-4 text-left">
            <div class="kpi-ic blue"><i class="bi bi-building-check"></i></div>
            <div>
              <div class="kpi-label uppercase text-[10px] tracking-widest">Ma Structure</div>
              <div class="text-lg font-black text-slate-800">Mutuelle Lomé</div>
              <div class="text-[10px] text-muted font-bold mt-1">ID: MS-{{ member()?.id || '...' }}</div>
            </div>
          </div>
        </div>

        <!-- ═══ BOTTOM ROW — Activity + Actions ═══ -->
        <div class="bottom-row">
          <!-- LEFT — Activité Récente -->
          <div class="activity-card">
            <div class="activity-header">
              <h3 class="activity-title">Activité Récente</h3>
              <button class="voir-tout-btn" routerLink="/admin/notifications">Voir tout &nbsp;→</button>
            </div>
            <div class="activity-list">
              <div class="activity-item" *ngFor="let act of stats()?.recentActivities">
                <div class="a-dot" [ngClass]="act.type === 'Paiement' ? 'bg-green' : 'bg-amber'"></div>
                <div class="a-body">
                  <div class="a-desc">{{ act.description }}</div>
                  <div class="a-sub">{{ act.type }} • {{ act.date | date:'dd MMM yyyy' }}</div>
                </div>
                <div class="a-time text-right">
                  <div class="font-bold" [ngClass]="act.type === 'Paiement' ? 'text-green' : 'text-amber'">
                    {{ (act.montant || 0) | number:'1.0-0' }} FCFA
                  </div>
                  <div class="text-[10px] text-muted">{{ act.date | date:'HH:mm' }}</div>
                </div>
              </div>
              <div *ngIf="stats()?.recentActivities?.length === 0" class="p-8 text-center text-muted">
                 Aucune activité récente à afficher.
              </div>
            </div>
          </div>

          <!-- RIGHT — Actions Rapides -->
          <div class="actions-panel">
            <h3 class="actions-title">Actions Rapides</h3>
            <div class="actions-list" *ngIf="!hasRole(['MEMBRE', 'PRESTATAIRE'])">
              <button class="qa-btn blue" routerLink="/admin/remboursements">
                <i class="bi bi-credit-card-2-front"></i>
                <span>Effectuer des remboursements</span>
              </button>
              <button class="qa-btn amber" routerLink="/admin/sinistres">
                <i class="bi bi-shield-check"></i>
                <span>Traiter les sinistres</span>
              </button>
              <button class="qa-btn teal" routerLink="/admin/cotisations">
                <i class="bi bi-plus-circle"></i>
                <span>Saisir une cotisation</span>
              </button>
              <button class="qa-btn violet" routerLink="/admin/rapports">
                <i class="bi bi-file-earmark-text"></i>
                <span>Générer un rapport</span>
              </button>
            </div>

            <!-- Prestatiare Actions -->
            <div class="actions-list" *ngIf="hasRole(['PRESTATAIRE'])">
               <button class="qa-btn teal glow" (click)="showScanner.set(true)">
                 <i class="bi bi-camera-fill"></i>
                 <span>Scanner un patient</span>
               </button>
               <button class="qa-btn blue" routerLink="/admin/sinistres">
                 <i class="bi bi-clipboard2-pulse"></i>
                 <span>Dossiers envoyés</span>
               </button>
            </div>

            <!-- Member Actions -->
            <div class="actions-list" *ngIf="hasRole(['MEMBRE'])">
               <button class="qa-btn blue" (click)="showDigitalCard.set(true)">
                 <i class="bi bi-qr-code-scan"></i>
                 <span>Ma carte QR Digitale</span>
               </button>
               <button class="qa-btn teal" routerLink="/admin/cotisations">
                 <i class="bi bi-wallet2"></i>
                 <span>Effectuer une cotisation</span>
               </button>
               <button class="qa-btn amber" routerLink="/admin/mes-sinistres">
                 <i class="bi bi-activity"></i>
                 <span>Mes sinistres</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-qr-scanner-modal *ngIf="showScanner()"
      (close)="showScanner.set(false)"
      (memberScanned)="onMemberScanned($event)">
    </app-qr-scanner-modal>

    <app-sinistre-form *ngIf="showForm()"
      [preselectedMember]="selectedMember()"
      (close)="showForm.set(false); selectedMember.set(null)"
      (saved)="fetchStats()">
    </app-sinistre-form>

    <!-- Member Digital Card -->
    <app-digital-card *ngIf="showDigitalCard() && member()"
      [member]="member()!"
      (close)="showDigitalCard.set(false)">
    </app-digital-card>
  `,
  styles: [`
    /* ── Header ── */
    .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .dash-title { font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; margin: 0; }
    .dash-subtitle { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .dash-subtitle strong { color: var(--text); }
    .dash-solde { text-align: right; }
    .dash-solde-label { display: block; font-size: 12px; font-weight: 700; color: var(--text); }
    .dash-solde-value { display: block; font-size: 18px; font-weight: 800; color: #10B981; margin-top: 2px; }

    /* ── KPI Row ── */
    .kpi-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
      margin-bottom: 40px;
    }
    .kpi-card {
      background: #fff; border: 1px solid var(--border); border-radius: 16px;
      padding: 24px; text-align: center;
      box-shadow: 0 1px 4px rgba(59,130,246,0.04);
      transition: all 0.25s ease;
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(59,130,246,0.08); }
    .kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .kpi-ic {
      width: 48px; height: 48px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-size: 20px;
    }
    .kpi-ic.blue   { background: #DBEAFE; color: #3B82F6; }
    .kpi-ic.orange { background: #FFF7ED; color: #F59E0B; }
    .kpi-ic.teal   { background: #D1FAE5; color: #10B981; }
    .kpi-ic.red    { background: #FEE2E2; color: #EF4444; }
    .kpi-pct { font-size: 12px; font-weight: 700; }
    .kpi-pct.green { color: #10B981; }
    .kpi-pct.muted { color: var(--muted); font-weight: 600; }
    .kpi-pct.red-text { color: #EF4444; }
    .kpi-value { font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
    .kpi-label { font-size: 13px; color: var(--muted); font-weight: 500; }

    /* ── Bottom Row ── */
    .bottom-row {
      display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start;
    }

    /* ── Activity Card ── */
    .activity-card {
      background: #fff; border: 1px solid var(--border); border-radius: 16px;
      box-shadow: 0 1px 4px rgba(59,130,246,0.04); overflow: hidden;
    }
    .activity-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid var(--border);
    }
    .activity-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0; }
    .voir-tout-btn {
      padding: 8px 20px; border-radius: 99px; border: 1px solid var(--border);
      background: #fff; font-size: 13px; font-weight: 600; color: var(--text);
      cursor: pointer; transition: all 0.2s;
    }
    .voir-tout-btn:hover { background: var(--surface2); border-color: var(--blue-primary); color: var(--blue-primary); }

    .activity-list { padding: 8px 16px; }
    .activity-item {
      display: flex; align-items: flex-start; gap: 16px; padding: 20px 8px;
      border-bottom: 1px solid #F1F5F9;
    }
    .activity-item:last-child { border-bottom: none; }
    .a-dot { width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; margin-top: 7px; flex-shrink: 0; }
    .a-body { flex: 1; }
    .a-desc { font-size: 14px; font-weight: 700; color: var(--text); }
    .a-sub  { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .a-time { font-size: 13px; color: var(--muted); font-weight: 500; white-space: nowrap; }

    /* ── Actions Panel ── */
    .actions-panel {}
    .actions-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 16px 0; }
    .actions-list { display: flex; flex-direction: column; gap: 12px; }

    .qa-btn {
      width: 100%; display: flex; align-items: center; gap: 14px;
      padding: 16px 20px; border-radius: 14px; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.25s ease; text-align: left;
    }
    .qa-btn:hover { transform: translateY(-2px); filter: brightness(0.97); }
    .qa-btn i { font-size: 18px; }

    .qa-btn.blue   { background: #DBEAFE; color: #1D4ED8; }
    .qa-btn.amber  { background: #FEF3C7; color: #D97706; }
    .qa-btn.teal   { background: #CCFBF1; color: #0D9488; }
    .qa-btn.violet { background: #F3E8FF; color: #7C3AED; }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .bottom-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-row { grid-template-columns: 1fr; }
      .dash-header { flex-direction: column; gap: 12px; }
      .dash-solde { text-align: left; }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private membreService = inject(MembreService);
  private globalActionService = inject(GlobalActionService);
  private router = inject(Router);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  userRole = signal<string | null>(null);
  userName = signal<string>('Utilisateur');
  member = signal<Membre | null>(null);
  memberBalance = signal<number>(0);

  showScanner = signal(false);
  showDigitalCard = signal(false);
  selectedMember = signal<Membre | null>(null);
  showForm = signal(false);

  ngOnInit() {
    this.loadUserContext();
  }

  loadUserContext() {
    this.authService.getRole().subscribe(role => {
      this.userRole.set(role);

      if (['ADMIN', 'TRESORIER', 'AGENT'].includes(role || '')) {
        this.fetchStats();
      } else if (role === 'MEMBRE') {
        this.fetchMemberStats();
      } else {
        this.loading.set(false);
      }
    });

    this.authService.user$.subscribe(user => {
      if (user) this.userName.set(user.displayName || user.email?.split('@')[0] || 'Utilisateur');
    });

    this.membreService.currentUser$.subscribe(m => {
      if (m) {
        this.member.set(m);
        this.memberBalance.set(m.plafond || 0);
      }
    });
  }

  hasRole(roles: string[]): boolean {
    const current = this.userRole();
    return !!current && roles.includes(current);
  }

  fetchStats() {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  fetchMemberStats() {
    this.loading.set(true);
    this.membreService.getMe().subscribe({
      next: (membre) => {
        // Here we simulate the balance for the UI (matching the screenshot's 'Plafond')
        this.memberBalance.set(membre.plafond || 500000);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isProvider(): boolean {
    return this.userRole() === 'PRESTATAIRE';
  }

  onGlobalAction() {
    this.globalActionService.triggerAction('SINISTRE');
  }

  onMemberScanned(member: Membre) {
    this.selectedMember.set(member);
    this.showScanner.set(false);
    // After scanning, we can either show a summary or open the form directly
    this.showForm.set(true);
  }
}

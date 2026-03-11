import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GlobalActionService } from '../../services/global-action.service';
import { DigitalCardComponent } from '../shared/digital-card.component';
import { MembreService } from '../../services/membre.service';
import { ProfileSettingsComponent } from '../profile-settings/profile-settings.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { ToastContainerComponent } from '../shared/toast-container.component';
import { NotificationService, Notification } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ProfileSettingsComponent, UserAvatarComponent, ToastContainerComponent, DigitalCardComponent],
  template: `
    <div class="dashboard-container">
      <app-toast-container></app-toast-container>
      <!-- ═══════════════ SIDEBAR ═══════════════ -->
      <aside class="sidebar" [class.collapsed]="isSidebarCollapsed">
        <div class="sb-logo">
          <div class="sb-logo-mark">
            <i class="bi bi-hospital"></i>
          </div>
          <div class="sb-logo-details">
            <div class="sb-logo-text">Micro<span>Santé+</span></div>
            <div class="sb-logo-sub">Djondo-Togo · Admin</div>
          </div>
        </div>

        <div class="sb-content">
          <div class="sb-section">
            <div class="sb-section-label">Vue d'ensemble</div>
            <a class="sb-item" routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <i class="bi bi-grid-1x2 sb-icon"></i> <span class="sb-label">Dashboard</span>
            </a>
            <a class="sb-item" routerLink="/admin/notifications" routerLinkActive="active">
              <i class="bi bi-megaphone sb-icon"></i> <span class="sb-label">Notifications</span>
            </a>
          </div>

          <div class="sb-section">
            <div class="sb-section-label">Gestion</div>
            <a class="sb-item" routerLink="/admin/membres" routerLinkActive="active" *ngIf="hasRole(['ADMIN', 'TRESORIER', 'AGENT'])">
              <i class="bi bi-people sb-icon"></i> <span class="sb-label">Membres</span>
              <span class="sb-badge amber">3</span>
            </a>
            <a class="sb-item" routerLink="/admin/cotisations" routerLinkActive="active" *ngIf="hasRole(['ADMIN', 'TRESORIER', 'AGENT', 'MEMBRE'])">
              <i class="bi bi-credit-card sb-icon"></i> <span class="sb-label">{{ hasRole(['MEMBRE']) ? 'Mes Cotisations' : 'Cotisations' }}</span>
            </a>
            <a class="sb-item" routerLink="/admin/sinistres" routerLinkActive="active" *ngIf="hasRole(['ADMIN', 'TRESORIER', 'AGENT', 'PRESTATAIRE'])">
              <i class="bi bi-file-earmark-medical sb-icon"></i> <span class="sb-label">Sinistres</span>
              <span class="sb-badge">2</span>
            </a>
            <a class="sb-item" routerLink="/admin/remboursements" routerLinkActive="active" *ngIf="hasRole(['ADMIN', 'TRESORIER', 'AGENT'])">
              <i class="bi bi-cash-stack sb-icon"></i> <span class="sb-label">Remboursements</span>
              <span class="sb-badge teal">2</span>
            </a>
          </div>

          <!-- Section exclusive au MEMBRE -->
          <div class="sb-section" *ngIf="hasRole(['MEMBRE'])">
            <div class="sb-section-label">Mon Espace</div>
            <a class="sb-item" routerLink="/admin/dashboard" [class.active]="false" (click)="openMemberCard($event)">
              <i class="bi bi-qr-code-scan sb-icon"></i> <span class="sb-label">Ma Carte QR</span>
            </a>
            <a class="sb-item" routerLink="/admin/mes-sinistres" routerLinkActive="active">
              <i class="bi bi-heart-pulse sb-icon"></i> <span class="sb-label">Mes Dossiers</span>
            </a>
            <a class="sb-item" routerLink="/admin/cotisations" routerLinkActive="active">
              <i class="bi bi-wallet2 sb-icon"></i> <span class="sb-label">Mes Cotisations</span>
            </a>
          </div>

          <div class="sb-section">
            <div class="sb-section-label">Administration</div>
            <a class="sb-item" routerLink="/admin/personnel" routerLinkActive="active" *ngIf="hasRole(['ADMIN'])">
              <i class="bi bi-person-badge sb-icon"></i> <span class="sb-label">Personnel</span>
            </a>
            <a class="sb-item" routerLink="/admin/prestataires" routerLinkActive="active" *ngIf="hasRole(['ADMIN', 'TRESORIER'])">
              <i class="bi bi-hospital-fill sb-icon"></i> <span class="sb-label">Prestataires</span>
            </a>
            <a class="sb-item" routerLink="/admin/rapports" routerLinkActive="active" *ngIf="hasRole(['ADMIN', 'TRESORIER'])">
              <i class="bi bi-graph-up-arrow sb-icon"></i> <span class="sb-label">Rapports</span>
            </a>
            <a class="sb-item" routerLink="/admin/audit" routerLinkActive="active" *ngIf="hasRole(['ADMIN'])">
              <i class="bi bi-shield-lock sb-icon"></i> <span class="sb-label">Journal d'Audit</span>
            </a>
            <a class="sb-item" routerLink="/admin/mutuelle" routerLinkActive="active" *ngIf="hasRole(['ADMIN'])">
              <i class="bi bi-gear-fill sb-icon"></i> <span class="sb-label">Paramètres</span>
            </a>
          </div>
        </div>

        <div class="sb-footer">
          <div class="sb-user" (click)="openProfile()">
            <app-user-avatar [photoUrl]="userPhoto" [initials]="userInitial" [size]="32"></app-user-avatar>
            <div class="sb-user-info">
              <div class="sb-user-name text-truncate">{{ userName }}</div>
              <div class="sb-user-role">{{ userRoleLabel }}</div>
            </div>
            <i class="bi bi-three-dots-vertical ms-auto opacity-50"></i>
          </div>
          <button class="logout-btn" (click)="onLogout()">
            <i class="bi bi-box-arrow-right"></i> <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <!-- ═══════════════ MAIN ═══════════════ -->
      <main class="main">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-toggle" (click)="toggleSidebar()">
              <i class="bi bi-list"></i>
            </button>
            <div class="topbar-breadcrumb">
              <span>MicroSanté+</span> <i class="bi bi-chevron-right separator"></i> <strong>{{ currentPageTitle }}</strong>
            </div>
          </div>

          <div class="tb-spacer"></div>

          <div class="tb-search">
            <i class="bi bi-search"></i>
            <input type="text" placeholder="Rechercher...">
            <kbd>⌘K</kbd>
          </div>

          <div class="tb-actions">
            <div class="tb-notif" (click)="toggleNotifDropdown($event)">
              <i class="bi bi-bell"></i>
              <div class="notif-dot animate-pulse" *ngIf="unreadCount() > 0"></div>
              <span class="notif-badge bg-premium" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
            </div>

            <!-- Notifications Dropdown -->
            <div class="notif-dropdown animate-in" *ngIf="isNotifDropdownOpen" (click)="$event.stopPropagation()">
              <div class="nd-header">
                <div class="nd-title">Notifications</div>
                <div class="nd-count">{{ unreadCount() }} non lues</div>
              </div>
              <div class="nd-body">
                <div *ngIf="notifications().length === 0" class="nd-empty">
                  <i class="bi bi-bell-slash"></i>
                  <p>Aucune notification</p>
                </div>
                <div *ngFor="let n of notifications()"
                     class="nd-item"
                     [class.unread]="!n.lu"
                     (click)="markAsRead(n)">
                  <div class="nd-icon" [ngClass]="n.type">
                    <i class="bi" [ngClass]="{
                      'bi-credit-card': n.type === 'RAPPEL_PAIEMENT',
                      'bi-cash-stack': n.type === 'RAPPEL_REMBOURSEMENT',
                      'bi-info-circle': n.type === 'INFO'
                    }"></i>
                  </div>
                  <div class="nd-content">
                    <div class="nd-item-title">{{ n.title }}</div>
                    <div class="nd-item-msg text-wrap">{{ n.message }}</div>
                    <div class="nd-item-date">{{ n.createdAt | date:'short' }}</div>
                  </div>
                </div>
              </div>
              <div class="nd-footer" routerLink="/admin/notifications" (click)="isNotifDropdownOpen = false">
                Voir tout l'historique
              </div>
            </div>
            <button class="user-avatar-btn"
                    (click)="toggleUserMenu()">
              <img *ngIf="userPhoto" [src]="userPhoto" class="user-avatar-img" alt="Profile">
              <div *ngIf="!userPhoto" class="user-avatar-initials">
                {{ userInitial }}
              </div>
            </button>

            <!-- User Dropdown Menu -->
            <div class="user-menu-dropdown animate-in" *ngIf="isUserMenuOpen">
              <div class="um-header text-start">
                <div class="um-name text-gradient-teal">{{ userName }}</div>
                <div class="um-email">{{ userEmail }}</div>
              </div>
              <div class="um-items p-2">
                <div class="um-item" (click)="openProfile()">
                  <i class="bi bi-person-gear"></i> Paramètres du compte
                </div>
                <div class="um-item text-danger" (click)="onLogout()">
                  <i class="bi bi-box-arrow-right"></i> Déconnexion
                </div>
              </div>
            </div>

            <!-- Global action button removed as requested -->
          </div>
        </header>

        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Profile Modal -->
      <app-profile-settings
        *ngIf="showProfileModal"
        (close)="showProfileModal = false"
        (saved)="onProfileSaved()">
      </app-profile-settings>

      <!-- Global Member Card -->
      <app-digital-card *ngIf="showMemberCard() && currentUser()"
        [member]="currentUser()!"
        (close)="showMemberCard.set(false)">
      </app-digital-card>
    </div>
  `,
  styles: [`
    :host { --sidebar-width: 260px; }

    .dashboard-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #F8FAFC;
    }

    /* ─── SIDEBAR ─────────────────────────────────────────────────────────────── */
    .sidebar {
      width: var(--sidebar-width);
      flex-shrink: 0;
      background: var(--sb-bg);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: relative;
      z-index: 100;
      border-right: 1px solid var(--sb-border);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar.collapsed {
      width: 70px;
    }

    .sb-logo {
      padding: 32px 24px;
      border-bottom: 1px solid var(--sb-border);
      display: flex;
      align-items: center;
      gap: 14px;
      overflow: hidden;
    }

    .sb-logo-mark {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: var(--teal-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      color: white;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.2);
    }

    .sb-logo-details {
      transition: opacity 0.2s;
      white-space: nowrap;
    }

    .sidebar.collapsed .sb-logo-details {
      opacity: 0;
      width: 0;
      pointer-events: none;
    }

    .sb-logo-text {
      font-size: 19px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.02em;
    }

    .sb-logo-text span {
      background: var(--teal-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 800;
    }

    .sb-logo-sub {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sb-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px;
    }

    .sb-content::-webkit-scrollbar {
      width: 4px;
    }

    .sb-content::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
    }

    .sb-section {
      margin-bottom: 24px;
    }

    .sb-section-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted2);
      text-transform: uppercase;
      letter-spacing: .1em;
      padding: 0 16px;
      margin-bottom: 12px;
      transition: opacity 0.2s;
    }

    .sidebar.collapsed .sb-section-label {
      opacity: 0;
    }

    .sb-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14.5px;
      font-weight: 600;
      color: var(--sb-text);
      transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 4px;
      position: relative;
      text-decoration: none;
    }

    .sb-item:hover {
      background: var(--surface2);
      color: var(--blue-primary);
      transform: translateX(4px);
    }

    .sb-item.active {
      background: var(--sb-active-bg);
      color: var(--sb-active-text);
      box-shadow: inset 4px 0 0 var(--blue-primary);
    }

    .sb-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 22px;
      background: #FFFFFF;
      border-radius: 0 4px 4px 0;
    }

    .sb-icon {
      font-size: 18px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .sb-label {
      transition: opacity 0.2s;
      white-space: nowrap;
    }

    .sidebar.collapsed .sb-label {
      opacity: 0;
      width: 0;
    }

    .sb-badge {
      margin-left: auto;
      background: #EF4444;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 99px;
      min-width: 18px;
      text-align: center;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.12);
    }

    .sb-badge.amber {
      background: #F59E0B;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.12);
    }

    .sb-badge.teal {
      background: #14B8A6;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.12);
    }

    .sidebar.collapsed .sb-badge {
      display: none;
    }

    .sb-footer {
      padding: 24px 16px;
      border-top: 1px solid var(--sb-border);
      background: #FAFBFC;
    }

    .sb-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: all .2s;
      margin-bottom: 16px;
      overflow: hidden;
      background: white;
      border: 1px solid var(--border);
      box-shadow: var(--sh-premium);
    }

    .sb-user:hover {
      border-color: var(--teal-primary);
      transform: translateY(-2px);
    }

    .sb-av {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #60A5FA;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      flex-shrink: 0;
      font-size: 14px;
    }

    .sb-user-info {
      transition: opacity 0.2s;
      overflow: hidden;
      flex: 1;
    }

    .sidebar.collapsed .sb-user-info {
      opacity: 0;
      width: 0;
    }

    .sb-user-name {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text);
    }

    .sb-user-role {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
      margin-top: 1px;
    }

    .logout-btn {
      width: 100%;
      padding: 10px 12px;
      background: rgba(239, 68, 68, 0.15);
      color: rgba(255,255,255,.85);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      cursor: pointer;
      transition: all .2s;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
      color: #FFFFFF;
    }

    /* ─── TOPBAR ──────────────────────────────────────────────────── */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .topbar {
      height: 72px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 32px;
      gap: 20px;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .menu-toggle {
      width: 42px;
      height: 42px;
      border: 1px solid var(--border);
      background: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--text-2);
      box-shadow: var(--sh-premium);
    }

    .menu-toggle:hover {
      border-color: var(--teal-primary);
      color: var(--teal-primary);
      transform: scale(1.05);
    }

    .topbar-breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #64748B;
    }

    .topbar-breadcrumb strong {
      color: #0F172A;
      font-weight: 600;
    }

    .separator {
      font-size: 10px;
      opacity: 0.5;
    }

    .tb-spacer {
      flex: 1;
    }

    .tb-search {
      position: relative;
      width: 380px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      transition: all 0.2s;
    }

    .tb-search:focus-within {
      background: #FFFFFF;
      border-color: var(--teal-primary);
      box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
      width: 420px;
    }

    .tb-search i {
      color: var(--muted2);
      font-size: 17px;
    }

    .tb-search input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 13.5px;
      color: #0F172A;
    }

    .tb-search input::placeholder {
      color: #CBD5E1;
    }

    .tb-search kbd {
      padding: 3px 7px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 5px;
      font-size: 11px;
      color: #94A3B8;
      font-family: var(--mono);
      font-weight: 600;
    }

    .tb-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .user-avatar-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2px solid var(--blue);
      background: transparent;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }

    .user-avatar-btn:hover {
      box-shadow: 0 0 0 3px rgba(13, 109, 253, 0.2);
    }

    .user-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .user-avatar-initials {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--teal-mid), var(--blue));
      color: white;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tb-notif {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
      color: #64748B;
      font-size: 18px;
      border: 1px solid transparent;
    }

    .tb-notif:hover {
      background: #FFFFFF;
      color: var(--teal-primary);
      border-color: var(--teal-primary);
      transform: translateY(-2px);
      box-shadow: var(--sh-premium);
    }

    .notif-dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(20, 184, 166, 0.1);
      border-radius: 20px;
      box-shadow: var(--sh-glass);
      width: 380px;
      z-index: 1000;
      overflow: hidden;
    }

    .user-menu-dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(20, 184, 166, 0.1);
      border-radius: 20px;
      box-shadow: var(--sh-glass);
      width: 260px;
      z-index: 1000;
      overflow: hidden;
    }

    .um-header {
      padding: 20px;
      background: rgba(20, 184, 166, 0.03);
      border-bottom: 1px solid var(--border);
    }

    .um-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 2px;
    }

    .um-email {
      font-size: 12px;
      color: #64748B;
    }

    .um-items {
      padding: 6px;
    }

    .um-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      color: #334155;
    }

    .um-item:hover {
      background: #F8FAFC;
      color: #0F172A;
    }

    .um-item.text-danger {
      color: #EF4444;
    }

    .um-item.text-danger:hover {
      background: #FEE2E2;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      background: #F8FAFC;
    }

    .content::-webkit-scrollbar {
      width: 6px;
    }

    .content::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 10px;
    }

    .content::-webkit-scrollbar-thumb:hover {
      background: #94A3B8;
    }

    /* ── Premium Action Button ── */
    .btn-premium {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      white-space: nowrap;
      box-shadow: 0 4px 14px -3px rgba(59, 130, 246, 0.4);
    }

    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -4px rgba(59, 130, 246, 0.5);
      filter: brightness(1.05);
    }

    .btn-premium:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px -2px rgba(59, 130, 246, 0.4);
    }

    .btn-premium i {
      font-size: 15px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);
  private globalActionService = inject(GlobalActionService);

  isSidebarCollapsed = false;
  isUserMenuOpen = false;
  isNotifDropdownOpen = false;

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  private notifService = inject(NotificationService);
  private membreService = inject(MembreService);
  private toastService = inject(ToastService);
  private pollInterval: any;
  showProfileModal = false;
  showMemberCard = signal(false);
  currentUser = signal<any>(null);
  userName = 'Utilisateur';
  userEmail = '';
  userInitial = 'U';
  currentPageTitle = 'Dashboard';
  globalActionLabel = 'Nouveau membre';

  userRole = signal<string | null>(null);
  userRoleLabel = 'Chargement...';
  userPhoto: string | null = null;

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateHeaderContext();
    });
    this.updateHeaderContext();
    this.loadUserRole();
    this.loadNotifications();

    // Poll for new notifications every 30 seconds
    this.pollInterval = setInterval(() => {
      this.checkNewNotifications();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadUserRole() {
    this.authService.getRole().subscribe(role => {
      this.userRole.set(role);
      switch (role) {
        case 'ADMIN': this.userRoleLabel = 'Administrateur'; break;
        case 'TRESORIER': this.userRoleLabel = 'Trésorier'; break;
        case 'AGENT': this.userRoleLabel = 'Agent'; break;
        case 'PRESTATAIRE': this.userRoleLabel = 'Prestataire'; break;
        default: this.userRoleLabel = 'Membre';
      }
    });

    this.membreService.currentUser$.subscribe(m => {
      this.currentUser.set(m);
    });

    this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = user.displayName || user.email || 'Utilisateur';
        this.userEmail = user.email || '';
        this.userInitial = this.userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        // On récupère les infos étendues (dont la photo Base64) depuis notre backend
        this.authService.getMe().subscribe({
          next: (profile) => {
            if (profile && profile.photoUrl) {
              this.userPhoto = profile.photoUrl;
            } else {
              this.userPhoto = user.photoURL; // Fallback sur Firebase
            }
          },
          error: () => {
            this.userPhoto = user.photoURL; // Fallback sur Firebase
          }
        });
      }
    });
  }

  hasRole(roles: string[]): boolean {
    const current = this.userRole();
    return !!current && roles.includes(current);
  }

  canPerformGlobalAction(): boolean {
    const label = this.globalActionLabel;
    if (label === 'Inscrire un membre') {
      return this.hasRole(['ADMIN', 'AGENT']);
    }
    if (label === 'Déclarer un sinistre') {
      return this.hasRole(['PRESTATAIRE', 'TRESORIER']);
    }
    // Par défaut, si ce n'est pas un de ces deux là, on laisse passer pour l'instant
    // ou on peut ajouter d'autres restrictions si nécessaire.
    return true;
  }

  updateHeaderContext() {
    const url = this.router.url;
    if (url.includes('/membres')) {
      this.currentPageTitle = 'Membres';
      this.globalActionLabel = 'Inscrire un membre';
    } else if (url.includes('/sinistres')) {
      this.currentPageTitle = 'Sinistres';
      this.globalActionLabel = 'Déclarer un sinistre';
    } else if (url.includes('/cotisations')) {
      this.currentPageTitle = 'Cotisations';
      this.globalActionLabel = 'Saisir un paiement';
    } else if (url.includes('/remboursements')) {
      this.currentPageTitle = 'Remboursements';
      this.globalActionLabel = 'Virement groupé';
    } else if (url.includes('/prestataires')) {
      this.currentPageTitle = 'Prestataires';
      this.globalActionLabel = 'Ajouter prestataire';
    } else if (url.includes('/personnel')) {
      this.currentPageTitle = 'Personnel';
      this.globalActionLabel = 'Ajouter staff';
    } else if (url.includes('/rapports')) {
      this.currentPageTitle = 'Rapports';
      this.globalActionLabel = 'Générer rapport';
    } else if (url.includes('/notifications')) {
      this.currentPageTitle = 'Notifications';
      this.globalActionLabel = 'Nouveu message';
    } else if (url.includes('/audit')) {
      this.currentPageTitle = 'Audit';
      this.globalActionLabel = 'Actualiser logs';
    } else if (url.includes('/mutuelle')) {
      this.currentPageTitle = 'Paramètres';
      this.globalActionLabel = 'Sauvegarder';
    } else {
      this.currentPageTitle = 'Dashboard';
      this.globalActionLabel = 'Nouveau membre';
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  openProfile() {
    this.isUserMenuOpen = false;
    this.showProfileModal = true;
  }

  onProfileSaved() {
    this.loadUserRole();
    // Forcer le rechargement pour voir les changements Firebase si possible
  }

  onGlobalAction() {
    this.globalActionService.triggerAction(this.globalActionLabel);
  }

  onLogout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  loadNotifications() {
    this.notifService.getMyNotifications(0, 5).subscribe(res => {
      this.notifications.set(res.content || []);
    });
    this.notifService.getUnreadCount().subscribe(count => {
      this.unreadCount.set(count);
    });
  }

  checkNewNotifications() {
    this.notifService.getUnreadCount().subscribe(count => {
      if (count > this.unreadCount()) {
        // Find newest and show toast
        this.notifService.getMyNotifications(0, 1).subscribe(res => {
          const latest = res.content[0];
          if (latest && !latest.lu) {
            this.toastService.show(latest.title, latest.message, 'info');
          }
        });
        this.unreadCount.set(count);
        this.loadNotifications();
      }
    });
  }

  toggleNotifDropdown(event: Event) {
    event.stopPropagation();
    this.isNotifDropdownOpen = !this.isNotifDropdownOpen;
    this.isUserMenuOpen = false;
    if (this.isNotifDropdownOpen) {
      this.loadNotifications();
    }
  }

  markAsRead(n: Notification) {
    if (!n.lu) {
      this.notifService.markAsRead(n.id).subscribe(() => {
        this.loadNotifications();
      });
    }
  }

  openMemberCard(event: Event) {
    event.preventDefault();
    this.showMemberCard.set(true);
  }
}

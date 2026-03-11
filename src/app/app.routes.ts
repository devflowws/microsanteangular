import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/admin-layout/admin-layout.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'admin',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./components/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
            },
            {
                path: 'membres',
                loadComponent: () => import('./components/membre-list/membre-list.component').then(m => m.MembreListComponent)
            },
            {
                path: 'cotisations',
                loadComponent: () => import('./components/cotisation-list/cotisation-list.component').then(m => m.CotisationListComponent)
            },
            {
                path: 'sinistres',
                loadComponent: () => import('./components/sinistre-list/sinistre-list.component').then(m => m.SinistreListComponent)
            },
            {
                path: 'remboursements',
                loadComponent: () => import('./components/remboursement-list/remboursement-list.component').then(m => m.RemboursementListComponent)
            },
            {
                path: 'prestataires',
                loadComponent: () => import('./components/prestataire-list/prestataire-list.component').then(m => m.PrestataireListComponent)
            },
            {
                path: 'rapports',
                loadComponent: () => import('./components/rapport-list/rapport-list.component').then(m => m.RapportListComponent)
            },
            {
                path: 'mutuelle',
                loadComponent: () => import('./components/mutuelle-settings/mutuelle-settings.component').then(m => m.MutuelleSettingsComponent)
            },
            {
                path: 'notifications',
                loadComponent: () => import('./components/notification/notification.component').then(m => m.NotificationComponent)
            },
            {
                path: 'audit',
                loadComponent: () => import('./components/audit-log/audit-log.component').then(m => m.AuditLogComponent)
            },
            {
                path: 'personnel',
                loadComponent: () => import('./components/personnel-list/personnel-list.component').then(m => m.PersonnelListComponent)
            },
            {
                path: 'mes-sinistres',
                loadComponent: () => import('./components/member-sinistres/member-sinistres.component').then(m => m.MemberSinistresComponent)
            },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];

import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface DashboardStats {
    totalMembres: number;
    membresEnAttente: number;
    totalSinistresMois: number;
    totalCotisationsMois: number;
    totalRemboursementsMois: number;
    soldeCaisse: number;
    sinistresEnAttente?: number;
    collecteMensuelle?: number;
    recentActivities: any[];
    monthlyRevenue: any[];
    claimsByType: any;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private api = inject(ApiService);

    getStats(): Observable<DashboardStats> {
        return this.api.get<DashboardStats>('/api/v1/admin/dashboard/stats');
    }
}

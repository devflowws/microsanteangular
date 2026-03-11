import { inject, Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DashboardService } from './dashboard.service';

export interface Report {
    id: string;
    title: string;
    date: string;
    type: 'MONTHLY' | 'ANNUAL' | 'CLAIMS';
    status: 'GENERATED' | 'PENDING';
    url?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RapportService {
    private dashboardService = inject(DashboardService);

    /**
     * Simulation de récupération des rapports archivés
     */
    getArchivedReports(): Observable<Report[]> {
        const reports: Report[] = [
            { id: '1', title: 'Rapport mensuel Janvier 2024', date: '2024-01-31', type: 'MONTHLY', status: 'GENERATED' },
            { id: '2', title: 'Rapport annuel 2023', date: '2023-12-31', type: 'ANNUAL', status: 'GENERATED' },
            { id: '3', title: 'Statistiques Sinistres Q4', date: '2023-12-15', type: 'CLAIMS', status: 'GENERATED' },
        ];
        return of(reports);
    }

    /**
     * Simulation de génération de rapport
     */
    generateReport(type: string): Observable<Report> {
        const newReport: Report = {
            id: Math.random().toString(36).substring(7),
            title: `Rapport ${type} - ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString(),
            type: type as any,
            status: 'GENERATED'
        };
        return of(newReport);
    }
}

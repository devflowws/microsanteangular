import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, delay, of, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cotisation {
    id: number;
    membreId: number;
    membreNom: string;
    montant: number;
    datePaiement: string;
    estEnRetard: boolean;
    moisCorrespondant: string;
}

@Injectable({
    providedIn: 'root'
})
export class CotisationService {
    private api = inject(ApiService);
    private mockCotisations: Cotisation[] = [];

    /**
     * Récupère toutes les cotisations (Admin)
     */
    getAllCotisations(): Observable<Cotisation[]> {
        return this.api.get<Cotisation[]>('/api/v1/cotisations').pipe(
            map(real => [...this.mockCotisations, ...real])
        );
    }

    /**
     * Récupère les cotisations d'un membre
     */
    getCotisationsByMembre(membreId: number): Observable<Cotisation[]> {
        return this.api.get<Cotisation[]>(`/api/v1/cotisations/membre/${membreId}`).pipe(
            map(real => [
                ...this.mockCotisations.filter(c => c.membreId === membreId),
                ...real
            ])
        );
    }

    /**
     * Enregistre un nouveau paiement
     */
    payerCotisation(request: { membreId: number, montant: number, datePaiement: string, moisCorrespondant: string }): Observable<Cotisation> {
        if ((environment as any).mockPayments) {
            console.log('--- SIMULATION MODE: CotisationService.payerCotisation ---');
            const mockResponse: Cotisation = {
                id: Math.floor(Math.random() * 10000),
                membreId: request.membreId,
                membreNom: 'Simulation Membre',
                montant: request.montant,
                datePaiement: request.datePaiement,
                estEnRetard: false,
                moisCorrespondant: request.moisCorrespondant
            };
            this.mockCotisations.unshift(mockResponse); // Persist for session
            return of(mockResponse);
        }
        return this.api.post<Cotisation>('/api/v1/cotisations', request);
    }
}

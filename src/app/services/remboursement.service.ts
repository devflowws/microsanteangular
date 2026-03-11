import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, delay, of, map, forkJoin, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SinistreService, Sinistre } from './sinistre.service';

export interface Remboursement {
    id: string;
    sinistreId: string;
    montant: number;
    dateVirement: string;
    operateur: string; // TMONEY ou MOOV
    telephoneDestinataire: string;
    referenceTransaction: string;
    statut: string;
    payViaPayGate?: boolean; // Pour la requête d'enregistrement
    membreNom?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RemboursementService {
    private api = inject(ApiService);
    private sinistreService = inject(SinistreService);
    private mockConfirmedRemboursements: Map<string, Remboursement> = new Map();

    /**
     * Récupère tous les remboursements
     */
    getAll(): Observable<Remboursement[]> {
        console.log('[RemboursementService] Fetching all data...');
        return forkJoin({
            realRems: this.api.get<Remboursement[]>('/api/v1/remboursements').pipe(
                catchError(err => {
                    console.error('[RemboursementService] Error fetching real rems:', err);
                    return of([] as Remboursement[]);
                })
            ),
            approvedClaims: this.sinistreService.getSinistres('APPROUVE').pipe(
                catchError(err => {
                    console.error('[RemboursementService] Error fetching approved claims:', err);
                    return of({ content: [] as Sinistre[], totalElements: 0 });
                })
            )
        }).pipe(
            map((result: any) => {
                const realRems: Remboursement[] = Array.isArray(result.realRems) ? result.realRems : [];
                const approvedClaims = result.approvedClaims;
                const claims: Sinistre[] = Array.isArray(approvedClaims) ? approvedClaims : (approvedClaims.content || []);

                console.log(`[RemboursementService] Data received - Real: ${realRems.length}, Appr Claims: ${claims.length}`);

                // 1. Créer des objets "Pending" pour chaque sinistre approuvé sans enregistrement réel
                let pendingFromClaims: Remboursement[] = claims
                    .filter((s: Sinistre) => {
                        const exists = realRems.find((r: Remboursement) => r.sinistreId.toString() === s.id.toString());
                        return !exists;
                    })
                    .map((s: Sinistre) => ({
                        id: `PEND-${s.id}`,
                        sinistreId: s.id.toString(),
                        montant: s.montantApprouve || s.montantDemande,
                        dateVirement: '',
                        operateur: 'TMONEY',
                        telephoneDestinataire: '',
                        referenceTransaction: '',
                        statut: 'PENDING',
                        membreNom: s.membreNom
                    }));

                console.log(`[RemboursementService] Generated ${pendingFromClaims.length} placeholders.`);

                // 2. Fusionner avec les enregistrements réels
                let all = [...realRems, ...pendingFromClaims];

                // 3. Appliquer les surcharges locales (Hybrid Mode)
                if ((environment as any).mockPayments) {
                    all = all.map((r: Remboursement) => {
                        const mock = this.mockConfirmedRemboursements.get(r.sinistreId.toString());
                        if (mock) {
                            console.log(`[RemboursementService] Found mock confirmation for #${r.sinistreId}`);
                            return { ...r, ...mock, statut: 'PAID' };
                        }
                        return r;
                    });
                }

                console.log(`[RemboursementService] Final list size: ${all.length}`);
                return all;
            })
        );
    }

    /**
     * Récupère les remboursements par sinistre
     */
    getBySinistre(sinistreId: string): Observable<Remboursement[]> {
        return this.api.get<Remboursement[]>(`/api/v1/sinistres/${sinistreId}/remboursements`);
    }

    /**
     * Enregistre un nouveau remboursement
     */
    enregistrer(sinistreId: string, request: Partial<Remboursement>): Observable<Remboursement> {
        if ((environment as any).mockPayments) {
            console.log(`[HybridMode] Simulation de paiement pour le sinistre #${sinistreId}`);
            const mockResponse: Remboursement = {
                id: `SIM-REM-${Date.now()}`,
                sinistreId: sinistreId.toString(),
                montant: request.montant || 0,
                dateVirement: new Date().toISOString(),
                operateur: request.operateur || 'TMONEY',
                telephoneDestinataire: request.telephoneDestinataire || '',
                referenceTransaction: request.referenceTransaction || `SIM-TX-${Date.now()}`,
                statut: 'COMPLETED'
            };
            this.mockConfirmedRemboursements.set(sinistreId.toString(), mockResponse);
            return of(mockResponse);
        }
        return this.api.post<Remboursement>(`/api/v1/sinistres/${sinistreId}/remboursements`, request);
    }
}

import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, delay, of, throwError, map, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sinistre {
    id: string;
    membreNom: string;
    typeSinistre: string;
    statut: string;
    montantDemande: number;
    montantApprouve?: number;
    dateDeclaration: string;
    dateTraitement?: string;
    description?: string;
    piecesJointes?: string[];
    membreId?: string;
    prestataireId?: string;
    prestataireNom?: string;
    motifRejet?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SinistreService {
    private api = inject(ApiService);

    // Pour l'Hybrid Mode: surcharger le statut des sinistres réels localement
    private statusOverrides: Map<string, string> = new Map();

    // Simulation: Stockage en mémoire pour la session
    private mockSinistres: Sinistre[] = [
        { id: '1', membreNom: 'TCHEO Simulation', typeSinistre: 'PHARMACIE', statut: 'OUVERT', montantDemande: 15000, dateDeclaration: new Date().toISOString() },
        { id: '2', membreNom: 'KOFFI Abla', typeSinistre: 'CONSULTATION', statut: 'EN_ATTENTE_TRESORIER', montantDemande: 25000, dateDeclaration: new Date().toISOString() },
        { id: '3', membreNom: 'LEROY Pana', typeSinistre: 'HOSPITALISATION', statut: 'EN_VALIDATION', montantDemande: 75000, dateDeclaration: new Date().toISOString() }
    ];

    /**
     * Récupère la liste des sinistres
     */
    getSinistres(statut?: string, page: number = 0): Observable<any> {
        if (environment.simulationMode) {
            let filtered = [...this.mockSinistres];
            if (statut) {
                // Correspondance des statuts pour l'affichage (SOUMIS = OUVERT dans cette simu simple)
                const s = statut === 'SOUMIS' ? 'OUVERT' : (statut === 'CONFIRME_MEMBRE' ? 'EN_ATTENTE_TRESORIER' : statut);
                filtered = filtered.filter(item => item.statut === s);
            }
            return of({
                content: filtered,
                totalElements: filtered.length
            });
        }

        const params: any = { page, size: 50 };
        if (statut) params.statut = statut;

        // Hybrid Mode: 'APPROUVE' inclusif pour voir les dossiers qu'on vient de valider localement
        if ((environment as any).mockPayments && statut === 'APPROUVE') {
            return forkJoin({
                approved: this.api.get<any>('/api/v1/sinistres', { ...params, statut: 'APPROUVE' }),
                pending: this.api.get<any>('/api/v1/sinistres', { ...params, statut: 'EN_VALIDATION' })
            }).pipe(
                map(({ approved, pending }) => {
                    const aList: Sinistre[] = Array.isArray(approved) ? approved : (approved.content || []);
                    const pList: Sinistre[] = Array.isArray(pending) ? pending : (pending.content || []);
                    const all = [...aList, ...pList];
                    const content = all.map(s => {
                        const over = this.statusOverrides.get(s.id.toString());
                        return over ? { ...s, statut: over } : s;
                    }).filter(s => s.statut === 'APPROUVE');
                    return { content, totalElements: content.length };
                })
            );
        }

        return this.api.get<any>('/api/v1/sinistres', params).pipe(
            map(res => {
                if (!(environment as any).mockPayments) return res;

                // Normaliser la réponse (Page vs Array)
                const data = res.content ? res : { content: res, totalElements: res.length };

                // Appliquer les surcharges de statut
                const content = (data.content || []).map((s: Sinistre) => {
                    const over = this.statusOverrides.get(s.id.toString());
                    return over ? { ...s, statut: over } : s;
                });

                // Filtrer si un statut était demandé et que la surcharge l'a fait changer
                let finalContent = content;
                if (statut) {
                    finalContent = content.filter((s: Sinistre) => s.statut === statut);
                }

                return { ...data, content: finalContent, totalElements: data.totalElements || finalContent.length };
            })
        );
    }

    /**
     * Approuve un sinistre (TRESORIER)
     */
    approuverSinistre(id: string, montant: number): Observable<Sinistre> {
        // Hybrid Mode: Simuler le succès pour éviter les erreurs PawaPay/Balance en démo
        if ((environment as any).mockPayments) {
            console.log(`[HybridMode] Simulation d'approbation pour #${id}`);
            this.statusOverrides.set(id.toString(), 'APPROUVE');
            return this.getSinistreById(id).pipe(
                map(sinistre => ({ ...sinistre, statut: 'APPROUVE', montantApprouve: montant }))
            );
        }

        if (environment.simulationMode) {
            const index = this.mockSinistres.findIndex(s => s.id === id);
            if (index !== -1) {
                this.mockSinistres[index] = { ...this.mockSinistres[index], statut: 'APPROUVE', montantApprouve: montant };
                return of(this.mockSinistres[index]);
            }
        }

        return this.api.patch<Sinistre>(`/api/v1/sinistres/${id}/approuver`, { montant });
    }

    /**
     * Rejette un sinistre
     */
    rejeterSinistre(id: string, motif: string): Observable<void> {
        if ((environment as any).mockPayments) {
            this.statusOverrides.set(id.toString(), 'REJETE');
            return of(undefined);
        }

        if (environment.simulationMode) {
            const index = this.mockSinistres.findIndex(s => s.id === id);
            if (index !== -1) {
                this.mockSinistres[index] = { ...this.mockSinistres[index], statut: 'REJETE', motifRejet: motif };
            }
            return of(undefined);
        }

        return this.api.patch<void>(`/api/v1/sinistres/${id}/rejeter`, { motif });
    }

    /**
     * Transmet au trésorier (Instruire)
     */
    instruireSinistre(id: string): Observable<Sinistre> {
        if (environment.simulationMode) {
            const index = this.mockSinistres.findIndex(s => s.id === id);
            if (index !== -1) {
                this.mockSinistres[index] = { ...this.mockSinistres[index], statut: 'EN_VALIDATION' };
                return of(this.mockSinistres[index]);
            }
        }
        return this.api.patch<Sinistre>(`/api/v1/sinistres/${id}/instruire`, {});
    }

    /**
     * Déclare un nouveau sinistre (PRESTATAIRE)
     */
    declarerSinistre(data: any): Observable<Sinistre> {
        if (environment.simulationMode) {
            const newSinistre: Sinistre = { ...data, id: 'SIM-' + Date.now(), statut: 'OUVERT', dateDeclaration: new Date().toISOString() };
            this.mockSinistres.unshift(newSinistre);
            return of(newSinistre);
        }
        return this.api.post<Sinistre>('/api/v1/sinistres', data);
    }

    /**
     * Confirme un sinistre (CLIENT/MEMBRE)
     */
    confirmeSinistre(id: string): Observable<Sinistre> {
        if (environment.simulationMode) {
            const index = this.mockSinistres.findIndex(s => s.id === id);
            if (index !== -1) {
                this.mockSinistres[index] = { ...this.mockSinistres[index], statut: 'EN_ATTENTE_TRESORIER' };
                return of(this.mockSinistres[index]);
            }
        }
        return this.api.put<Sinistre>(`/api/v1/sinistres/${id}/confirmer`, {});
    }

    /**
     * Récupère les sinistres du membre connecté
     */
    getMesSinistres(): Observable<Sinistre[]> {
        if (environment.simulationMode) {
            return of(this.mockSinistres.slice(0, 5));
        }
        return this.api.get<Sinistre[]>('/api/v1/sinistres/me').pipe(
            map(list => {
                if (!(environment as any).mockPayments) return list;
                return list.map(s => {
                    const over = this.statusOverrides.get(s.id.toString());
                    return over ? { ...s, statut: over } : s;
                });
            })
        );
    }

    /**
     * Récupère le détail d'un sinistre
     */
    getSinistreById(id: string): Observable<Sinistre> {
        if (environment.simulationMode) {
            const s = this.mockSinistres.find(item => item.id === id);
            return s ? of(s) : throwError(() => new Error('Not found'));
        }
        return this.api.get<Sinistre>(`/api/v1/sinistres/${id}`).pipe(
            map(s => {
                const over = this.statusOverrides.get(id.toString());
                return over ? { ...s, statut: over } : s;
            })
        );
    }

    /**
     * Marque un sinistre comme remboursé localement (Hybrid Mode)
     */
    marquerCommeRembourse(id: string) {
        this.statusOverrides.set(id.toString(), 'REMBOURSE');

        // Mettre à jour aussi dans la simulation si on y est
        const idx = this.mockSinistres.findIndex(s => s.id.toString() === id.toString());
        if (idx !== -1) {
            this.mockSinistres[idx].statut = 'REMBOURSE';
        }
    }
}

import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject, map, tap, of, delay, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Membre {
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    adresse: string;
    statut: string;
    qrCode: string;
    email?: string;
    photoUrl?: string;
    plafond?: number;
}

@Injectable({
    providedIn: 'root'
})
export class MembreService {
    private api = inject(ApiService);
    private currentUserSubject = new BehaviorSubject<Membre | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();
    get currentUserSubjectValue() { return this.currentUserSubject.value; }

    // Pour l'Hybrid Mode : déduire du solde réel localement sans toucher à la DB
    private balanceOffsets: Map<string, number> = new Map();

    private mockMembres: Membre[] = [
        { id: 1, nom: 'TCHEO', prenom: 'Simulation', telephone: '90000000', adresse: 'Lomé', statut: 'ACTIF', qrCode: 'QR-1', plafond: 500000 },
        { id: 2, nom: 'KOFFI', prenom: 'Abla', telephone: '91000000', adresse: 'Lomé', statut: 'EN_ATTENTE', qrCode: 'QR-2', plafond: 0 }
    ];

    /**
     * Récupère la liste des membres avec pagination et filtre
     */
    getMembres(params?: any): Observable<any> {
        if (environment.simulationMode) {
            return of({
                content: this.mockMembres,
                totalElements: this.mockMembres.length
            });
        }
        return this.api.get<any>('/api/v1/membres', params);
    }

    /**
     * Valide un membre (ADMIN)
     */
    validerMembre(id: number): Observable<Membre> {
        if (environment.simulationMode) {
            const index = this.mockMembres.findIndex(m => m.id === id);
            if (index !== -1) {
                this.mockMembres[index] = { ...this.mockMembres[index], statut: 'ACTIF' };
                return of(this.mockMembres[index]);
            }
        }
        return this.api.put<Membre>(`/api/v1/membres/${id}/valider`, {});
    }

    /**
     * Crée un nouveau membre (ADMIN)
     */
    creerMembre(membre: any): Observable<Membre> {
        if (environment.simulationMode) {
            const newMembre: Membre = { ...membre, id: Math.floor(Math.random() * 1000), statut: 'EN_ATTENTE', qrCode: 'QR-' + Date.now() };
            this.mockMembres.push(newMembre);
            return of(newMembre);
        }
        return this.api.post<Membre>('/api/v1/membres/admin/creer', membre);
    }

    /**
     * Met à jour un membre existant
     */
    updateMembre(id: number, membre: any): Observable<Membre> {
        if (environment.simulationMode) {
            const index = this.mockMembres.findIndex(m => m.id === id);
            if (index !== -1) {
                this.mockMembres[index] = { ...this.mockMembres[index], ...membre };
                return of(this.mockMembres[index]);
            }
        }
        return this.api.put<Membre>(`/api/v1/membres/${id}`, membre);
    }

    /**
     * Récupère le membre connecté
     */
    getMe(): Observable<Membre> {
        if (environment.simulationMode) {
            const mockMembre = this.mockMembres[0]; // TCHEO par défaut
            this.currentUserSubject.next(mockMembre);
            return of(mockMembre);
        }
        return this.api.get<Membre>('/api/v1/membres/me').pipe(
            map(m => {
                const offset = this.balanceOffsets.get(m.id.toString()) || 0;
                return { ...m, plafond: (m.plafond || 0) + offset };
            }),
            tap(m => this.currentUserSubject.next(m))
        );
    }

    /**
     * Récupère un membre par son ID
     */
    getMembreById(id: number | string): Observable<Membre> {
        if (environment.simulationMode) {
            const m = this.mockMembres.find(item => item.id.toString() === id.toString());
            return m ? of(m) : throwError(() => new Error('Membre non trouvé'));
        }
        return this.api.get<Membre>(`/api/v1/membres/${id}`).pipe(
            map(m => {
                const offset = this.balanceOffsets.get(m.id.toString()) || 0;
                return { ...m, plafond: (m.plafond || 0) + offset };
            })
        );
    }

    /**
     * Met à jour le plafond d'un membre spécifique localement (Simulation)
     */
    updatePlafondById(id: number | string, amount: number) {
        const idStr = id.toString();

        // Update offset for Hybrid/Real mode
        const currentOffset = this.balanceOffsets.get(idStr) || 0;
        this.balanceOffsets.set(idStr, currentOffset + amount);

        // Update in mock list (for Simulation mode)
        const idx = this.mockMembres.findIndex(m => m.id.toString() === idStr);
        if (idx !== -1) {
            this.mockMembres[idx] = {
                ...this.mockMembres[idx],
                plafond: (this.mockMembres[idx].plafond || 0) + amount
            };
        }

        // If it's the current user, update subject too
        const current = this.currentUserSubject.value;
        if (current && current.id.toString() === idStr) {
            this.currentUserSubject.next({
                ...current,
                plafond: (current.plafond || 0) + amount
            });
        }
    }

    /**
     * Met à jour le plafond localement (Simulation - Deprecated for current only)
     */
    updatePlafondLocal(amount: number) {
        const current = this.currentUserSubject.value;
        if (current) this.updatePlafondById(current.id, amount);
    }

    /**
     * Vérifie l'éligibilité d'un membre via son QR Code
     */
    checkEligibilite(qrCode: string): Observable<Membre> {
        if (environment.simulationMode) {
            const m = this.mockMembres.find(item => item.qrCode === qrCode || qrCode.includes(item.id.toString()));
            return m ? of(m) : throwError(() => new Error('Membre non trouvé'));
        }
        return this.api.get<Membre>(`/api/v1/membres/verifier-eligibilite/${qrCode}`);
    }
}

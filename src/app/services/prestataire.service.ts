import { inject, Injectable } from '@angular/core';
import { UtilisateurService, Utilisateur } from './utilisateur.service';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PrestataireService {
    private userService = inject(UtilisateurService);

    /**
     * Récupère tous les prestataires (Utilisateurs avec rôle PRESTATAIRE)
     */
    getAll(): Observable<Utilisateur[]> {
        return this.userService.getAll().pipe(
            map(users => users.filter(u => u.role === 'PRESTATAIRE'))
        );
    }

    /**
     * Crée un nouveau prestataire
     */
    create(data: any): Observable<Utilisateur> {
        return this.userService.create({ ...data, role: 'PRESTATAIRE' });
    }

    /**
     * Active/Désactive un prestataire
     */
    toggleStatus(id: string, active: boolean): Observable<Utilisateur> {
        return this.userService.update(id, { actif: active });
    }

    /**
     * Supprime un prestataire
     */
    delete(id: string): Observable<void> {
        return this.userService.delete(id);
    }
}

import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, signOut, user, IdTokenResult } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap, map, take, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private http = inject(HttpClient);

    // Observable de l'état de l'utilisateur
    user$ = user(this.auth);

    /**
     * Connexion avec Firebase
     */
    login(email: string, pass: string) {
        return from(signInWithEmailAndPassword(this.auth, email, pass)).pipe(
            switchMap(() => this.getToken()),
            tap(token => {
                // Optionnel : Synchroniser avec le backend dès le login
                this.syncWithBackend().subscribe();
            })
        );
    }

    /**
     * Déconnexion
     */
    logout() {
        return from(signOut(this.auth));
    }

    /**
     * Récupère le token JWT Firebase actuel
     */
    getToken(): Observable<string | null> {
        return authState(this.auth).pipe(
            take(1),
            switchMap(user => (user ? from(user.getIdToken()) : of(null)))
        );
    }

    /**
     * Synchronise l'utilisateur Firebase avec la base PostgreSQL du Backend
     */
    syncWithBackend() {
        return this.http.post(`${environment.apiUrl}/api/v1/auth/sync`, {});
    }

    /**
     * Synchronise l'utilisateur et force le rafraîchissement du token pour récupérer les nouveaux droits
     */
    syncAndRefresh(): Observable<string | null> {
        return this.syncWithBackend().pipe(
            switchMap(() => authState(this.auth).pipe(take(1))),
            switchMap(user => {
                if (user) {
                    // Force le rafraîchissement du token Firebase pour inclure les nouveaux Custom Claims
                    return from(user.getIdToken(true));
                }
                return of(null);
            })
        );
    }

    /**
     * Récupère le rôle de l'utilisateur à partir des Custom Claims de Firebase
     * On enlève "ROLE_" si présent pour harmoniser avec le frontend
     */
    getRole(): Observable<string | null> {
        return authState(this.auth).pipe(
            switchMap(user => (user ? from(user.getIdTokenResult()) : of(null))),
            map(result => {
                let role = (result?.claims['role'] as string) || null;
                if (role && role.startsWith('ROLE_')) {
                    role = role.replace('ROLE_', '');
                }
                return role;
            })
        );
    }

    /**
     * Récupère les infos de l'utilisateur connecté depuis le backend
     */
    getMe(): Observable<any> {
        return this.http.get(`${environment.apiUrl}/api/v1/users/me`);
    }

    /**
     * Vérifie si l'utilisateur est connecté
     */
    isLoggedIn(): Observable<boolean> {
        return this.user$.pipe(map(u => !!u));
    }
}

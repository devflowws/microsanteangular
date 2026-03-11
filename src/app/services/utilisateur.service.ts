import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Utilisateur {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    actif: boolean;
    createdAt: string;
    photoUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UtilisateurService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/v1/users`;

    getAll(): Observable<Utilisateur[]> {
        return this.http.get<Utilisateur[]>(this.apiUrl);
    }

    update(id: string, data: any): Observable<Utilisateur> {
        return this.http.put<Utilisateur>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    create(data: any): Observable<Utilisateur> {
        return this.http.post<Utilisateur>(this.apiUrl, data);
    }
}

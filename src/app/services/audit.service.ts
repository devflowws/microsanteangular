import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface AuditLog {
    id: number;
    utilisateur: string;
    action: string;
    entite: string;
    details: string;
    timestamp: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private api = inject(ApiService);

    getLogs(): Observable<AuditLog[]> {
        return this.api.get<AuditLog[]>('/api/v1/admin/audit');
    }
}

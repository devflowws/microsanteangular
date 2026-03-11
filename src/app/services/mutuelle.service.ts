import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface MutuelleConfig {
    id?: number;
    nomOrganisation: string;
    emailContact: string;
    telephoneContact: string;
    cotisationMensuelle: number;
    fraisAdhesion: number;
    soldeParDefaut: number;
    tauxRemboursement: number;
    plafondAnnuelParMembre: number;
    smsTemplateRelance: string;
}

@Injectable({
    providedIn: 'root'
})
export class MutuelleService {
    private api = inject(ApiService);

    getConfig(): Observable<MutuelleConfig> {
        return this.api.get<MutuelleConfig>('/api/v1/admin/config');
    }

    updateConfig(config: MutuelleConfig): Observable<MutuelleConfig> {
        return this.api.put<MutuelleConfig>('/api/v1/admin/config', config);
    }
}

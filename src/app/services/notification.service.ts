import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of, delay } from 'rxjs';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    lu: boolean;
    // Optional fields for history/broadcasts
    date?: string;
    target?: string;
    recipientsCount?: number;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private api = inject(ApiService);

    /**
     * Récupère les notifications de l'utilisateur connecté
     */
    getMyNotifications(page = 0, size = 10): Observable<any> {
        return this.api.get<any>(`/api/v1/notifications/me?page=${page}&size=${size}`);
    }

    /**
     * Nombre de notifications non lues
     */
    getUnreadCount(): Observable<number> {
        return this.api.get<number>('/api/v1/notifications/me/unread-count');
    }

    /**
     * Marquer comme lue
     */
    markAsRead(id: string): Observable<void> {
        return this.api.put<void>(`/api/v1/notifications/${id}/read`, {});
    }

    /**
     * Envoyer un broadcast SMS (Admin)
     */
    sendBroadcast(notification: any): Observable<any> {
        return this.api.post<any>('/api/v1/notifications/broadcast', notification);
    }
}

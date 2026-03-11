import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warn' | 'error';
    removing?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);
    private nextId = 0;

    show(title: string, message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info', duration = 4000) {
        const id = this.nextId++;
        const toast: Toast = { id, title, message, type };
        this.toasts.update(current => [...current, toast]);

        setTimeout(() => {
            this.toasts.update(current =>
                current.map(t => t.id === id ? { ...t, removing: true } : t)
            );
            setTimeout(() => this.remove(id), 300);
        }, duration);
    }

    success(message: string, title = 'Succès') {
        this.show(title, message, 'success');
    }

    error(message: string, title = 'Erreur') {
        this.show(title, message, 'error', 6000);
    }

    warn(message: string, title = 'Attention') {
        this.show(title, message, 'warn');
    }

    info(message: string, title = 'Info') {
        this.show(title, message, 'info');
    }

    remove(id: number) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}

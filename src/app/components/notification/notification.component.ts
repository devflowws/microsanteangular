import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="font-bold text-xl mb-1">Centre de Notifications</h1>
          <p class="text-muted text-sm">Diffusez des SMS et des alertes à l'ensemble des membres ou prestataires.</p>
        </div>
        <button class="ms-btn primary" (click)="showWizard.set(true)" [disabled]="loading()">
          <i class="bi bi-megaphone"></i> Nouvelle Diffusion
        </button>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <!-- ─── WIZARD OVERLAY ─── -->
        <div class="ms-card col-span-12" *ngIf="showWizard()">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="font-bold text-sm uppercase">Envoyer un Broadcast SMS</h3>
                <button class="close-btn" (click)="showWizard.set(false)">×</button>
            </div>
            <form [formGroup]="notifyForm" (ngSubmit)="onSend()" class="p-6">
                <div class="grid grid-cols-2 gap-6 mb-4">
                    <div class="form-group">
                        <label>Sujet / Campagne</label>
                        <input type="text" formControlName="title" class="ms-input" placeholder="ex: Rappel Cotisation Février">
                    </div>
                    <div class="form-group">
                        <label>Cible</label>
                        <select formControlName="target" class="ms-input">
                            <option value="ALL">Tous les utilisateurs</option>
                            <option value="MEMBERS">Membres uniquement</option>
                            <option value="PRESTATAIRES">Prestataires uniquement</option>
                        </select>
                    </div>
                </div>
                <div class="form-group mb-6">
                    <label>Message SMS</label>
                    <textarea formControlName="message" class="ms-input" rows="4" placeholder="Votre message..."></textarea>
                    <div class="flex justify-between mt-1">
                        <span class="text-xs text-muted">Aperçu: [NOM] sera remplacé par le nom du destinataire.</span>
                        <span class="text-xs" [class.text-red]="notifyForm.get('message')?.value.length > 160">
                            {{ notifyForm.get('message')?.value.length }}/160
                        </span>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="button" class="ms-btn ghost" (click)="showWizard.set(false)">Annuler</button>
                    <button type="submit" class="ms-btn primary" [disabled]="notifyForm.invalid || loading()">
                        {{ loading() ? 'Envoi en cours...' : 'Lancer la diffusion' }}
                    </button>
                </div>
            </form>
        </div>

        <!-- ─── HISTORY ─── -->
        <div class="ms-card col-span-12">
            <div class="p-4 border-b">
                <h3 class="font-bold text-sm uppercase tracking-wider text-muted">Historique des Envois</h3>
            </div>
            <div class="p-0 overflow-x-auto">
                <table class="ms-table">
                    <thead>
                        <tr>
                            <th>Campagne</th>
                            <th>Date</th>
                            <th>Cible</th>
                            <th>Audience</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let n of history()">
                            <td>
                                <div class="font-bold text-sm">{{ n.title }}</div>
                                <div class="text-xs text-muted truncate max-w-xs">{{ n.message }}</div>
                            </td>
                            <td>{{ (n.date || n.createdAt) | date:'short' }}</td>
                            <td>
                                <span class="ms-badge sm gray">{{ n.target }}</span>
                            </td>
                            <td>
                                <div class="flex items-center gap-1 font-bold">
                                    <i class="bi bi-people"></i> {{ n.recipientsCount }}
                                </div>
                            </td>
                            <td>
                                <span class="ms-badge sm" [class.green]="n.status === 'SENT'" [class.red]="n.status === 'FAILED'">
                                    {{ n.status === 'SENT' ? 'Délivré' : 'Échec' }}
                                </span>
                            </td>
                        </tr>
                        <tr *ngIf="loading()">
                            <td colspan="5" class="text-center p-8">
                                <div class="table-loader">
                                    <span class="dot"></span>
                                    <span class="dot"></span>
                                    <span class="dot"></span>
                                </div>
                                <div class="text-muted mt-2">Chargement...</div>
                            </td>
                        </tr>
                        <tr *ngIf="history().length === 0 && !loading()">
                            <td colspan="5" class="text-center p-8 text-muted">Aucune notification envoyée.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .ms-input { width: 100%; }
    textarea.ms-input { resize: none; font-family: inherit; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--muted); cursor: pointer; }
    .max-w-xs { max-width: 320px; }

    .table-loader { display: inline-flex; gap: 8px; align-items: center; justify-content: center; }
    .table-loader .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue-primary); box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); animation: table-bounce 0.8s infinite ease-in-out; }
    .table-loader .dot:nth-child(2) { animation-delay: 0.1s; }
    .table-loader .dot:nth-child(3) { animation-delay: 0.2s; }

    @keyframes table-bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
      40% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class NotificationComponent implements OnInit {
    private fb = inject(FormBuilder);
    private notifyService = inject(NotificationService);
    private toast = inject(ToastService);

    history = signal<Notification[]>([]);
    loading = signal(false);
    showWizard = signal(false);
    notifyForm: FormGroup;

    constructor() {
        this.notifyForm = this.fb.group({
            title: ['', Validators.required],
            target: ['ALL', Validators.required],
            message: ['', [Validators.required, Validators.maxLength(160)]]
        });
    }

    ngOnInit() {
        this.fetchHistory();
    }

    fetchHistory() {
        this.loading.set(true);
        // We use getMyNotifications to show history for now
        this.notifyService.getMyNotifications(0, 50).subscribe({
            next: (res: any) => {
                this.history.set(res.content || []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    onSend() {
        if (this.notifyForm.invalid) return;

        this.loading.set(true);
        this.notifyService.sendBroadcast(this.notifyForm.value).subscribe({
            next: (notif) => {
                this.history.update(prev => [notif, ...prev]);
                this.loading.set(false);
                this.showWizard.set(false);
                this.notifyForm.reset({ target: 'ALL' });
                this.toast.success('Diffusion SMS lancée avec succès');
            },
            error: () => { this.toast.error('Erreur lors de l\'envoi de la diffusion'); this.loading.set(false); }
        });
    }
}

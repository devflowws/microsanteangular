import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MutuelleService, MutuelleConfig } from '../../services/mutuelle.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-mutuelle-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="dash-content">
      <!-- ─── HEADER ─── -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="font-bold text-xl mb-1">Paramètres de la Mutuelle</h1>
          <p class="text-muted text-sm">Configurez les règles métier, les plafonds et les informations de l'organisation.</p>
        </div>
        <button class="ms-btn primary" (click)="onSave()" [disabled]="settingsForm.invalid || loading()">
          <i class="bi bi-check-circle"></i> Enregistrer les modifications
        </button>
      </div>

      <form [formGroup]="settingsForm" class="grid grid-cols-12 gap-6">
        <!-- ─── SECTION: ORGANISATION ─── -->
        <div class="ms-card col-span-12 lg:col-span-6">
          <div class="p-4 border-b flex items-center gap-2">
            <i class="bi bi-building text-teal"></i>
            <h3 class="font-bold text-sm uppercase">Organisation</h3>
          </div>
          <div class="p-4 flex flex-col gap-4">
            <div class="form-group">
              <label>Nom de la Mutuelle</label>
              <input type="text" formControlName="nomOrganisation" class="ms-input" placeholder="ex: MicroSanté+ Togo">
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div class="form-group">
                <label>Email de contact</label>
                <input type="email" formControlName="emailContact" class="ms-input" placeholder="contact@mutuelle.tg">
               </div>
               <div class="form-group">
                <label>Téléphone</label>
                <input type="text" formControlName="telephoneContact" class="ms-input" placeholder="+228 90 00 00 00">
               </div>
            </div>
          </div>
        </div>

        <!-- ─── SECTION: FINANCES ─── -->
        <div class="ms-card col-span-12 lg:col-span-6">
          <div class="p-4 border-b flex items-center gap-2">
            <i class="bi bi-cash-coin text-teal"></i>
            <h3 class="font-bold text-sm uppercase">Paramètres Financiers</h3>
          </div>
          <div class="p-4 flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
               <div class="form-group">
                <label>Cotisation Mensuelle (FCFA)</label>
                <input type="number" formControlName="cotisationMensuelle" class="ms-input">
               </div>
               <div class="form-group">
                <label>Frais d'adhésion (FCFA)</label>
                <input type="number" formControlName="fraisAdhesion" class="ms-input">
               </div>
            </div>
            <div class="form-group">
               <label>Solde minimum pour remboursement (FCFA)</label>
               <input type="number" formControlName="soldeParDefaut" class="ms-input">
               <p class="text-xs text-muted mt-1">Le membre doit avoir ce solde pour être éligible.</p>
            </div>
          </div>
        </div>

        <!-- ─── SECTION: MEDICAL / PLAFONDS ─── -->
        <div class="ms-card col-span-12 lg:col-span-6">
          <div class="p-4 border-b flex items-center gap-2">
            <i class="bi bi-hospital text-teal"></i>
            <h3 class="font-bold text-sm uppercase">Prise en charge Médicale</h3>
          </div>
          <div class="p-4 flex flex-col gap-4">
            <div class="form-group">
              <label>Plafond Annuel par Membre (FCFA)</label>
              <input type="number" formControlName="plafondAnnuelParMembre" class="ms-input">
              <p class="text-xs text-muted mt-1">Limite maximale de remboursement cumulé par an (Prise en charge à 100%).</p>
            </div>
          </div>
        </div>

        <!-- ─── SECTION: NOTIFICATIONS ─── -->
        <div class="ms-card col-span-12 lg:col-span-6">
          <div class="p-4 border-b flex items-center gap-2">
            <i class="bi bi-chat-dots text-teal"></i>
            <h3 class="font-bold text-sm uppercase">Modèles SMS (Relance)</h3>
          </div>
          <div class="p-4 flex flex-col gap-4">
            <div class="form-group">
                <label>SMS de rappel de cotisation</label>
                <textarea formControlName="smsTemplateRelance" class="ms-input" rows="4"></textarea>
                <div class="flex justify-between mt-1">
                    <span class="text-xs text-muted">Variables: [NOM], [MONTANT], [MOIS]</span>
                    <span class="text-xs" [class.text-red]="settingsForm.get('smsTemplateRelance')?.value.length > 160">
                        {{ settingsForm.get('smsTemplateRelance')?.value.length }}/160
                    </span>
                </div>
            </div>
          </div>
        </div>
      </form>

      <div class="mt-8 p-4 bg-teal-lite rounded-xl border border-teal flex items-center gap-4">
        <div class="p-3 bg-white rounded-full text-teal">
            <i class="bi bi-info-circle-fill text-xl"></i>
        </div>
        <div>
            <div class="font-bold text-teal">Sécurité du système</div>
            <p class="text-sm text-teal-dark opacity-80">Toute modification de ces paramètres est enregistrée dans le journal d'audit et affectera les calculs de sinistres à venir.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
    .ms-input { width: 100%; }
    textarea.ms-input { resize: none; font-family: inherit; }

    input[type=range] {
      accent-color: var(--blue-primary);
    }
  `]
})
export class MutuelleSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mutuelleService = inject(MutuelleService);
  private toast = inject(ToastService);

  loading = signal(false);
  settingsForm: FormGroup;

  constructor() {
    this.settingsForm = this.fb.group({
      nomOrganisation: ['', Validators.required],
      emailContact: ['', [Validators.required, Validators.email]],
      telephoneContact: ['', Validators.required],
      cotisationMensuelle: [0, [Validators.required, Validators.min(0)]],
      fraisAdhesion: [0, [Validators.required, Validators.min(0)]],
      soldeParDefaut: [0, [Validators.required, Validators.min(0)]],
      tauxRemboursement: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
      plafondAnnuelParMembre: [0, [Validators.required, Validators.min(0)]],
      smsTemplateRelance: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.fetchConfig();
  }

  fetchConfig() {
    this.loading.set(true);
    this.mutuelleService.getConfig().subscribe({
      next: (config) => {
        this.settingsForm.patchValue(config);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSave() {
    if (this.settingsForm.invalid) return;

    this.loading.set(true);
    this.mutuelleService.updateConfig(this.settingsForm.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Paramètres mis à jour avec succès');
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Erreur lors de la mise à jour : ' + err.message);
      }
    });
  }
}

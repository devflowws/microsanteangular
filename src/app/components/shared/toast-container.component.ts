import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="tc">
      <div *ngFor="let t of toastService.toasts()"
           class="tn"
           [ngClass]="[t.type, t.removing ? 'removing' : '']"
           (click)="toastService.remove(t.id)">
        <i class="bi tn-icon" [ngClass]="{
          'bi-check-circle-fill': t.type === 'success',
          'bi-x-octagon-fill':   t.type === 'error',
          'bi-exclamation-triangle-fill': t.type === 'warn',
          'bi-info-circle-fill': t.type === 'info'
        }"></i>
        <div class="tn-body">
          <div class="tn-title">{{ t.title }}</div>
          <div class="tn-msg">{{ t.message }}</div>
        </div>
        <button class="tn-close" (click)="$event.stopPropagation(); toastService.remove(t.id)">
          <i class="bi bi-x-lg"></i>
        </button>
        <div class="tn-progress"><div class="tn-bar" [ngClass]="t.type"></div></div>
      </div>
    </div>
  `,
    styles: [`
    .tc {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      display: flex; flex-direction: column-reverse; gap: 10px;
      pointer-events: none; max-width: 400px;
    }

    .tn {
      pointer-events: auto;
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px 18px; border-radius: 10px;
      min-width: 340px; cursor: pointer; position: relative;
      overflow: hidden;
      animation: slideUp .35s cubic-bezier(.21,1.02,.73,1) forwards;
      box-shadow: 0 8px 30px -4px rgba(0,0,0,.25);
    }
    .tn.removing { animation: slideOut .3s ease-in forwards; }

    /* ── Success = Green ── */
    .tn.success { background: #16A34A; color: #fff; }
    /* ── Error = Red ── */
    .tn.error   { background: #DC2626; color: #fff; }
    /* ── Warn = Amber ── */
    .tn.warn    { background: #D97706; color: #fff; }
    /* ── Info = Blue ── */
    .tn.info    { background: #2563EB; color: #fff; }

    .tn-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; opacity: .9; }
    .tn-body { flex: 1; min-width: 0; }
    .tn-title { font-size: 13px; font-weight: 700; line-height: 1.3; }
    .tn-msg   { font-size: 12.5px; opacity: .88; margin-top: 2px; line-height: 1.4; }

    .tn-close {
      background: none; border: none; color: rgba(255,255,255,.6);
      cursor: pointer; padding: 2px; font-size: 14px; flex-shrink: 0;
      transition: color .15s;
    }
    .tn-close:hover { color: #fff; }

    /* ── Progress bar ── */
    .tn-progress {
      position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      background: rgba(255,255,255,.2);
    }
    .tn-bar {
      height: 100%; border-radius: 0 3px 0 0;
      animation: shrink 4s linear forwards;
    }
    .tn-bar.success { background: #86EFAC; }
    .tn-bar.error   { background: #FCA5A5; animation-duration: 6s; }
    .tn-bar.warn    { background: #FDE68A; }
    .tn-bar.info    { background: #93C5FD; }

    @keyframes slideUp {
      from { transform: translateY(30px) scale(.95); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes slideOut {
      to { transform: translateX(110%); opacity: 0; }
    }
    @keyframes shrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `]
})
export class ToastContainerComponent {
    toastService = inject(ToastService);
}

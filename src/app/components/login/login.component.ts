import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="login-container">
      <div class="login-card">
        <div class="brand">
          <div class="logo-box">M</div>
          <h1>MicroSanté<span>+</span></h1>
          <p>Portail d'administration</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="votre@email.com"
              #emailInput="ngModel"
            >
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              placeholder="••••••••"
            >
          </div>

          @if (error()) {
            <div class="error-msg">
              <i class="icon">error</i> {{ error() }}
            </div>
          }

          <button type="submit" [disabled]="loading() || !loginForm.valid">
            @if (loading()) {
              <span class="spinner"></span> Connexion...
            } @else {
              Se connecter
            }
          </button>
        </form>

        <div class="footer">
          &copy; 2026 MicroSanté+ | IPNET Innovation
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0D9488; /* fond uni */
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .login-container::before {
      content: '';
      position: absolute;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      top: -200px;
      right: -200px;
      border-radius: 50%;
      animation: float 20s infinite ease-in-out;
    }

    .login-container::after {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      bottom: -150px;
      left: -150px;
      border-radius: 50%;
      animation: float 15s infinite ease-in-out reverse;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(5deg); }
      66% { transform: translate(-20px, 20px) rotate(-5deg); }
    }

    .login-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px);
      padding: 48px 40px;
      border-radius: 24px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0,0,0,0.08);
      border: 1px solid rgba(226, 232, 240, 0.8);
      position: relative;
      z-index: 1;
      animation: slideUp 0.6s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .brand {
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-box {
      width: 64px;
      height: 64px;
      background: #0F172A; /* fond uni sombre */
      color: white;
      font-weight: 800;
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      margin: 0 auto 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
      position: relative;
    }

    .logo-box::before {
      content: '';
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg, #14B8A6, #0D9488);
      border-radius: 18px;
      z-index: -1;
      opacity: 0.5;
      filter: blur(8px);
    }

    h1 {
      color: #0F172A;
      margin: 0;
      font-size: 28px;
      letter-spacing: -0.02em;
      font-weight: 700;
    }

    h1 span {
      color: #0D9488;
      font-weight: 800;
    }

    p {
      color: #64748B;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      color: #334155;
      margin-bottom: 8px;
      font-size: 13.5px;
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: 13px 16px;
      background: #F8FAFC;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      color: #0F172A;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
      box-sizing: border-box;
      font-size: 14px;
      font-family: inherit;
    }

    input:focus {
      border-color: #0D9488;
      background: #FFFFFF;
      box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1);
    }

    input::placeholder {
      color: #94A3B8;
    }

    button {
      width: 100%;
      padding: 14px 20px;
      background: #0D9488; /* uni */
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-top: 8px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
      position: relative;
      overflow: hidden;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(13, 148, 136, 0.35);
      background: #0F766E;
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none !important;
    }

    .error-msg {
      background: #FEE2E2;
      color: #DC2626;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 16px;
      border: 1px solid #FECACA;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: shake 0.4s;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    .footer {
      margin-top: 32px;
      text-align: center;
      color: #94A3B8;
      font-size: 12px;
      padding-top: 24px;
      border-top: 1px solid #E2E8F0;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    loading = signal(false);
    error = signal<string | null>(null);

    onSubmit() {
        this.loading.set(true);
        this.error.set(null);

        this.authService.login(this.email, this.password).subscribe({
            next: () => {
                this.router.navigate(['/admin/dashboard']);
            },
            error: (err) => {
                this.loading.set(false);
                this.error.set("Email ou mot de passe incorrect.");
                console.error(err);
            }
        });
    }
}

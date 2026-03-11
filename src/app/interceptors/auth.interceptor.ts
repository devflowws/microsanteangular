import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { switchMap, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    // On récupère le token de manière asynchrone
    return authService.getToken().pipe(
        take(1),
        switchMap(token => {
            if (token) {
                // On clone la requête pour ajouter le header Authorization
                const authReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return next(authReq);
            }
            // Si pas de token, on continue la requête normale
            return next(req);
        })
    );
};

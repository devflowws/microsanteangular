import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GlobalActionService {
    /**
     * Émet un événement quand le bouton d'action principal du Shell est cliqué.
     * La valeur émise est le label du bouton ou le type d'action.
     */
    private actionTriggeredSource = new Subject<string>();
    actionTriggered$ = this.actionTriggeredSource.asObservable();

    triggerAction(actionType: string) {
        this.actionTriggeredSource.next(actionType);
    }
}

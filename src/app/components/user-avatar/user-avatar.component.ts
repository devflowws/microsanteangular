import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-user-avatar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="avatar-circle" [style.width]="size + 'px'" [style.height]="size + 'px'" [style.border]="border">
      <div *ngIf="photoUrl" class="avatar-img" 
           [style.backgroundImage]="'url(' + photoUrl + ')'">
      </div>
      <div *ngIf="!photoUrl" class="avatar-initials" [style.fontSize]="fontSize + 'px'">
        {{ initials }}
      </div>
    </div>
  `,
    styles: [`
    .avatar-circle {
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--teal-mid, #12936A), var(--blue, #1570EF));
      color: white;
      font-weight: 700;
      flex-shrink: 0;
      position: relative;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .avatar-initials {
      text-transform: uppercase;
    }
  `]
})
export class UserAvatarComponent {
    @Input() photoUrl: string | null | undefined = null;
    @Input() initials: string = '';
    @Input() size: number = 40;
    @Input() border: string = 'none';

    get fontSize(): number {
        return Math.floor(this.size * 0.4);
    }
}

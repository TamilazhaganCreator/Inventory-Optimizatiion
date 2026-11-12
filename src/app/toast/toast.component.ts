import { ChangeDetectionStrategy } from '@angular/core';
import { transition, animate, style, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { GlobalService } from '../global.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
    selector: 'toast-component',
    styleUrls: [
        './toast.component.css'
    ],
    template: `
    <div [@ToastAnimator] class="valign-wrapper row no-margin-bottom"  *ngIf="show"
        [ngClass]="{'snackbar-success': (type == 'success'), 'snackbar-error':(type == 'error') ,'snackbar-warning': (type == 'warning')}">
        <div class ="col s12 nopad left-align valign-wrapper">
        <div class="col s10 nopad">{{message}}</div>
        <div class ="col s2" style="padding-right:0">
            <i class="small material-icons  closeicon" title ="Close"  (click)="close()" aria-hidden="true">close</i>
        </div>
        </div>
    </div>
    `,
    animations: [
        trigger("ToastAnimator", [
            transition(":enter", [
                style({ transform: "translateY(100%)", opacity: 0 }),
                animate("0.2s", style({ transform: "translateY(0)", opacity: 1 }))
            ]),
            transition(":leave", [
                style({ transform: "translateY(0)", opacity: 1 }),
                animate("0.2s", style({ transform: "translateY(100%)", opacity: 0 }))
            ])
        ])
    ]
})
export class ToastComponent {
    message: String = ""
    type: String = ""
    show = false
    private subscription = new Subscription()
    private setTimeoutFunc: any = null

    constructor(private global: GlobalService) {
        this.subscription = this.global.setToast()
            .subscribe(details => {
                if (details[0] != this.message) {
                    if (this.setTimeoutFunc != null) {
                        clearTimeout(this.setTimeoutFunc)
                        this.show = false
                    }
                    this.message = details[0]
                    this.type = details[1]
                    this.show = true
                    if (!details[2]) {
                        this.dismiss()
                    }
                }
            });
    }

    dismiss() {
        this.setTimeoutFunc = setTimeout(() => {
            this.show = false
            this.message = null
        }, 3000);
    }

    close() {
        this.show = false;
        this.message = null
    }

    ngOnDestroy() {
        if (this.subscription != null) {
            this.subscription.unsubscribe();
        }
    }

}

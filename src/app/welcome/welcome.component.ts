import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { GlobalService } from '../global.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-welcome',
  templateUrl: './welcome.component.html'
})
export class WelcomeComponent {

  private email: string = ""
  private pwd: string = ""
  constructor(private global: GlobalService) { }

}

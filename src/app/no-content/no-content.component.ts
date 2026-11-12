import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'no-content',
  template: `
    <style>
      .full-container{
        height:100vh;
        text-align:center;
      }
      .img-div{
        background-color:#e1f4fb;
      }
      .not-found{
        color:#f33d39; 
        padding-left:1%;
        padding-top:3%;
        font-size: 4rem;
      }
      .msg{
        color:dimgray;  
        padding-left:1%;
        font-size: 1rem;
      }
      img{
        vertical-align: bottom;
        margin-top:8%;
      }
      .home-btn{
        width: 10%;
        padding:0.5rem;
        margin-top: 2%;
      }
    </style>
    <div class="full-container">
      <div>
      <div class="access-denied-design" class="not-found"> Page not found</div>
      <div class="permission-text" class="msg"> The page you are looking for doesn't exist or an another error occured</div>
      <div class="hollowbluebutton pointer container home-btn"  (click)="home()">Back to home</div>
      </div>
    </div>
  `
})
export class NoContentComponent {

  constructor(private router: Router) { }

  home() {
    this.router.navigate(['/'])
  }
}

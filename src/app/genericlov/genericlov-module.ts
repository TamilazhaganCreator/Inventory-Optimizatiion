import { MaterializeModule } from '../ui/materialize.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GenericLovComponent } from './genericlov.component';


@NgModule({
  imports: [
    MaterializeModule,
    CommonModule,
    FormsModule
  ],
  declarations: [
      GenericLovComponent
  ],
  exports:[
      GenericLovComponent
  ]
})
export class GenericLovModule { 

}
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterializeModule } from '../ui/materialize.module';
import { GenericLovModule } from '../genericlov/genericlov-module';
import { CustomermasterComponent } from './customermaster/customermaster.component';
import { ItemmasterComponent } from './itemmaster/itemmaster.component';
import { MasterRoutingModule } from './master-routing.module';
import { TaxmasterComponent } from './taxmaster/taxmaster.component';
import { UnitmasterComponent } from './unitmaster/unitmaster.component';

@NgModule({
  imports: [
    CommonModule,
    MasterRoutingModule,
    FormsModule,
    GenericLovModule,
    MaterializeModule
  ],
  declarations: [
      ItemmasterComponent,
      CustomermasterComponent,
      TaxmasterComponent,
      UnitmasterComponent
  ]
})
export class MasterModule { 

}
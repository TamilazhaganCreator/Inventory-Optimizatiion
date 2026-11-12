import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterializeModule } from '../ui/materialize.module';
import { GenericLovModule } from '../genericlov/genericlov-module';
import { NumberToWordsPipe } from '../utils/number-to-words.Pipe';
import { PurchaseComponent } from './purchase/purchase.component';
import { SalestransactionComponent } from './salestransaction/salestransaction.component';
import { TransactionRoutingModule } from './transaction-routing.module';
import { TransactionService } from './transaction.service';
import { CashpaymentsComponent } from './cashpayments/cashpayments.component';

@NgModule({
  imports: [
    CommonModule,
    TransactionRoutingModule,
    FormsModule,
    GenericLovModule,
    MaterializeModule
  ],
  declarations: [
    SalestransactionComponent,
    PurchaseComponent,
    NumberToWordsPipe,
    CashpaymentsComponent
  ],
  providers: [
    TransactionService
  ]
})
export class TransactionModule {

}
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NoContentComponent } from './no-content';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'master', loadChildren: './master/master.module#MasterModule' },
  { path: 'report', loadChildren: './reports/report.module#ReportModule' },
  { path: 'transaction', loadChildren: './transaction/transaction.module#TransactionModule' },
  { path: '**', component: NoContentComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

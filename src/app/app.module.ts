import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterializeModule } from './ui/materialize.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GenericLovModule } from './genericlov/genericlov-module';
import { GenericLovService } from './genericlov/genericlov.service';
import { MasterService } from './master/master.service';
import { NoContentComponent } from './no-content';
import { ToastModule } from './toast/toast-module';
import { SearchPipe } from './utils/search.pipe';
import { ArrayAscSortPipe } from './utils/sortasc.pipe';
import { ArrayDescSortPipe } from './utils/sortdesc.pipe';
import { WelcomeComponent } from './welcome/welcome.component';

@NgModule({
  declarations: [
    AppComponent,
    SearchPipe,
    NoContentComponent,
    WelcomeComponent,
    ArrayAscSortPipe,
    ArrayDescSortPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterializeModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    GenericLovModule,
    ToastModule,
  ],
  providers: [
    provideZoneChangeDetection(),
    GenericLovService,
    MasterService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

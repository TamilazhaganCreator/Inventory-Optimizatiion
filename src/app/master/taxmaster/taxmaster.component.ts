import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { GenericLovService } from './../../genericlov/genericlov.service';
import { GlobalService } from './../../global.service';
import { TaxModel } from './../master.model';
import { MasterService } from './../master.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-taxmaster',
  templateUrl: './taxmaster.component.html',
  styleUrls: ['../master.component.css']
})
export class TaxmasterComponent {

  taxObject = new TaxModel()
  numberwith2DecimalRegex: RegExp = /^\d{0,8}(?:\.\d{0,2})?$/;
  private subscriptions: Subscription[] = []

  constructor(private masterService: MasterService, private global: GlobalService, private lovService: GenericLovService) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "tax")
          this.taxObject = res[0]
      })
  }

  saveTax() {
    if (this.taxObject.cgst_perc && this.taxObject.sgst_perc && this.taxObject.igst_perc && this.taxObject.cess_perc != undefined) {
      if (this.checkIgst()) {
        if (this.taxObject.code)
          this.updateTax()
        else
          this.addTax();
      }
    } else {
      this.global.showToast("Kindly fill all the details", "warning", false)
    }
  }

  private updateTax() {
    this.global.loader = true;
    this.masterService.updateTax(this.taxObject)
      .then(res => {
        this.taxObject = new TaxModel();
        this.global.loader = false
        this.global.showToast("Tax updated successfully", "success", false)
      }).catch(e => {
        this.global.showToast("Error occured" + e.toString(), "error", true);
      });
  }

  private addTax() {
    this.global.loader = true;
    this.global.getLatestId("taxmaster", "code").then((res) => {
      let code = -1
      if (res.docs.length > 0) {
        res.forEach((doc) => {
          let tempTax = doc.data() as TaxModel
          code = tempTax.code + 1
        })
      } else if (res.docs && res.docs.length == 0) {
        code = 1
      }
      if (code > -1) {
        this.taxObject.code = code
        this.masterService.addTax(this.taxObject)
          .then(res => {
            this.taxObject = new TaxModel();
            this.global.loader = false
            this.global.showToast("Tax added successfully", "success", false)
          }).catch(e => {
            this.global.loader = false
            this.global.showToast("Error occured" + e.toString(), "error", true);
          });
      } else {
        this.global.showToast("There is no some connectivity issues,Retry again", "error", true)
      }
    }).catch(e => {
      this.global.loader = false
      this.global.showToast("Error occured" + e.toString(), "error", true);
    });

  }

  clearItem() {
    this.taxObject = new TaxModel();
  }

  checkNumbersValue(event, field) {
    if (this.numberwith2DecimalRegex.test(event.target.value)) {
      if (event.target.value != '') {
        this.taxObject[field] = +event.target.value
      } else {
        this.taxObject[field] = null
      }
    } else {
      event.target.value = this.taxObject[field] ? this.taxObject[field] : ''
    }
  }

  checkIgst(): boolean {
    if (this.taxObject.igst_perc != (this.taxObject.cgst_perc + this.taxObject.sgst_perc)) {
      this.global.showToast("IGST value must be equal to sum of cgst and sgst", "warning", false)
      return false
    }
    return true
  }

  viewAllTax() {
    this.lovService.showLovModal(true, "tax", "", 0)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(element => {
      if (element != null)
        element.unsubscribe()
    })
  }
}

import { ChangeDetectionStrategy } from '@angular/core';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { GlobalService } from 'src/app/global.service';
import { CustomerModel } from '../master.model';
import { MasterService } from '../master.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-customermaster',
  templateUrl: './customermaster.component.html'
})
export class CustomermasterComponent implements OnInit {

  private subscriptions: Subscription[] = []
  customer = new CustomerModel();
  private collectionName = "customermaster"
  masterName = "Customer"
  @ViewChild("nameInput", { static: false }) private nameInput: ElementRef;

  constructor(private router: Router, private global: GlobalService, private service: MasterService, private lovService: GenericLovService) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "Supplier" || res[1] == "Customer")
          this.customer = res[0]
        this.customer.moneyReceived = this.customer.creditMoney = 0
      })

    this.subscriptions[1] = this.lovService.getLovLastFocus()
      .subscribe(res => {
        if (res != -1) {
          this.nameInput.nativeElement.focus()
        }
      })
  }

  ngOnInit() {
    if (this.router.url.includes("supplier")) {
      this.collectionName = "suppliermaster"
      this.masterName = "Supplier"
    }
  }

  saveCustomer() {
    if (this.customer.name != null && this.customer.mobileNo != null && this.customer.name != '' &&
      this.customer.gstNo != null && this.customer.gstNo != '') {
      if (this.customer.mobileNo.toString().length == 10) {
        if (this.customer.gstNo.toString().length == 15) {
          if (this.customer.location != null) {
            this.setCustomerAmt()
            if (this.customer.code == null) {
              this.addCustomer()
            } else {
              this.udpateCustomer()
            }
          } else {
            this.global.showToast("Choose location type", "warning", false)
          }
        } else {
          this.global.showToast("Enter a valid gst no", "warning", false)
        }
      } else {
        this.global.showToast("Enter a valid mobile no", "warning", false)
      }
    } else {
      this.global.showToast("Kindly fill all  the mandatory fields", "warning", false)
    }
  }

  private setCustomerAmt() {
    if (this.customer.moneyReceived) {
      this.customer.amount = this.customer.amount + this.customer.moneyReceived
    }

    if (this.customer.creditMoney) {
      this.customer.amount = this.customer.amount - this.customer.creditMoney
    }
  }

  checkNumberLength(field, event) {
    if (event.target.value.toString().length <= 10) {
      if (event.target.value != '')
        this.customer[field] = +(event.target.value)
      else
        this.customer[field] = null
    } else {
      event.target.value = this.customer[field]
    }
  }

  clearDetails() {
    this.customer = new CustomerModel()
    this.global.showToast("Reset successfully", "success", false)
    // if (this.customer.code == null) {
    //   this.customer = new CustomerModel()
    //   this.global.showToast("Reset successfully", "success", false)
    // } else {
    //   this.global.loader = true
    //   this.service.deleteItem(this.collectionName, this.customer.code.toString())
    //     .then(res => {
    //       this.global.showToast("Deleted successfully", "success", false)
    //       this.global.loader = false
    //       this.customer = new CustomerModel()
    //     }).catch(e => {
    //       this.global.showToast("Error occured" + e, "error", true)
    //     })
    // }
  }

  viewAllItems() {
    this.lovService.showLovModal(true, this.masterName, "", 0)
  }

  addCustomer() {
    this.global.loader = true
    this.global.getLatestId(this.collectionName, "code").then((res) => {
      let code = -1
      if (res.docs.length > 0) {
        res.forEach((doc) => {
          let cust = doc.data() as CustomerModel
          code = cust.code + 1
        })
      } else if (res.docs && res.docs.length == 0) {
        code = 1
      }
      if (code > -1) {
        this.customer.code = code
        this.service.addCustomer(this.collectionName, this.customer)
          .then(res => {
            this.customer = new CustomerModel();
            this.global.loader = false
            this.global.showToast(this.masterName + " added successfully", "success", false)
          }).catch(e => {
            this.global.loader = false
            this.global.showToast("Error occured " + e, "error", true)
          })
      } else {
        this.global.showToast("There is some connectivity issues, Retry", "error", true)
      }
    }).catch(e => {
      this.global.loader = false
      this.global.showToast("Error occured " + e, "error", true)
    })
  }

  checkAmt(event, field) {
    if (this.global.numberOnlyFormatRegex.test(event.target.value)) {
      if (event.target.value != "") {
        this.customer[field] = +(event.target.value)
      } else {
        this.customer[field] = null;
      }
    } else {
      event.target.value = this.customer[field] ? this.customer[field] : ''
    }
  }

  udpateCustomer() {
    this.global.loader = true
    this.service.updateCustomer(this.collectionName, this.customer)
      .then(res => {
        this.customer = new CustomerModel();
        this.global.loader = false
        this.global.showToast(this.masterName + " updated successfully", "success", false)
      }).catch(e => {
        this.global.loader = false
        this.global.showToast("Error occured " + e, "error", true)
      })
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(element => {
      if (element != null)
        element.unsubscribe()
    })
  }

}

import { ChangeDetectionStrategy } from '@angular/core';
import { CustomerModel } from './../../master/master.model';
import { Subscription } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { GlobalService } from './../../global.service';
import { CashPaymentModel } from './../transaction.model';
import { TransactionService } from './../transaction.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-cashpayments',
  templateUrl: './cashpayments.component.html'
})
export class CashpaymentsComponent implements OnInit {

  cashPayment = new CashPaymentModel()
  subscriptions: Subscription[] = []
  numberwith2DecimalRegex: RegExp = /^\d{0,8}(?:\.\d{0,2})?$/;

  constructor(private global: GlobalService, private lovService: GenericLovService,
    private service: TransactionService) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "supplier" || res[1] == "customer") {
          let cust = res[0] as CustomerModel
          this.cashPayment.name = cust.name
          this.cashPayment.code = cust.code
          this.cashPayment.personAmt = cust.amount
        }
      })
  }

  clearCustomerDetails() {
    this.cashPayment.code = null
    this.cashPayment.name = null
  }

  ngOnInit() {
  }

  setDate(event) {
    var dateArray = event.target.value.toString().split("/")
    this.cashPayment.date = new Date(dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0] + " 00:00:00")
    this.cashPayment.timestamp = this.cashPayment.date.getTime()
  }


  setPersonType(event) {
    this.cashPayment.personType = event.target.value
  }

  setPaymentType(event) {
    this.cashPayment.paymentType = event.target.value
  }


  checkNumberValue(event) {
    if (this.numberwith2DecimalRegex.test(event.target.value)) {
      if (event.target.value != '' && event.target.value != '.') {
        this.cashPayment.amount = +(event.target.value)
      } else {
        this.cashPayment.amount = null
      }
    } else {
      event.target.value = this.cashPayment.amount ? this.cashPayment.amount : ''
    }
  }

  reset() {
    this.cashPayment = new CashPaymentModel();
    this.global.showToast("Reset Successfully", "success", false)
  }

  viewAll() {
    if (this.cashPayment.personType) {
      this.lovService.showLovModal(true, this.cashPayment.personType, "", 0)
    } else {
      this.global.showToast("Kindly select the person type", "warning", false)
    }
  }


  roundOff(value): number {
    return Math.round(value * Math.pow(10, 2)) / (Math.pow(10, 2));
  }

  addPayment() {
    this.global.loader = true
    this.global.getLatestId(this.cashPayment.personType + "payments", "id").then((res) => {
      let id = -1
      if (res.docs.length > 0) {
        res.forEach((doc) => {
          let cust = doc.data() as CashPaymentModel
          id = cust.id + 1
        })
      } else if (res.docs && res.docs.length == 0) {
        id = 1
      }
      if (id > -1) {
        this.cashPayment.id = id
        this.service.addPayment(this.cashPayment.personType + "payments", this.cashPayment)
          .then(res => {
            let amount = this.cashPayment.personAmt + this.cashPayment.amount
            this.service.updateCustomerAmount(this.cashPayment.personType.toLowerCase() + "master", this.cashPayment.code.toString(), amount)
              .then(res => {
                this.cashPayment = new CashPaymentModel();
                this.global.loader = false
                this.global.showToast("Payment added successfully", "success", false)
              }).catch(e => {
                this.global.showToast("Error occured" + e, "error", true)
              })
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

  save() {
    if (this.cashPayment.personType) {
      if (this.cashPayment.code) {
        if (this.cashPayment.date) {
          if (this.cashPayment.paymentType) {
            if (this.cashPayment.note) {
              if (this.cashPayment.amount) {
                this.addPayment();
              } else {
                this.global.showToast("Kindly enter the amount", "warning", false)
              }
            } else {
              this.global.showToast("Kindly enter the note", "warning", false)
            }
          } else {
            this.global.showToast("Kindly select the payment type", "warning", false)
          }
        } else {
          this.global.showToast("Kindly select the date", "warning", false)
        }
      } else {
        this.global.showToast("Kindly select the customer name", "warning", false)
      }
    } else {
      this.global.showToast("Kindly select the person type", "warning", false)
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(e => {
      e.unsubscribe();
    })
  }
}

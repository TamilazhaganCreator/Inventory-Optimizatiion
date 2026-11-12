import { ChangeDetectionStrategy } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, EventEmitter, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterializeAction } from '../../ui/materialize.module';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { GlobalService } from 'src/app/global.service';
import { CustomerModel, ItemModel, TaxModel } from 'src/app/master/master.model';
import { PurchaseDetailModel, PurchaseHeaderModel } from '../transaction.model';
import { TransactionService } from '../transaction.service';
import { UnitModel } from './../../master/master.model';
import { MasterService } from './../../master/master.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['../salestransaction/salestransaction.component.css'],
  animations: [
    trigger("rotatedUp", [
      state("default", style({ transform: "rotate(0)" })),
      state("rotated", style({ transform: "rotate(-180deg)" })),
      transition("rotated => default", animate("100ms ease-out")),
      transition("default => rotated", animate("100ms ease-in"))
    ])
  ]
})
export class PurchaseComponent implements OnInit {

  invoiceDatePickerParams = [
    {
      format: "dd/mm/yyyy",
      close: "Ok",
      clear: "",
      max: true
    }
  ];
  chqModalParams = [
    {
      startingTop: '10%',
      inDuration: 300,
      outDuration: 200,
      dismissible: false,
      ready: () => {
        this.saveChqButton.nativeElement.blur()
        this.clearChqButton.nativeElement.blur()
      }, complete: () => {
        this.purchaseHeader.paidAmt = this.purchaseHeader.chqAmt
      }
    }
  ]
  confirmationModalParams = [
    {
      startingTop: '30%',
      endingTop: '30%'
    }
  ]

  paymentTypeShow = true
  purchaseHeader = new PurchaseHeaderModel();
  purchaseDetails: PurchaseDetailModel[] = []
  private subscriptions: Subscription[] = []
  confimationModalHeader: string = ""
  chqModalAction = new EventEmitter<string | MaterializeAction>();
  confirmationModal = new EventEmitter<string | MaterializeAction>();
  deletePwd = ""
  @ViewChildren("itemCodeInputs") private itemCodeInputs: QueryList<any>;
  @ViewChildren("quantityInputs") private quantityInputs: QueryList<any>;
  @ViewChildren("unitInputs") private unitInputs: QueryList<any>;
  @ViewChild("clearChqButton", { static: false }) private clearChqButton: ElementRef;
  @ViewChild("saveChqButton", { static: false }) private saveChqButton: ElementRef;
  @ViewChild("invoiceNoInput", { static: false }) private invoiceNoInput: ElementRef;
  @ViewChild("custNameInput", { static: false }) private custNameInput: ElementRef;
  @ViewChild("spInputs", { static: false }) private spInputs: QueryList<any>;
  @ViewChild("otherChargesInput", { static: false }) private otherChargesInput: ElementRef;
  @ViewChild("paidAmtInput", { static: false }) private paidAmtInput: ElementRef;
  private alphaNumericRegex: RegExp = /^[a-zA-Z0-9\/._-]*$/
  private tenNumberWithTwoDigitsFormatRegex: RegExp = /^\d{0,10}(?:\.\d{0,2})?$/;
  billShow: boolean = false

  constructor(private lovService: GenericLovService, private global: GlobalService, private service: TransactionService,
    private router: ActivatedRoute, private masterService: MasterService, private routerChange: Router) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "items") {
          var item = res[0] as ItemModel
          this.purchaseDetails[res[2]].itemCode = item.code
          this.purchaseDetails[res[2]].itemName = item.name
          this.purchaseDetails[res[2]].hsncode = item.hsncode
          this.purchaseDetails[res[2]].taxPercentage = item.taxPercentage
          this.purchaseDetails[res[2]].cgst_perc = item.cgst_perc
          this.purchaseDetails[res[2]].sgst_perc = item.sgst_perc
          this.purchaseDetails[res[2]].igst_perc = item.igst_perc
          this.purchaseDetails[res[2]].cess_perc = item.cess_perc
          this.purchaseDetails[res[2]].stockValue = item.stock
          this.purchaseDetails[res[2]].sales = item.sales
          this.purchaseDetails[res[2]].purchase = item.purchase
          this.purchaseDetails[res[2]].unit = item.unit
          this.purchaseDetails[res[2]].sp = item.sp
          this.setElementFocus(this.quantityInputs, res[2])
        } else if (res[1] == "Supplier") {
          var supplier = res[0] as CustomerModel
          this.purchaseHeader.supplierName = supplier.name
          this.purchaseHeader.supplierAddress = supplier.address
          this.purchaseHeader.supplierGSTNo = supplier.gstNo
          this.purchaseHeader.supplierAmt = supplier.amount
          this.purchaseHeader.supplierCode = supplier.code
          this.purchaseHeader.supplierValid = true
          this.purchaseHeader.supplierLocation = supplier.location
          this.invoiceNoInput.nativeElement.focus();
        } else if (res[1] == "tax") {
          let tax = res[0] as TaxModel
          this.purchaseDetails[res[2]].taxPercentage = tax.cess_perc + tax.cgst_perc + tax.sgst_perc
          this.purchaseDetails[res[2]].cgst_perc = tax.cgst_perc
          this.purchaseDetails[res[2]].sgst_perc = tax.sgst_perc
          this.purchaseDetails[res[2]].igst_perc = tax.igst_perc
          this.purchaseDetails[res[2]].cess_perc = tax.cess_perc
          this.purchaseDetailsCalculation(res[2])
        } else if (res[1] == "units") {
          let unit = res[0] as UnitModel
          this.purchaseDetails[res[2]].unit = unit.unit
          this.purchaseDetailsCalculation(res[2])
        }
      })
    this.router.queryParams.
      subscribe(params => {
        let id = params['purchaseId']
        if (id) {
          this.service.getHeaderDetails("purchaseHeader", id)
            .subscribe((res) => {
              this.global.loader = true
              let temHeader = res.data() as PurchaseHeaderModel
              this.masterService.getItem("suppliermaster", temHeader.supplierCode.toString())
                .subscribe((sup) => {
                  let supplier = sup.data() as CustomerModel
                  temHeader.supplierAddress = supplier.address
                  temHeader.supplierGSTNo = supplier.gstNo
                  temHeader.supplierAmt = supplier.amount
                  this.service.getTransactionDetails("purchaseDetail", id)
                    .then((res) => {
                      let index = 0
                      this.purchaseDetails = []
                      res.forEach(doc => {
                        this.purchaseDetails[index] = doc.data() as PurchaseDetailModel
                        index++;
                      })
                      temHeader.invoiceDate = new Date(temHeader.timestamp)
                      this.purchaseHeader = temHeader
                      this.global.loader = false
                      this.global.showToast("Purchase details for that row - [ READ ONLY MODE ]", "success", true)
                    }, error => {
                      this.global.showToast("Error occurred" + error, "error", true)
                    })
                }, error => {
                  this.global.showToast("Error occurred" + error, "error", true)
                })
            }, error => {
              this.global.showToast("Error occurred" + error, "error", true)
            })
        }
      });
  }

  showChq() {
    if (this.purchaseHeader.paymentType == 2) {
      this.openChqModal()
    }
  }

  ngOnInit() {
    this.resetSales()
  }

  resetSales() {
    this.purchaseHeader.supplierValid = false
    this.purchaseHeader = new PurchaseHeaderModel()
    var dateArray = this.global.toLocaleDateString(new Date()).split("/")
    this.purchaseHeader.invoiceDate = new Date(dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0] + " 00:00:00")
    this.purchaseHeader.timestamp = new Date().getTime()
    this.purchaseDetails = []
    this.addInitialItem();
  }

  private addInitialItem() {
    this.purchaseDetails.push(new PurchaseDetailModel());
    this.purchaseDetails = [...this.purchaseDetails];
  }

  addRow(event) {
    if (event.keyCode == 43) {
      this.addItem()
    }
  }

  showItemLovModal(event, collection, index) {
    if (event.keyCode == 13) {
      if (this.purchaseHeader.supplierValid) {
        if (this.purchaseHeader.invoiceDate != null) {
          if (this.purchaseHeader.invoiceNo != null && this.purchaseHeader.invoiceNo != "") {
            if (this.purchaseHeader.paymentType != null) {
              this.lovService.showLovModal(true, collection, "", index)
            } else {
              this.global.showToast("Kindly select the payment type", "warning", false)
            }
          } else {
            this.invoiceNoInput.nativeElement.focus();
            this.global.showToast("Kindly enter the invoice no", "warning", false)
          }
        } else {
          this.global.showToast("Kindly select the invoice date", "warning", false)
        }
      } else {
        this.custNameInput.nativeElement.focus();
        this.global.showToast("Kindly add the supplier details", "warning", false)
      }
    }
  }

  delete() {
    this.global.loader = true
    this.service.deletePurcahseHeader(this.purchaseHeader)
      .then(res => {
        this.service.deletePurchaseDetail(this.purchaseDetails, this.purchaseHeader.id.toString())
          .then(res => {
            let amount = this.removeCustomerAmt()
            this.service.updateCustomerAmount("suppliermaster", this.purchaseHeader.supplierCode.toString(), amount)
              .then(res => {
                this.global.loader = false
                this.resetSales()
                this.global.showToast("Purchase deleted successfully", "sucess", false)
                this.routerChange.navigate(['/'])
              }).catch(e => {
                this.global.showToast("Error occured" + e, "error", true)
              })
          }).catch(e => {
            this.global.showToast("Error occured" + e, "error", true)
          })
      }).catch(e => {
        this.global.showToast("Error occured" + e, "error", true)
      })
  }

  removeCustomerAmt(): number {
    if (this.purchaseHeader.paymentType == 0) {
      return this.purchaseHeader.supplierAmt + this.purchaseHeader.netAmt;
    } else if (this.purchaseHeader.paymentType == 1) {
      let amt = this.purchaseHeader.paidAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt - amt
    } else if (this.purchaseHeader.paymentType == 2) {
      let amt = this.purchaseHeader.chqAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt - amt
    }
  }

  showLovModal(event, collection, index) {
    if (event.keyCode == 13) {
      this.lovService.showLovModal(true, collection, "", index)
    }
  }

  removeTax(rowIndex) {
    this.purchaseDetails[rowIndex].taxPercentage = 0
    this.purchaseDetails[rowIndex].cgst_perc = 0
    this.purchaseDetails[rowIndex].sgst_perc = 0
    this.purchaseDetails[rowIndex].igst_perc = 0
    this.purchaseDetails[rowIndex].cess_perc = 0
    this.purchaseDetailsCalculation(rowIndex)
    this.lovService.showLovModal(true, "tax", "", rowIndex)
  }

  setElementFocus(inputs: QueryList<any>, rowIndex: number) {
    setTimeout(() => {
      let items = inputs.toArray();
      if (items[rowIndex]) {
        let element = items[rowIndex].nativeElement;
        element.focus();
        element.select();
      }
    }, 100);
  }

  addItem() {
    let index = this.purchaseDetails.length - 1
    if (this.purchaseDetails[index].itemName) {
      if (this.checkRowValid(index, this.purchaseDetails[index].quantity, "quantityInputs") && this.checkRowValid(index, this.purchaseDetails[index].sp, "spInputs") && this.checkRowValid(index, this.purchaseDetails[index].unit, "unitInputs")) {
        this.purchaseDetails.push(new PurchaseDetailModel())
        this.setElementFocus(this.itemCodeInputs, this.purchaseDetails.length - 1);
      }
    } else {
      this.setElementFocus(this.itemCodeInputs, this.purchaseDetails.length - 1);
      this.global.showToast("Kindly enter the item details", "warning", false)
    }
  }

  checkField(index: number, event, format: string, field: string) {
    if (this.global[format].test(event.target.value)) {
      if (event.target.value != '' && event.target.value != '.')
        this.purchaseDetails[index][field] = +(event.target.value)
      else
        this.purchaseDetails[index][field] = null
      this.purchaseDetailsCalculation(index)
    } else {
      event.target.value = this.purchaseDetails[index][field] ? this.purchaseDetails[index][field] : ''
    }
  }

  purchaseDetailsCalculation(index: number) {
    if (this.purchaseHeader.supplierValid) {
      if (this.purchaseDetails[index].quantity && this.purchaseDetails[index].sp) {
        this.purchaseDetails[index].totalUnit = this.purchaseDetails[index].quantity * this.purchaseDetails[index].unit
        let totalAmt = this.purchaseDetails[index].totalUnit * this.purchaseDetails[index].sp
        this.purchaseDetails[index].cessAmt = this.roundOff(totalAmt * ((this.purchaseDetails[index].cess_perc) / 100))
        if (this.purchaseHeader.supplierLocation == 0) {
          this.purchaseDetails[index].sgstAmt = this.roundOff(totalAmt * ((this.purchaseDetails[index].cgst_perc) / 100))
          this.purchaseDetails[index].cgstAmt = this.roundOff(totalAmt * ((this.purchaseDetails[index].sgst_perc) / 100))
          this.purchaseDetails[index].igstAmt = 0
          this.purchaseDetails[index].netAmt = this.roundOff(totalAmt + this.purchaseDetails[index].sgstAmt + this.purchaseDetails[index].cgstAmt + this.purchaseDetails[index].cessAmt)
        } else if (this.purchaseHeader.supplierLocation == 1) {
          this.purchaseDetails[index].igstAmt = this.roundOff(totalAmt * (this.purchaseDetails[index].taxPercentage / 100))
          this.purchaseDetails[index].cgstAmt = this.purchaseDetails[index].sgstAmt = 0
          this.purchaseDetails[index].netAmt = this.roundOff(totalAmt + this.purchaseDetails[index].igstAmt + this.purchaseDetails[index].cessAmt)
        }
        this.purchaseHeaderCalculation();
      }
    }
  }

  setInvoiceDate(event) {
    var dateArray = event.target.value.toString().split("/")
    this.purchaseHeader.invoiceDate = new Date(dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0] + " 00:00:00")
    this.purchaseHeader.timestamp = this.purchaseHeader.invoiceDate.getTime()
  }

  purchaseHeaderCalculation() {
    if (this.purchaseHeader.supplierLocation == 0) {
      let cgst = this.purchaseDetails.filter(item => item.cgstAmt != null).map(item => item.cgstAmt).reduce((a, b) => a + b, 0)
      let sgst = this.purchaseDetails.filter(item => item.sgstAmt != null).map(item => item.sgstAmt).reduce((a, b) => a + b, 0)
      let cess = this.purchaseDetails.filter(item => item.cessAmt != null).map(item => item.cessAmt).reduce((a, b) => a + b, 0)
      this.purchaseHeader.taxAmt = this.roundOff(cgst + sgst + cess)

    } else if (this.purchaseHeader.supplierLocation == 1) {
      let igst = this.purchaseDetails.filter(item => item.igstAmt != null).map(item => item.igstAmt).reduce((a, b) => a + b, 0)
      let cess = this.purchaseDetails.filter(item => item.cessAmt != null).map(item => item.cessAmt).reduce((a, b) => a + b, 0)
      this.purchaseHeader.taxAmt = this.roundOff(igst + cess)
    }
    this.purchaseHeader.netAmt = this.roundOff(this.purchaseDetails.filter(item => item.netAmt != null).map(item => item.netAmt).reduce((a, b) => a + b, 0))
  }

  roundOff(value): number {
    return Math.round(value * Math.pow(10, 2)) / (Math.pow(10, 2));
  }

  clearSupplierDetails() {
    this.purchaseHeader.supplierValid = false
    this.purchaseHeader.supplierAmt = null
    this.purchaseHeader.supplierAddress = null
    this.purchaseHeader.supplierGSTNo = null
    this.purchaseHeader.supplierName = null
    this.purchaseHeader.supplierLocation = null
  }

  setPaymentType(event) {
    this.purchaseHeader.paymentType = +(event.target.value)
    if (this.purchaseHeader.paymentType == 2) {
      this.openChqModal()
    } else {
      this.purchaseHeader.chqDate = null
      this.purchaseHeader.chqNo = 0
      this.purchaseHeader.chqAmt = null
      this.purchaseHeader.chqBank = null
      this.purchaseHeader.timestamp = null
      this.purchaseHeader.paidAmt = null
    }
    if (this.purchaseHeader.paymentType == 0) {
      this.purchaseHeader.paidAmt = 0
    } else if (this.purchaseHeader.paymentType == 1) {
      this.purchaseHeader.paidAmt = null
    }

  }

  openChqModal() {
    this.chqModalAction.emit({ action: "modal", params: ["open"] });
  }

  openSubmitModal() {
    this.confirmationModal.emit({ action: "modal", params: ["open"] });
  }

  closeChqModal() {
    this.chqModalAction.emit({ action: "modal", params: ["close"] });
  }


  getUnitList(event, rowIndex) {
    event.target.value = null;
    this.purchaseDetails[rowIndex].unit = 1;
    this.purchaseDetailsCalculation(rowIndex);
    this.lovService.showLovModal(true, "units", "", rowIndex)
  }



  checkNumberValue(event, fieldName) {
    if (this.tenNumberWithTwoDigitsFormatRegex.test(event.target.value)) {
      if (fieldName == 'otherCharges' && this.purchaseHeader.otherCharges) {
        this.purchaseHeader.netAmt = this.roundOff(this.purchaseHeader.netAmt - this.purchaseHeader.otherCharges)
      }
      if (event.target.value != '' && event.target.value != '.') {
        this.purchaseHeader[fieldName] = +(event.target.value)
        if (fieldName == 'otherCharges' && this.purchaseHeader.otherCharges) {
          this.purchaseHeader.netAmt = this.roundOff(this.purchaseHeader.netAmt + this.purchaseHeader.otherCharges)
        }
      } else {
        this.purchaseHeader[fieldName] = null
      }
    } else {
      event.target.value = this.purchaseHeader[fieldName] ? this.purchaseHeader[fieldName] : ''
    }
  }

  saveChqDetails() {
    if (this.purchaseHeader.chqDate != null && this.purchaseHeader.chqNo != null && this.purchaseHeader.chqAmt
      && (this.purchaseHeader.chqBank != null && this.purchaseHeader.chqBank != "")) {
      this.closeChqModal()
      this.global.showToast("Cheque details are saved successfully", "warning", false)
    } else {
      this.global.showToast("Kindly fill all the details", "warning", false)
    }
  }

  clearChqDetails() {
    this.paymentTypeShow = false
    setTimeout(() => {
      this.paymentTypeShow = true
    }, 100);
    this.purchaseHeader.paymentType = 0
    if (this.purchaseHeader.chqDate != null && this.purchaseHeader.chqNo != null && this.purchaseHeader.chqAmt
      && (this.purchaseHeader.chqBank != null && this.purchaseHeader.chqBank != "")) {
      this.purchaseHeader.chqDate = null
      this.purchaseHeader.chqNo = 0
      this.purchaseHeader.chqAmt = null
      this.purchaseHeader.chqBank = ""
      this.global.showToast("Cheque details are cleared successfully", "warning", false)
    }
  }

  checkInvoiceNo(event) {
    if (this.alphaNumericRegex.test(event.target.value)) {
      this.purchaseHeader.invoiceNo = event.target.value
    } else {
      event.target.value = this.purchaseHeader.invoiceNo
    }
  }

  endProcess() {
    if (this.purchaseHeader.id) {
      this.printBill(false)
    } else {
      this.submitProcess()
    }
  }

  clearAll() {
    if (this.purchaseHeader.id) {
      this.global.showToast("Cleared Successfully", "warning", false)
      this.routerChange.navigate(['/'])
    }
    this.global.loader = true
    this.resetSales()
    this.global.loader = false
    this.global.showToast("Cleared Successfully", "warning", false)
  }

  setBankName(event) {
    this.purchaseHeader.chqBank = event.target.value
  }

  clearProcess() {
    this.confimationModalHeader = "Clear all"
    this.openSubmitModal()
  }

  deleteModal() {
    this.confimationModalHeader = "Delete"
    this.openSubmitModal()
  }

  submitProcess() {
    if (this.purchaseHeader.supplierValid) {
      if (this.purchaseHeader.invoiceDate != null) {
        if (this.purchaseHeader.invoiceNo != null && this.purchaseHeader.invoiceNo != "") {
          if (this.purchaseHeader.paymentType != null) {
            if (this.purchaseHeader.otherCharges != null) {
              if (this.purchaseHeader.paidAmt != null) {
                if (this.purchaseDetails.length > 0 && this.purchaseDetails[0].itemName != null && this.purchaseDetails[0].itemName != '') {
                  if (this.purchaseDetails[this.purchaseDetails.length - 1].itemName == null) {
                    this.purchaseDetails.splice(this.purchaseDetails.length - 1, 1)
                  }
                  if (this.fullItemsValid()) {
                    this.purchaseHeader.timestamp = this.purchaseHeader.invoiceDate.getTime()
                    this.confimationModalHeader = "Submit"
                    this.openSubmitModal()
                  }
                } else {
                  this.setElementFocus(this.itemCodeInputs, 0);
                  this.global.showToast("Kindly enter the item details", "warning", false)
                }
              } else {
                this.paidAmtInput.nativeElement.focus();
                this.global.showToast("Kindly enter the paid amount", "warning", false)
              }
            } else {
              this.otherChargesInput.nativeElement.focus();
              this.global.showToast("Kindly enter the other charges", "warning", false)
            }
          } else {
            this.global.showToast("Kindly select the payment type", "warning", false)
          }
        } else {
          this.invoiceNoInput.nativeElement.focus();
          this.global.showToast("Kindly enter the invoice no", "warning", false)
        }
      } else {
        this.global.showToast("Kindly select the invoice date", "warning", false)
      }
    } else {
      this.custNameInput.nativeElement.focus();
      this.global.showToast("Kindly add the supplier details", "warning", false)
    }
  }

  yesButtonProcess() {
    if (this.confimationModalHeader == "Clear all") {
      this.clearAll()
    } else if (this.confimationModalHeader == "Submit") {
      this.submitToServer()
    } else if (this.confimationModalHeader == "Delete") {
      let pwd = this.purchaseHeader.id.toString() + this.purchaseHeader.netAmt.toString() + new Date().getDate().toString()
      if (this.deletePwd == pwd) {
        this.delete()
      } else {
        this.global.showToast("Invalid password", "warning", false)
      }
    }
  }


  submitToServer() {
    this.global.loader = true
    this.global.getLatestId("purchaseHeader", "id").then((res) => {
      let id = -1
      if (res.docs.length > 0) {
        res.forEach((doc) => {
          let p = doc.data() as PurchaseHeaderModel
          id = p.id + 1
        })
      } else if (res.docs && res.docs.length == 0) {
        id = 1
      }
      if (id > -1) {
        this.purchaseHeader.id = id
        this.service.addPurchaseHeader(this.purchaseHeader)
          .then(res => {
            this.service.addPurchaseDetail(this.purchaseDetails, this.purchaseHeader.id.toString())
              .then(res => {
                this.service.updateItemDetails(this.getItemArray(true))
                  .then(res => {
                    let amount = this.roundOff(this.getsupplierAmt())
                    this.service.updateCustomerAmount("suppliermaster", this.purchaseHeader.supplierCode.toString(), amount)
                      .then(res => {
                        this.printBill(true);
                      }).catch(e => {
                        this.global.showToast("Error occured" + e, "error", true)
                      })
                  }).catch(e => {
                    this.global.showToast("Error occured" + e, "error", true)
                  })
              }).catch(e => {
                this.global.showToast("Error occured" + e, "error", true)
              })
          }).catch(e => {
            this.global.showToast("Error occured" + e, "error", true)
          })
      } else {
        this.global.showToast("There is some connectivity issues, Retry", "error", true)
      }
    }).catch(e => {
      this.global.showToast("Error occured" + e, "error", true)
    })
  }

  deleteItem(rowIndex) {
    this.purchaseDetails.splice(rowIndex, 1)
    this.global.showToast("Deleted an item", "success", false)
    if (this.purchaseDetails.length == 0) {
      this.addInitialItem()
    }
    this.purchaseHeaderCalculation()
  }

  getsupplierAmt(): number {
    if (this.purchaseHeader.paymentType == 0) {
      return this.purchaseHeader.supplierAmt - this.purchaseHeader.netAmt;
    } else if (this.purchaseHeader.paymentType == 1) {
      let amt = this.purchaseHeader.paidAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt + amt
    } else if (this.purchaseHeader.paymentType == 2) {
      let amt = this.purchaseHeader.chqAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt + amt
    }
  }

  getItemArray(add: boolean): ItemModel[] {
    let items: ItemModel[] = []
    let index = 0
    this.purchaseDetails.forEach((element) => {
      items[index] = new ItemModel()
      items[index].code = this.purchaseDetails[index].itemCode
      items[index].unit = this.purchaseDetails[index].unit
      if (add) {
        items[index].stock = this.purchaseDetails[index].stockValue + (this.purchaseDetails[index].quantity * this.purchaseDetails[index].unit)
        items[index].purchase = this.purchaseDetails[index].purchase + (this.purchaseDetails[index].quantity * this.purchaseDetails[index].unit)
      } else {
        items[index].stock = this.purchaseDetails[index].stockValue - (this.purchaseDetails[index].quantity * this.purchaseDetails[index].unit)
        items[index].purchase = this.purchaseDetails[index].purchase - (this.purchaseDetails[index].quantity * this.purchaseDetails[index].unit)
      }
      items[index].cgst_perc = this.purchaseDetails[index].cgst_perc
      items[index].sgst_perc = this.purchaseDetails[index].sgst_perc
      items[index].igst_perc = this.purchaseDetails[index].igst_perc
      items[index].cess_perc = this.purchaseDetails[index].cess_perc
      items[index].hsncode = this.purchaseDetails[index].hsncode
      items[index].taxPercentage = this.purchaseDetails[index].taxPercentage
      items[index].sales = this.purchaseDetails[index].sales
      index++;
    })
    return items
  }

  checkRowValid(index, value, field): boolean {
    if (this.purchaseDetails[index].itemName) {
      if (value == '' || value == null || value == 0) {
        this.setElementFocus(this[field], index)
        this.global.showToast("Kindly enter the " + field.replace("Inputs", "") + " value", "warning", false)
        return false
      }
      return true
    } else {
      return false
    }
  }

  fullItemsValid(): boolean {
    for (let index = 0; index < this.purchaseDetails.length; index++) {
      if (!this.checkRowValid(index, this.purchaseDetails[index].quantity, "quantityInputs") || !this.checkRowValid(index, this.purchaseDetails[index].sp, "spInputs") || !this.checkRowValid(index, this.purchaseDetails[index].unit, "unitInputs")) {
        return false
      }
    }
    return true
  }

  setPaidAmt(event) {
    if (this.tenNumberWithTwoDigitsFormatRegex.test(event.target.value)) {
      if (event.target.value != '') {
        this.purchaseHeader.paidAmt = +(event.target.value)
      } else
        this.purchaseHeader.paidAmt = null
    } else {
      event.target.value = this.purchaseHeader.paidAmt ? this.purchaseHeader.paidAmt : ''
    }
  }

  checkValue(field: string, event, index) {
    if (this.purchaseDetails[index].itemName) {
      if (event.target.value == '' || event.target.value == null || event.target.value == 0) {
        this.setElementFocus(this[field], index)
        this.global.showToast("Kindly enter the " + field.replace("Inputs", "") + " value", "warning", false)
      }
    }
  }

  public printBill(update: boolean) {
    this.global.loader = true
    this.billShow = true
    setTimeout(() => {
      var data = document.getElementById('bill');
      html2canvas(data, { scale: 2 }).then(canvas => {
        // Few necessary setting options
        const contentDataURL = canvas.toDataURL('image/png')
        let pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
        pdf.addImage(contentDataURL, 'PNG', 0, 0, 210, canvas.height * 210 / canvas.width)
        let date = this.purchaseHeader.invoiceDate.getDate() + "/" + (this.purchaseHeader.invoiceDate.getMonth() + 1) + "/" + this.purchaseHeader.invoiceDate.getFullYear()
        pdf.save("PURCHASE - " + this.purchaseHeader.supplierName + "- Invoice_No_" + this.purchaseHeader.invoiceNo + " - [ " + date + " ]" + '.pdf', { returnPromise: true }).then(result => {
          this.billShow = false
          if (update) {
            this.resetSales()
            this.global.loader = false
            this.global.showToast("Saved successfully", "success", false)
          } else {
            this.resetSales()
            this.global.loader = false
            this.routerChange.navigate(['/'])
          }
        })
      });
    }, 100);
  }

  private getCgstAmt(): number {
    return this.roundOff(this.purchaseDetails.filter(d => d.itemName).map(d => d.cgstAmt).reduce((a, b) => a + b, 0))
  }


  private getSgstAmt(): number {
    return this.roundOff(this.purchaseDetails.filter(d => d.itemName).map(d => d.sgstAmt).reduce((a, b) => a + b, 0))
  }

  private getIgstAmt(): number {
    return this.roundOff(this.purchaseDetails.filter(d => d.itemName).map(d => d.igstAmt).reduce((a, b) => a + b, 0))
  }

  private getCessAmt(): number {
    return this.roundOff(this.purchaseDetails.filter(d => d.itemName).map(d => d.cessAmt).reduce((a, b) => a + b, 0))
  }
}


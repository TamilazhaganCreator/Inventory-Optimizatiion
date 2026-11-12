import { ColDef } from 'ag-grid-community';
import { ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CustomerModel } from './../../master/master.model';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { PurchaseTransactionReportModel } from './../../transaction/transaction.model';
import { GlobalService } from 'src/app/global.service';
import { Component, OnInit, EventEmitter } from '@angular/core';
import { ReportService } from '../report.service';
import { FilterModel } from '../report.model';
import { CollapsibleMaterializeAction } from 'src/app/global.model';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-purchasereport',
  templateUrl: './purchasereport.component.html',
  styleUrls: ['./purchasereport.component.css']
})
export class PurchaseReportComponent implements OnInit {

  filterCollapsible = new EventEmitter<string | CollapsibleMaterializeAction>();
  private subscriptionArray: Subscription[] = []
  purchaseHeader: PurchaseTransactionReportModel[] = []
  private backupPurchaseHeader: PurchaseTransactionReportModel[] = []
  filter = new FilterModel()
  paidAmt = 0
  netAmt = 0
  taxAmt = 0
  datePickerParams = [
    {
      format: "dd/mm/yyyy",
      close: "Ok",
      clear: "",
      min: this.filter.startDate
    }
  ];
  columns: ColDef[] = [
    {
        "field": "invoiceDateString",
        "headerName": "DATE",
        "filter": "agTextColumnFilter"
    },
    {
        "field": "invoiceNo",
        "headerName": "INVOICE NO",
        "filter": "agTextColumnFilter"
    },
    {
        "field": "supplierCode",
        "headerName": "SUPPLIER CODE",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "supplierName",
        "headerName": "SUPPLIER NAME",
        "filter": "agTextColumnFilter"
    },
    {
        "field": "paymentTypeString",
        "headerName": "PAYMENT TYPE",
        "filter": "agTextColumnFilter"
    },
    {
        "field": "paidAmt",
        "headerName": "PAID AMOUNT",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "netAmt",
        "headerName": "TOTAL AMOUNT",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "taxAmt",
        "headerName": "TAX AMOUNT",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    }
  ];

  constructor(private global: GlobalService, private service: ReportService, private lovService: GenericLovService,
    private router: Router) {
    this.subscriptionArray[0] = this.lovService.getLovItem()
      .subscribe((res) => {
        if (res[1] == "Supplier") {
          let cust = res[0] as CustomerModel;
          this.filter.customerName = cust.name
          this.filter.customerCode = cust.code
        }
      })
  }

  goToPurchasePage(row: PurchaseTransactionReportModel) {
    this.global.loader = true;
    this.router.navigate(['../transaction/purchase'], { queryParams: { purchaseId: row.id } });
  }

  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true;
      this.getPurchase()
    }, 100);
  }

  private getPurchase() {
    let index = 0
    this.purchaseHeader = []
    this.backupPurchaseHeader = []
    this.service.getFullData("purchaseHeader", "timestamp").then((res) => {
      res.forEach((doc) => {
        let element = doc.data() as PurchaseTransactionReportModel
        element.netAmt = this.roundOff(element.netAmt - element.taxAmt - element.otherCharges)
        this.purchaseHeader[index] = element
        index++;
      })
      this.purchaseHeader.forEach((element) => {
        let invoiceDate = new Date(element.timestamp)
        let month = (invoiceDate.getMonth() + 1) > 9 ? (invoiceDate.getMonth() + 1) : "0" + (invoiceDate.getMonth() + 1)
        let date = (invoiceDate.getDate()) > 9 ? (invoiceDate.getDate()) : "0" + (invoiceDate.getDate())
        element.invoiceDateString = date + "/" + month + "/" + invoiceDate.getFullYear()
        element.paymentTypeString = element.paymentType == 0 ? 'Credit' : element.paymentType == 1 ? "Cash" : "Cheque"
      })
      this.backupPurchaseHeader = this.purchaseHeader.map(d => Object.assign({}, d))

      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }

  setTotalAmt() {
    this.purchaseHeader = [...this.purchaseHeader];
    this.paidAmt = this.purchaseHeader.map(s => s.paidAmt).reduce((a, b) => a + b, 0)
    this.netAmt = this.roundOff(this.purchaseHeader.map(s => s.netAmt).reduce((a, b) => a + b, 0))
    this.taxAmt = this.roundOff(this.purchaseHeader.map(s => s.taxAmt).reduce((a, b) => a + b, 0))
  }

  removeValue(event) {
    event.target.value = null;
    this.filter.customerCode = null
    this.filter.customerName = null;
    this.global.showToast("Kindly select the Supplier", "warning", false)
  }

  setDate(event, field) {
    this.filter[field] = event.target.value.toString()
  }

  getCustomers() {
    this.lovService.showLovModal(true, "Supplier", "", null)
  }

  applyFilter() {
    let filtered = false
    if (this.purchaseHeader.length != this.backupPurchaseHeader.length) {
      this.purchaseHeader = this.backupPurchaseHeader.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.startDate || this.filter.endDate) {
      if (this.filter.startDate && this.filter.endDate) {
        let startRangeArray = this.filter.startDate.split("/")
        let tempStart = new Date(startRangeArray[2] + "-" + startRangeArray[1] + "-" + startRangeArray[0] + " 00:00:00")
        let endRangeArray = this.filter.endDate.split("/")
        let tempEnd = new Date(endRangeArray[2] + "-" + endRangeArray[1] + "-" + endRangeArray[0] + " 00:00:00")
        this.purchaseHeader = this.backupPurchaseHeader.filter(s => s.timestamp >= tempStart.getTime() && s.timestamp <= tempEnd.getTime())
        filtered = true
      } else {
        this.global.showToast("Kindly choose the proper start and end date", "warning", false)
      }
    }
    if (this.filter.customerCode) {
      filtered = true
      this.purchaseHeader = this.purchaseHeader.filter(s => s.supplierCode == this.filter.customerCode)
    }
    if (this.filter.paymentType) {
      filtered = true
      this.purchaseHeader = this.purchaseHeader.filter(s => s.paymentTypeString == this.filter.paymentType)
    }
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    if (filtered) {

      this.setTotalAmt()
      this.global.showToast("Filters applied", "success", false)
    }
  }

  clearFilter() {
    this.filter = new FilterModel()
    this.purchaseHeader = this.backupPurchaseHeader

    this.setTotalAmt()
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    this.global.showToast("Filters cleared", "success", false)
  }

  ngOnDestroy(): void {
    this.subscriptionArray.forEach(s => {
      if (s != null)
        s.unsubscribe()
    })
  }

  roundOff(value): number {
    return Math.round(value * Math.pow(10, 2)) / (Math.pow(10, 2));
  }

}

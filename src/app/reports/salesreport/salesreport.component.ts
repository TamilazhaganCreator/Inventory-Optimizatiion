import { ColDef } from 'ag-grid-community';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { CollapsibleMaterializeAction } from 'src/app/global.model';
import { GlobalService } from 'src/app/global.service';
import { FilterModel } from '../report.model';
import { ReportService } from '../report.service';
import { CustomerModel } from './../../master/master.model';
import { TransactionReportModel } from './../../transaction/transaction.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-salesreport',
  templateUrl: './salesreport.component.html',
  styleUrls: ['./salesreport.component.css']
})
export class SalesReportComponent implements OnInit {

  filterCollapsible = new EventEmitter<string | CollapsibleMaterializeAction>();
  private subscriptionArray: Subscription[] = []
  salesHeader: TransactionReportModel[] = []
  private backupSalesHeader: TransactionReportModel[] = []
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
        "field": "customerCode",
        "headerName": "CUSTOMER CODE",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "customerName",
        "headerName": "CUSTOMER NAME",
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
        if (res[1] == "Customer") {
          let cust = res[0] as CustomerModel;
          this.filter.customerName = cust.name
          this.filter.customerCode = cust.code
        }
      })
  }

  goToSalesPage(row: TransactionReportModel) {
    this.global.loader = true;
    this.router.navigate(['../transaction/sales'], { queryParams: { salesId: row.id } });
  }

  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true;
      this.getSales()
    }, 100);
  }

  private getSales() {
    let index = 0
    this.salesHeader = []
    this.backupSalesHeader = []
    this.service.getFullData("salesheader", "timestamp").then((res) => {
      res.forEach((doc) => {
        let element = doc.data() as TransactionReportModel
        element.netAmt = this.roundOff(element.netAmt - element.taxAmt - element.otherCharges)
        this.salesHeader[index] = element
        index++;
      })
      this.salesHeader.forEach((element) => {
        let invoiceDate = new Date(element.timestamp)
        let month = (invoiceDate.getMonth() + 1) > 9 ? (invoiceDate.getMonth() + 1) : "0" + (invoiceDate.getMonth() + 1)
        let date = (invoiceDate.getDate()) > 9 ? (invoiceDate.getDate()) : "0" + (invoiceDate.getDate())
        element.invoiceDateString = date + "/" + month + "/" + invoiceDate.getFullYear()
        element.paymentTypeString = element.paymentType == 0 ? 'Credit' : element.paymentType == 1 ? "Cash" : "Cheque"
      })
      this.backupSalesHeader = this.salesHeader.map(d => Object.assign({}, d))

      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }

  removeValue(event) {
    event.target.value = null;
    this.filter.customerCode = null
    this.filter.customerName = null;
    this.global.showToast("Kindly select the customer", "warning", false)
  }

  setDate(event, field) {
    this.filter[field] = event.target.value.toString()
  }

  getCustomers() {
    this.lovService.showLovModal(true, "Customer", "", null)
  }

  applyFilter() {
    let filtered = false
    if (this.salesHeader.length != this.backupSalesHeader.length) {
      this.salesHeader = this.backupSalesHeader.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.startDate || this.filter.endDate) {
      if (this.filter.startDate && this.filter.endDate) {
        let startRangeArray = this.filter.startDate.split("/")
        let tempStart = new Date(startRangeArray[2] + "-" + startRangeArray[1] + "-" + startRangeArray[0] + " 00:00:00")
        let endRangeArray = this.filter.endDate.split("/")
        let tempEnd = new Date(endRangeArray[2] + "-" + endRangeArray[1] + "-" + endRangeArray[0] + " 00:00:00")
        this.salesHeader = this.backupSalesHeader.filter(s => s.timestamp >= tempStart.getTime() && s.timestamp <= tempEnd.getTime())
        filtered = true
      } else {
        this.global.showToast("Kindly choose the proper start and end date", "warning", false)
      }
    }
    if (this.filter.customerCode) {
      filtered = true
      this.salesHeader = this.salesHeader.filter(s => s.customerCode == this.filter.customerCode)
    }
    if (this.filter.paymentType) {
      filtered = true
      this.salesHeader = this.salesHeader.filter(s => s.paymentTypeString == this.filter.paymentType)
    }
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    if (filtered) {

      this.setTotalAmt()
      this.global.showToast("Filters applied", "success", false)
    }
  }

  clearFilter() {
    this.filter = new FilterModel()
    this.salesHeader = this.backupSalesHeader

    this.setTotalAmt()
    this.filterCollapsible.emit({ action: 'collapsible', params: ['close', 0] });
    this.global.showToast("Filters cleared", "success", false)
  }

  setTotalAmt() {
    this.salesHeader = [...this.salesHeader];
    this.paidAmt = this.salesHeader.map(s => s.paidAmt).reduce((a, b) => a + b, 0)
    this.netAmt = this.roundOff(this.salesHeader.map(s => s.netAmt).reduce((a, b) => a + b, 0))
    this.taxAmt = this.roundOff(this.salesHeader.map(s => s.taxAmt).reduce((a, b) => a + b, 0))
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

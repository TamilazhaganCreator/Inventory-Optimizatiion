import { ColDef } from 'ag-grid-community';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { GlobalService } from 'src/app/global.service';
import { CustomerModel } from 'src/app/master/master.model';
import { ArrayAscSortPipe } from './../../utils/sortasc.pipe';
import { ArrayDescSortPipe } from './../../utils/sortdesc.pipe';
import { ReportService } from './../report.service';
import { PersonFilterModel } from '../report.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-customerreport',
  templateUrl: './customerreport.component.html',
  styleUrls: ['./customerreport.component.css']
})
export class CustomerreportComponent implements OnInit {

  customerDetails: CustomerModel[] = []
  private backupCustomerDetails: CustomerModel[] = []
  filter: PersonFilterModel = new PersonFilterModel()
  totalAmt = 0

  constructor(private global: GlobalService, private service: ReportService) { }

  columns: ColDef[] = [
    {
        "field": "code",
        "headerName": "CUSTOMER CODE",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "name",
        "headerName": "CUSTOMER NAME",
        "filter": "agTextColumnFilter"
    },
    {
        "field": "amount",
        "headerName": "AMOUNT",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter",
        "cellClassRules": {
            "negative-balance": (params) => Number(params.value) < 0
        }
    }
];

  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true;
      this.getCustomers()
    }, 100);
  }

  getCustomers() {
    let index = 0
    this.customerDetails = []
    this.backupCustomerDetails = []
    this.service.getFullData("customermaster", "name").then((res) => {
      res.forEach((doc) => {
        this.customerDetails[index] = doc.data() as CustomerModel
        index++;
      })
      this.backupCustomerDetails = this.customerDetails.map(d => Object.assign({}, d))

      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }


  filterCustomers() {
    let filtered = false
    if (this.customerDetails.length != this.backupCustomerDetails.length) {
      this.customerDetails = this.backupCustomerDetails.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.amountType) {
      if (this.filter.amountType == "credit") {
        this.customerDetails = this.backupCustomerDetails.filter(c => c.amount < 0)
      } else {
        this.customerDetails = this.backupCustomerDetails.filter(c => c.amount > 0)
      }
      filtered = true
    }
    if (this.filter.name) {
      this.customerDetails = this.backupCustomerDetails.filter(i => i.name.toLowerCase().includes(this.filter.name))
      filtered = true
    }
    if (this.filter.sortType) {
      let typeSplits = this.filter.sortType.split("_")
      if (typeSplits[1] == "asc")
        this.customerDetails = [...new ArrayAscSortPipe().transform(this.customerDetails, typeSplits[0])]
      else
        this.customerDetails = [...new ArrayDescSortPipe().transform(this.customerDetails, typeSplits[0])]
      filtered = true
    }
    if (filtered) {

      this.setTotalAmt()
      this.global.showToast("Customers filtered", "success", false)
    }
  }

  setTotalAmt() {
    this.customerDetails = [...this.customerDetails];
    this.totalAmt = this.customerDetails.map(i => i.amount).reduce((a, b) => a + b, 0)
  }

  clearFilter() {
    this.filter = new PersonFilterModel()
    this.customerDetails = this.backupCustomerDetails.map(d => Object.assign({}, d))

    this.setTotalAmt()
    this.global.showToast("Filter cleared", "success", false)
  }
}

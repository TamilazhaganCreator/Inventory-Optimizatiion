import { ColDef } from 'ag-grid-community';
import { ChangeDetectionStrategy } from '@angular/core';
import { CustomerModel } from 'src/app/master/master.model';
import { Component, OnInit } from '@angular/core';
import { GlobalService } from 'src/app/global.service';
import { ArrayAscSortPipe } from '../../utils/sortasc.pipe';
import { ArrayDescSortPipe } from '../../utils/sortdesc.pipe';
import { ReportService } from '../report.service';
import { PersonFilterModel } from '../report.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-supplierreport',
  templateUrl: './supplierreport.component.html',
  styleUrls: ['./supplierreport.component.css']
})
export class SupplierreportComponent implements OnInit {

  supplierDetails: CustomerModel[] = []
  private backupSupplierDetails: CustomerModel[] = []
  filter: PersonFilterModel = new PersonFilterModel()
  totalAmt = 0

  constructor(private global: GlobalService, private service: ReportService) { }

  columns: ColDef[] = [
    {
        "field": "code",
        "headerName": "SUPPLIER CODE",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "name",
        "headerName": "SUPPLIER NAME",
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
    this.getSuppliers()
    },100);
  }

  getSuppliers() {
    let index = 0
    this.supplierDetails = []
    this.backupSupplierDetails = []
    this.service.getFullData("suppliermaster", "name").then((res) => {
      res.forEach((doc) => {
        this.supplierDetails[index] = doc.data() as CustomerModel
        index++;
      })
      this.backupSupplierDetails = this.supplierDetails.map(d => Object.assign({}, d))

      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }


  filterSuppliers() {
    let filtered = false
    if (this.supplierDetails.length != this.backupSupplierDetails.length) {
      this.supplierDetails = this.backupSupplierDetails.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.amountType) {
      if (this.filter.amountType == "credit") {
        this.supplierDetails = this.backupSupplierDetails.filter(c => c.amount < 0)
      } else {
        this.supplierDetails = this.backupSupplierDetails.filter(c => c.amount > 0)
      }
      filtered = true
    }
    if (this.filter.name) {
      this.supplierDetails = this.backupSupplierDetails.filter(i => i.name.toLowerCase().includes(this.filter.name))
      filtered = true
    }
    if (this.filter.sortType) {
      let typeSplits = this.filter.sortType.split("_")
      if (typeSplits[1] == "asc")
        this.supplierDetails = [...new ArrayAscSortPipe().transform(this.supplierDetails, typeSplits[0])]
      else
        this.supplierDetails = [...new ArrayDescSortPipe().transform(this.supplierDetails, typeSplits[0])]
      filtered = true
    }
    if (filtered) {

      this.setTotalAmt()
      this.global.showToast("Suppliers filtered", "success", false)
    }
  }

  setTotalAmt() {
    this.supplierDetails = [...this.supplierDetails];
    this.totalAmt = this.supplierDetails.map(i => i.amount).reduce((a, b) => a + b, 0)
  }

  clearFilter() {
    this.filter = new PersonFilterModel()
    this.supplierDetails = this.backupSupplierDetails.map(d => Object.assign({}, d))

    this.setTotalAmt()
    this.global.showToast("Filter cleared", "success", false)
  }
}

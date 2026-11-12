import { ColDef } from 'ag-grid-community';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { GlobalService } from 'src/app/global.service';
import { ItemModel } from 'src/app/master/master.model';
import { ItemFilterModel } from '../report.model';
import { ArrayAscSortPipe } from './../../utils/sortasc.pipe';
import { ArrayDescSortPipe } from './../../utils/sortdesc.pipe';
import { ReportService } from './../report.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-itemreport',
  templateUrl: './itemreport.component.html',
  styleUrls: ['./itemreport.component.css']
})
export class ItemreportComponent implements OnInit {

  itemDetails: ItemModel[] = []
  private backupItemDetails: ItemModel[] = []
  filter: ItemFilterModel = new ItemFilterModel()
  totalStock = 0
  totalPurchase = 0
  totalSales = 0

  constructor(private global: GlobalService, private service: ReportService) { }

  columns: ColDef[] = [
    {
        "field": "code",
        "headerName": "ITEM CODE",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "name",
        "headerName": "ITEM NAME",
        "filter": "agTextColumnFilter"
    },
    {
        "field": "stock",
        "headerName": "STOCK",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "sales",
        "headerName": "SALES",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    },
    {
        "field": "purchase",
        "headerName": "PURCHASE",
        "type": "numericColumn",
        "filter": "agNumberColumnFilter"
    }
];

  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true;
    this.getItems()
    },100);
  }

  getItems() {
    let index = 0
    this.itemDetails = []
    this.backupItemDetails = []
    this.service.getFullData("itemmaster", "name").then((res) => {
      res.forEach((doc) => {
        this.itemDetails[index] = doc.data() as ItemModel
        index++;
      })
      this.backupItemDetails = this.itemDetails.map(d => Object.assign({}, d))

      this.setTotalAmt()
      setTimeout(() => {
        this.global.loader = false
      }, 100);
    })
  }

  filterItems() {
    let filtered = false
    if (this.itemDetails.length != this.backupItemDetails.length) {
      this.itemDetails = this.backupItemDetails.map(d => Object.assign({}, d))
      filtered = true
    }
    if (this.filter.name) {
      this.itemDetails = this.backupItemDetails.filter(i => i.name.toLowerCase().includes(this.filter.name))
      filtered = true
    }
    if (this.filter.sortType) {
      let typeSplits = this.filter.sortType.split("_")
      if (typeSplits[1] == "asc")
        this.itemDetails = [...new ArrayAscSortPipe().transform(this.itemDetails, typeSplits[0])]
      else
        this.itemDetails = [...new ArrayDescSortPipe().transform(this.itemDetails, typeSplits[0])]
      filtered = true
    }
    if (filtered) {

      this.setTotalAmt()
      this.global.showToast("Items filtered", "success", false)
    }
  }

  setTotalAmt() {
    this.itemDetails = [...this.itemDetails];
    this.totalPurchase = this.itemDetails.map(i => i.purchase).reduce((a, b) => a + b, 0)
    this.totalSales = this.itemDetails.map(i => i.sales).reduce((a, b) => a + b, 0)
    this.totalStock = this.itemDetails.map(i => i.stock).reduce((a, b) => a + b, 0)
  }

  clearFilter() {
    this.filter = new ItemFilterModel()
    this.itemDetails = this.backupItemDetails.map(d => Object.assign({}, d))

    this.setTotalAmt()
    this.global.showToast("Filter cleared", "success", false)
  }
}

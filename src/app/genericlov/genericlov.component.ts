import { ChangeDetectionStrategy } from '@angular/core';
import { UnitModel } from './../master/master.model';
import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Subscription } from 'rxjs';
import { ItemModel, CustomerModel, TaxModel } from '../master/master.model';
import { SearchPipe } from '../utils/search.pipe';
import { ManualAuditLovModel } from './genericlov.model';
import { GenericLovService } from './genericlov.service';
import { GlobalService } from '../global.service';


@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
    selector: 'generic-lov',
    templateUrl: 'genericlov.component.html',
    styleUrls: ['genericlov.component.css']
})
export class GenericLovComponent {
    lovModalOpen: boolean = false
    lovDetailsObject: ManualAuditLovModel = new ManualAuditLovModel()
    private tempLovDetails: any[]
    searchWord: string = ""
    private lovType: string = ""
    loaderShow: boolean = false
    tableRowSelectedIndex: number = 0
    tableRowSelected: boolean[] = []
    @ViewChild("lovSearchTag", { static: false }) private LovSearchInput: ElementRef;
    @ViewChild("itemsModal", { static: false }) private itemsModal;
    @ViewChildren("lovTableRow") private itemsTableRow;
    private subscription: Subscription[] = []
    allItems: any[] = []
    private focusIndex = -1;

    constructor(private service: GenericLovService, private global: GlobalService) {
        this.subscription[0] = this.service.getLovModalStatus()
            .subscribe(res => {
                if (res[0]) {
                    this.lovType = res[1]
                    this.focusIndex = res[3]
                    this.chooseLov()
                } else {
                    this.lovModalOpen = false
                }
            })
    }

    chooseLov() {
        if (this.lovType.includes("items")) {
            this.lovDetailsObject.header = "Items"
            this.lovDetailsObject.lov_header = ["Code", "Name", "Stock"]
            this.lovDetailsObject.table_content_width = this.lovDetailsObject.header_width = [25, 50, 25]
            this.lovDetailsObject.table_content = ["code", "name", "stock"]
            this.getItem("itemmaster", "name")
        } else if (this.lovType == "tax") {
            this.lovDetailsObject.header = "Tax"
            this.lovDetailsObject.lov_header = ["CGST", "SGST", "IGST", "CESS"]
            this.lovDetailsObject.table_content_width = this.lovDetailsObject.header_width = [25, 25, 25, 25]
            this.lovDetailsObject.table_content = ["cgst_perc", "sgst_perc", "igst_perc", "cess_perc"]
            this.getItem("taxmaster", "igst_perc")
        } else if (this.lovType == "units") {
            this.lovDetailsObject.header = "Units"
            this.lovDetailsObject.lov_header = ["Name", "Type", "Unit"]
            this.lovDetailsObject.table_content_width = this.lovDetailsObject.header_width = [40, 30, 30]
            this.lovDetailsObject.table_content = ["name", "type", "unit"]
            this.getItem("unitmaster", "name")
        } else {
            this.lovDetailsObject.header = this.lovType + "s"
            this.lovDetailsObject.lov_header = ["Code", "Name"]
            this.lovDetailsObject.table_content = ["code", "name"]
            this.lovDetailsObject.header_width = [20, 80]
            this.lovDetailsObject.table_content_width = [20, 80]
            let collection = this.lovType.toLowerCase() + "master"
            this.getItem(collection, "name")
        }
        this.lovModalOpen = true
        this.loaderShow = true
        this.searchWord = ""
    }

    private resetTableRowSelection() {
        this.tableRowSelected = [];
        this.tableRowSelectedIndex = 0;
        this.tableRowSelected[this.tableRowSelectedIndex] = true;
    }

    itemModalKeyActions(event) {
        let length = this.allItems.length
        if (event.keyCode === 27) {
            this.closeLovModal()
        }
        else if (this.allItems.length > 0) {
            if (event.keyCode === 38) {
                this.moveUp(event, length)
            } else if (event.keyCode === 40) {
                this.moveDown(event, length)
            } else if (event.keyCode === 13) {
                this.setSelectedData(this.allItems[this.tableRowSelectedIndex])
            }
        }
    }

    setSelectedData(element: any) {
        if (this.lovType == "itemsSales") {
            if (element.stock == 0) {
                this.global.showToast("Zero stock item can't load", "warning", false)
                return;
            }
        }
        this.service.setLovItem(element, this.lovType, this.focusIndex)
        this.lovModalOpen = false
    }

    getItem(collection, field) {
        this.service.getAllItems(collection, field)
            .then(res => {
                let index = 0;
                this.allItems = []
                res.forEach((doc) => {
                    if (this.lovType.includes("items")) {
                        this.allItems[index] = new ItemModel()
                        this.allItems[index] = doc.data() as ItemModel
                    } else if (this.lovType == "tax") {
                        this.allItems[index] = new TaxModel()
                        this.allItems[index] = doc.data() as TaxModel
                    } else if (this.lovType == "units") {
                        this.allItems[index] = new UnitModel()
                        this.allItems[index] = doc.data() as UnitModel
                    } else {
                        this.allItems[index] = new CustomerModel()
                        this.allItems[index] = doc.data() as CustomerModel
                    }
                    index++;
                })
                this.tempLovDetails = this.allItems
                this.resetTableRowSelection()
                this.loaderShow = false
                this.setLovSearchFocus();
            }).catch(e => {
                this.global.showToast("Error occured" + e, "error", true)
            })
    }

    private moveDown(event: any, length: number) {
        event.preventDefault();
        if (this.lovModalOpen === true && length > 0) {
            if (this.tableRowSelectedIndex < length - 1) {
                this.focusMoveDown(this.itemsTableRow, 'itemsModal');
            }
        }
    }

    private focusMoveDown(tableRow: QueryList<any>, element: string) {
        this.tableRowSelected = [];
        this.tableRowSelected[++this.tableRowSelectedIndex] = true;
        try {
            let tableItems = tableRow.toArray();
            let height = 0;
            for (let index = 0; index < this.tableRowSelectedIndex; index++) {
                height += tableItems[index].nativeElement.offsetHeight;
            }
            if (height + 108 > this[element].nativeElement.offsetHeight) {
                this[element].nativeElement.scrollTop +=
                    tableItems[this.tableRowSelectedIndex].nativeElement.offsetHeight;
            }
        }
        catch (err) {
            console.log(err, "errror");
        }
    }

    private moveUp(event: any, length: number) {
        event.preventDefault();
        if (this.lovModalOpen === true && length > 0 &&
            this.tableRowSelectedIndex > 0) {
            this.focusMoveUp(this.itemsTableRow, 'itemsModal');
        }
    }

    private focusMoveUp(tableRow: QueryList<any>, element: string) {
        this.tableRowSelected = [];
        this.tableRowSelected[--this.tableRowSelectedIndex] = true;
        try {
            let supplierItems = tableRow.toArray();
            this[element].nativeElement.scrollTop -= supplierItems[this.tableRowSelectedIndex + 1].nativeElement.offsetHeight;
        }
        catch (err) {
        }
    }

    filterLovDatas() {
        this.allItems = this.tempLovDetails
        this.resetTableRowSelection()
        if (this.lovDetailsObject.table_content.includes("code")) {
            this.allItems = new SearchPipe().transform(this.allItems, "name", "code", this.searchWord)
        } else if (this.lovDetailsObject.table_content.includes("cgst_perc")) {
            this.allItems = new SearchPipe().transform(this.allItems, "cgst_perc", "igst_perc", this.searchWord)
        } else if (this.lovDetailsObject.table_content.includes("unit")) {
            this.allItems = new SearchPipe().transform(this.allItems, "name", "unit", this.searchWord)
        }
    }

    setLovSearchFocus() {
        setTimeout(() => {
            if (this.LovSearchInput && this.LovSearchInput.nativeElement) {
                this.LovSearchInput.nativeElement.focus()
            }
        });
    }


    closeLovModal() {
        this.lovModalOpen = false
        this.service.setElementFocus(this.focusIndex)
        this.focusIndex = -1
    }
    ngOnDestroy() {
        this.lovModalOpen = false
        this.subscription.forEach((element) => {
            element.unsubscribe();
        })
    }
}

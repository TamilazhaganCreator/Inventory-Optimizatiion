import { ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { GlobalService } from 'src/app/global.service';
import { UnitModel } from '../master.model';
import { MasterService } from '../master.service';
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  selector: 'app-unitmaster',
  templateUrl: './unitmaster.component.html',
  styleUrls: ['./unitmaster.component.css']
})
export class UnitmasterComponent implements OnInit {
  allUnits: UnitModel[] = []
  numberOnlyFormatRegex: RegExp = /^[0-9]*$/;
  @ViewChildren("unitNameInputs") private unitNameInputs: QueryList<any>;

  constructor(private service: MasterService, private global: GlobalService) { }
  ngOnInit() {
    setTimeout(() => {
      this.global.loader = true
      this.getAllItems()
    }, 100);
  }

  private getAllItems() {
    this.service.getAllItems('unitmaster', "name").then(units => {
      this.allUnits = []
      let index = 0
      units.forEach((doc) => {
        this.allUnits[index] = new UnitModel()
        this.allUnits[index].name = doc.data().name
        this.allUnits[index].type = doc.data().type
        this.allUnits[index].unit = doc.data().unit
        this.allUnits[index].code = doc.data().code
        index++;
      });
      this.global.loader = false
    }, error => {
      this.global.loader = false
      this.global.showToast("Error occured" + error, "error", true)
    })
  }

  addUnit(unitObject: UnitModel) {
    if (unitObject.name != null && unitObject.name != "" && unitObject.type != null && unitObject.type != "" && unitObject.unit != null) {
      if (unitObject.code == null) {
        this.global.loader = true
        unitObject.code = 1 //UNIT CODE SET ///
        this.service.addUnit(unitObject)
          .then(
            res => {
              this.global.loader = false
              this.global.showToast("Saved successfully", "success", false)
            }
          ).catch((error) => {
            this.global.loader = false
            this.global.showToast("Error occured" + error, "error", true)
            console.log("Error getting cached document:" + error, "error", true);
          });
      } else {
        this.updateUnit(unitObject)
      }
    } else {
      this.global.showToast("Kindly fill the all details", "warning", false)
    }
  }

  updateUnit(unitObject: UnitModel) {
    this.global.loader = true
    this.service.updateUnit(unitObject)
      .then(
        res => {
          this.global.loader = false
          this.global.showToast("Updated successfully", "success", false)
        }
      ).catch((error) => {
        this.global.loader = false
        this.global.showToast("Error occured" + error, "error", true)
        console.log("Error getting cached document:" + error, "error", true);
      });
  }

  updateUnitValue(event, index) {
    if (this.numberOnlyFormatRegex.test(event.target.value)) {
      if (event.target.value != '')
        this.allUnits[index].unit = +(event.target.value)
      else
        this.allUnits[index].unit = null
    } else {
      event.target.value = this.allUnits[index].unit ? this.allUnits[index].unit : ''
    }
  }

  deleteUnit(index) {
    this.global.loader = true
    if (this.allUnits[index].code != null) {
      this.service.deleteItem('unitmaster', this.allUnits[index].code.toString())
        .then(
          res => {
            this.global.loader = false
            this.allUnits.splice(index, 1)
            this.global.showToast("Deleted successfully", "success", false)
          }
        ).catch((error) => {
          this.global.loader = false
          this.global.showToast("Error occured" + error, "error", true)
          console.log("Error getting cached document:" + error, "error", true);
        });
    } else {
      this.allUnits.splice(index, 1)
      this.global.loader = false
      this.global.showToast("deleted successfully", "success", false)
    }
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

  addEmptyUnit() {
    if (this.allUnits.length == 0 || this.allUnits[this.allUnits.length - 1].code != null) {
      this.allUnits.push(new UnitModel())
      this.setElementFocus(this.unitNameInputs, this.allUnits.length - 1)
      this.global.showToast('New row added', "success", false)
    } else {
      this.global.showToast('Kindly save the last one', "warning", false)
    }
  }

}

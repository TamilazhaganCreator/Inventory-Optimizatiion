import { from } from 'rxjs';
import { Injectable } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { HsnModel, ItemModel, UnitModel, CustomerModel, TaxModel } from './master.model';

@Injectable()
export class MasterService {

  constructor(public db: FirebaseService) { }

  updateTax(value: TaxModel) {
    return this.db.firestore.collection('taxmaster').doc(value.code.toString()).update({
      cgst_perc: value.cgst_perc,
      sgst_perc: value.sgst_perc,
      igst_perc: value.igst_perc,
      cess_perc: value.cess_perc
    });
  }


  addTax(value: TaxModel) {
    return this.db.firestore.collection('taxmaster').doc(value.code.toString()).set({
      code: value.code,
      cgst_perc: value.cgst_perc,
      sgst_perc: value.sgst_perc,
      igst_perc: value.igst_perc,
      cess_perc: value.cess_perc
    });
  }

  addUnit(value: UnitModel) {
    return this.db.firestore.collection('unitmaster').doc(value.code.toString()).set({
      name: value.name,
      type: value.type,
      unit: value.unit,
      code: value.code
    });
  }

  addItem(value: ItemModel) {
    return this.db.firestore.collection('itemmaster').doc(value.code.toString()).set({
      name: value.name,
      code: value.code,
      sp: value.sp,
      cost: value.cost,
      unit: value.unit,
      hsncode: value.hsncode,
      cgst_perc: value.cgst_perc,
      sgst_perc: value.sgst_perc,
      igst_perc: value.igst_perc,
      cess_perc: value.cess_perc,
      taxPercentage: value.taxPercentage,
      stock: value.stock,
      purchase: 0,
      sales: 0
    });
  }

  updateItem(value: ItemModel) {
    return this.db.firestore.collection('itemmaster').doc(value.code.toString()).update({
      name: value.name,
      code: value.code,
      sp: value.sp,
      cost: value.cost,
      unit: value.unit,
      hsncode: value.hsncode,
      taxPercentage: value.taxPercentage,
      stock: value.stock,
      cgst_perc: value.cgst_perc,
      sgst_perc: value.sgst_perc,
      igst_perc: value.igst_perc,
      cess_perc: value.cess_perc,
      purchase: value.purchase,
      sales: value.sales
    });
  }

  addCustomer(collection: string, value: CustomerModel) {
    return this.db.firestore.collection(collection).doc(value.code.toString()).set({
      name: value.name,
      code: value.code,
      address: value.address,
      mobileNo: value.mobileNo,
      email: value.email,
      landline: value.landline ? value.landline : 0,
      gstNo: value.gstNo,
      amount: value.amount,
      location: value.location
    });
  }

  updateCustomer(collection: string, value: CustomerModel) {
    return this.db.firestore.collection(collection).doc(value.code.toString()).set({
      name: value.name,
      code: value.code,
      address: value.address,
      mobileNo: value.mobileNo,
      email: value.email,
      landline: value.landline ? value.landline : 0,
      gstNo: value.gstNo,
      amount: value.amount, 
      location: value.location
    });
  }


  addHsn(value: HsnModel) {
    return this.db.firestore.collection('hsnmaster').doc(value.id.toString()).set({
      code: value.code,
      taxPercentage: value.taxPercentage,
      id: value.id
    });
  }

  getAllItems(collection,field) {
    return this.db.firestore.collection(collection).orderBy(field).get()
  }

  updateUnit(value: UnitModel) {
    return this.db.firestore.collection('unitmaster').doc(value.code.toString()).update({
      name: value.name,
      type: value.type,
      unit: value.unit,
      code: value.code
    });
  }

  updateHsn(value: HsnModel) {
    return this.db.firestore.collection('hsnmaster').doc(value.id.toString()).update({
      code: value.code,
      taxPercentage: value.taxPercentage,
      id: value.id
    });
  }

  deleteItem(collection, id: string) {
    return this.db.firestore.collection(collection).doc(id).delete()
  }

  getItem(collection, id: string) {
    return from(this.db.firestore.collection(collection).doc(id).get())
  }

}

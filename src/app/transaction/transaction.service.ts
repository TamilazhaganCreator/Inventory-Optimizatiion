import { from } from 'rxjs';
import { CustomerModel } from 'src/app/master/master.model';
import { Injectable } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { ItemModel } from '../master/master.model';
import { SalesDetailModel, SalesHeaderModel, PurchaseHeaderModel, PurchaseDetailModel, CashPaymentModel } from './transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(private db: FirebaseService) { }

  addSalesHeader(value: SalesHeaderModel) {
    return this.db.firestore.collection('salesheader').doc(value.id.toString()).set({
      id: value.id,
      customerCode: value.customerCode,
      customerName: value.customerName,
      invoiceNo: value.invoiceNo,
      invoiceDate: value.invoiceDate,
      paymentType: value.paymentType,
      dispatchDetails: (value.dispatchDetails || "").trim(),
      chqNo: value.chqNo,
      chqDate: value.chqDate,
      chqBank: value.chqBank,
      chqAmt: value.chqAmt,
      taxAmt: value.taxAmt,
      netAmt: value.netAmt,
      timestamp: value.timestamp,
      paidAmt: value.paidAmt,
      otherCharges: value.otherCharges
    });
  }

  addPurchaseHeader(value: PurchaseHeaderModel) {
    return this.db.firestore.collection('purchaseHeader').doc(value.id.toString()).set({
      id: value.id,
      supplierCode: value.supplierCode,
      supplierName: value.supplierName,
      invoiceNo: value.invoiceNo,
      invoiceDate: value.invoiceDate,
      paymentType: value.paymentType,
      chqNo: value.chqNo,
      chqDate: value.chqDate,
      chqBank: value.chqBank,
      chqAmt: value.chqAmt,
      taxAmt: value.taxAmt,
      netAmt: value.netAmt,
      timestamp: value.timestamp,
      paidAmt: value.paidAmt,
      otherCharges: value.otherCharges
    });
  }

  updatePurchaseHeader(value: PurchaseHeaderModel) {
    return this.db.firestore.collection('purchaseHeader').doc(value.id.toString()).update(value);
  }

  updateSalesHeader(value: SalesHeaderModel) {
    return this.db.firestore.collection('salesheader').doc(value.id.toString()).update(value);
  }

  deleteSalesHeader(value: SalesHeaderModel) {
    return this.db.firestore.collection('salesheader').doc(value.id.toString()).delete();
  }

  deletePurcahseHeader(value: PurchaseHeaderModel) {
    return this.db.firestore.collection('purchaseHeader').doc(value.id.toString()).delete();
  }

  addSalesDetail(salesArray: SalesDetailModel[], id: string) {
    var batch = this.db.firestore.batch()
    let docs: any[] = []
    let index = 0
    salesArray.forEach(sale => {
      docs[index] = this.db.firestore.collection("salesdetail").doc(id + (index + 1));
      batch.set(docs[index], {
        id: +id,
        itemName: sale.itemName,
        itemCode: sale.itemCode,
        hsncode: sale.hsncode,
        quantity: sale.quantity,
        unit: sale.unit,
        totalUnit: sale.totalUnit,
        sp: sale.sp,
        netAmt: sale.netAmt,
        cgstAmt: sale.cgstAmt,
        sgstAmt: sale.sgstAmt,
        igstAmt: sale.igstAmt,
        cessAmt: sale.cessAmt,
        cgst_perc: sale.cgst_perc,
        sgst_perc: sale.sgst_perc,
        cess_perc: sale.cess_perc,
        igst_perc: sale.igst_perc,
        taxPercentage: sale.taxPercentage
      });
      index++;
    })
    return batch.commit()
  }

  updateSalesDetail(value: SalesDetailModel[], id: string) {
    return this.db.firestore.collection('salesdetail').doc(id).update(value);
  }

  deleteSalesDetail(salesArray: SalesDetailModel[], id: string) {
    var batch = this.db.firestore.batch()
    let docs: any[] = []
    let index = 0
    salesArray.forEach(sale => {
      docs[index] = this.db.firestore.collection("salesdetail").doc(id + (index + 1));
      batch.delete(docs[index]);
      index++;
    })
    return batch.commit()
  }

  addPurchaseDetail(purchaseArray: PurchaseDetailModel[], id: string) {
    var batch = this.db.firestore.batch()
    let docs: any[] = []
    let index = 0
    purchaseArray.forEach(purchase => {
      docs[index] = this.db.firestore.collection("purchaseDetail").doc(id + (index + 1));
      batch.set(docs[index], {
        id: +id,
        itemName: purchase.itemName,
        itemCode: purchase.itemCode,
        hsncode: purchase.hsncode,
        quantity: purchase.quantity,
        unit: purchase.unit,
        totalUnit: purchase.totalUnit,
        sp: purchase.sp,
        netAmt: purchase.netAmt,
        cgstAmt: purchase.cgstAmt,
        sgstAmt: purchase.sgstAmt,
        igstAmt: purchase.igstAmt,
        cessAmt: purchase.cessAmt,
        cgst_perc: purchase.cgst_perc,
        sgst_perc: purchase.sgst_perc,
        cess_perc: purchase.cess_perc,
        igst_perc: purchase.igst_perc,
        taxPercentage: purchase.taxPercentage
      });
      index++;
    })
    return batch.commit()
  }

  updatePurchasesDetail(value: PurchaseDetailModel[], id: string) {
    return this.db.firestore.collection('purchaseDetail').doc(id).update(value);
  }

  deletePurchaseDetail(purchaseArray: PurchaseDetailModel[], id: string) {
    var batch = this.db.firestore.batch()
    let docs: any[] = []
    let index = 0
    purchaseArray.forEach(purchase => {
      docs[index] = this.db.firestore.collection("purchaseDetail").doc(id + (index + 1));
      batch.delete(docs[index]);
      index++;
    })
    return batch.commit()
  }
  updateItemDetails(itemArray: ItemModel[]) {
    var batch = this.db.firestore.batch()
    let docs: any[] = []
    let index = 0
    itemArray.forEach(item => {
      docs[index] = this.db.firestore.collection("itemmaster").doc(item.code.toString());
      batch.update(docs[index], {
        "unit": item.unit,
        "hsncode": item.hsncode,
        "taxPercentage": item.taxPercentage,
        "stock": item.stock,
        "cgst_perc": item.cgst_perc,
        "sgst_perc": item.sgst_perc,
        "igst_perc": item.igst_perc,
        "cess_perc": item.cess_perc,
        "sales": item.sales,
        "purchase": item.purchase
      });
      index++;
    })
    return batch.commit()
  }

  updateCustomerAmount(collection: string, id: string, amount: number) {
    return this.db.firestore.collection(collection).doc(id)
      .update({
        "amount": amount
      })
  }

  getHeaderDetails(collection, id) {
    return from(this.db.firestore.collection(collection).doc(id).get())
  }

  getTransactionDetails(collection, id) {
    return this.db.firestore.collection(collection).where("id", "==", +id).get()
  }

  getAllItems(collection, field) {
    return this.db.firestore.collection(collection).orderBy(field).get()
  }

  addPayment(collection, value: CashPaymentModel) {
    return this.db.firestore.collection(collection).doc(value.id.toString()).set({
      id: value.id,
      code: value.code,
      name: value.name,
      date: value.date,
      timestamp: value.timestamp,
      paymentType: value.paymentType,
      note: value.note,
      amount: value.amount
    })
  }
}

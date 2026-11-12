import { FilterModel } from './report.model';
import { Injectable } from '@angular/core';
import { FirebaseService } from '../firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private db: FirebaseService) { }

  getFullData(collection, field) {
    return this.db.firestore.collection(collection).orderBy(field).get()
  }

  getFullPaymentWithRange(collection, filter: FilterModel) {
    return this.db.firestore.collection(collection + "payments")
      .where("timestamp", ">=", filter.startTimestamp)
      .where("timestamp", "<=", filter.endTimestamp)
      .orderBy("timestamp")
      .get()
  }

  getFullPaymentWithName(collection, filter: FilterModel) {
    return this.db.firestore.collection(collection + "payments")
      .where("code", "==", filter.customerCode)
      .get()
  }

  getFullTransactonWithRange(collection, filter: FilterModel) {
    return this.db.firestore.collection(collection)
      .where("timestamp", ">=", filter.startTimestamp)
      .where("timestamp", "<=", filter.endTimestamp)
      .orderBy("timestamp")
      .get()
  }

}

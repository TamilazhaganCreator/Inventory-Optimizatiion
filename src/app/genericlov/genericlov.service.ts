import { Injectable } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { Observable, Subject } from 'rxjs';
import { ItemModel, CustomerModel } from '../master/master.model';

@Injectable()
export class GenericLovService {

  private lovModalOpen: Subject<[boolean, string, string, number]>;
  private itemDetail: Subject<[ItemModel, string,number]> = new Subject<[ItemModel, string,number]>();
  private focusElementIndex: Subject<number> = new Subject<number>();


  constructor(private db: FirebaseService) {
    this.lovModalOpen = new Subject<[boolean, string, string, number]>()
  }

  showLovModal(status: boolean, lovType: string, searchWord: string, index: number) {
    this.lovModalOpen.next([status, lovType, searchWord, index])
  }

  getLovModalStatus(): Observable<[boolean, string, string, number]> {
    return this.lovModalOpen
  }

  getAllItems(collection, field) {
    return this.db.firestore.collection(collection).orderBy(field).limit(100).get()
  }

  getLovItem(): Observable<[any, string,number]> {
    return this.itemDetail
  }

  setLovItem(item: any, lovType: string,index:number) {
    this.itemDetail.next([item, lovType,index])
  }

  setElementFocus(show: number) {
    this.focusElementIndex.next(show)
  }

  getLovLastFocus(): Observable<number> {
    return this.focusElementIndex
  }
}

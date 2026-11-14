export class SalesHeaderModel {
    id: number = null;
    customerCode: number = null;
    customerName: string = null;
    customerAddress: string = null;
    customerGSTNo: string = null;
    customerAmt: number = null;
    customerLocation: number = null;
    invoiceNo: string;
    invoiceDate: Date;
    paymentType: number;
    dispatchDetails: string = "";
    chqNo: number = 0;
    chqDate: string = null;
    chqBank: string = "";
    chqAmt: number = null;
    taxAmt: number;
    netAmt: number;
    customerValid = false
    otherCharges: number = 0;
    timestamp: number;
    paidAmt: number = null;
    invoiceDateString: String;
}

export class TransactionReportModel {
    id: number = null;
    customerCode: number = null;
    customerName: string = null;
    customerAmt: number = null;
    invoiceNo: string;
    paymentType: number;
    netAmt: number;
    timestamp: number;
    paidAmt: number = null;
    taxAmt: number;
    invoiceDateString: String;
    paymentTypeString: String;
    otherCharges: number = 0;
}

export class PurchaseTransactionReportModel {
    id: number = null;
    supplierCode: number = null;
    supplierName: string = null;
    customerAmt: number = null;
    invoiceNo: string;
    paymentType: number;
    netAmt: number;
    taxAmt: number;
    timestamp: number;
    paidAmt: number = null;
    invoiceDateString: String;
    paymentTypeString: String;
    otherCharges: number = 0;
}


export class SalesDetailModel {
    id: number = null;
    itemName: string = null;
    itemCode: number = null;
    hsncode: string = '';
    quantity: number = null;
    unit: number;
    totalUnit: number;
    sp: number = null;
    netAmt: number;
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    cessAmt: number;
    cgst_perc: number;
    sgst_perc: number;
    cess_perc: number;
    igst_perc: number;
    taxPercentage: number;
    stockValue: number;
    sales: number;
    purchase: number;
}

export class PurchaseHeaderModel {
    id: number = null;
    supplierCode: number = null;
    supplierName: string = null;
    supplierAddress: string = null;
    supplierGSTNo: string = null;
    supplierAmt: number = null;
    supplierLocation: number = null;
    invoiceNo: string;
    invoiceDate: Date;
    paymentType: number;
    chqNo: number = 0;
    chqDate: string = null;
    chqBank: string = "";
    chqAmt: number = null;
    taxAmt: number;
    netAmt: number;
    supplierValid = false
    timestamp: number;
    otherCharges: number = 0;
    paidAmt: number = null;
}

export class PurchaseDetailModel {
    id: number = null;
    itemName: string = null;
    itemCode: number = null;
    hsncode: string = '';
    quantity: number = null;
    unit: number;
    totalUnit: number;
    sp: number = null;
    netAmt: number;
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    cessAmt: number;
    cgst_perc: number;
    sgst_perc: number;
    cess_perc: number;
    igst_perc: number;
    taxPercentage: number;
    stockValue: number;
    sales: number;
    purchase: number;
}

export class CashPaymentModel {
    id: number = null;
    personType: string = null;
    code: number = null;
    name: String = null;
    date: Date = null;
    timestamp: number = null;
    paymentType: String = null;
    note: String = null;
    amount: number = null;
    personAmt: number = null;
    dateString:String = null;
}
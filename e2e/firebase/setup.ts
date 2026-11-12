import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

export const projectId = 'demo-inventory-upgrade';
export const email = 'inventory-e2e@gmail.com';
export const password = 'local-emulator-only-password';

export default async function setup() {
  if (process.env['FIRESTORE_EMULATOR_HOST'] !== '127.0.0.1:8080' ||
      process.env['FIREBASE_AUTH_EMULATOR_HOST'] !== '127.0.0.1:9099') {
    throw new Error('Run integration tests through npm run e2e:integration with local emulators.');
  }
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, { method: 'DELETE' });
  const app = firebase.initializeApp({ projectId, apiKey: 'demo-inventory-key' }, 'e2e-seed');
  const auth = app.auth();
  auth.useEmulator('http://127.0.0.1:9099');
  const db = app.firestore();
  db.useEmulator('127.0.0.1', 8080);
  try {
    // Exercise the actual Node SDK (and patched gRPC transport), including denial before auth.
    let denied = false;
    try { await db.collection('customermaster').get(); }
    catch (error) { denied = (error as { code: string }).code === 'permission-denied'; }
    if (!denied) throw new Error('Emulator rules must deny unauthenticated Firestore access.');
    await auth.createUserWithEmailAndPassword(email, password);
    const batch = db.batch();
    const person = { code: 1, name: 'Emulator Customer', address: '12 Test Street, Chennai', mobileNo: 9000000000,
      email, landline: 0, gstNo: '33TEST0000A1Z5', amount: 0, location: 0 };
    batch.set(db.doc('customermaster/1'), person);
    batch.set(db.doc('suppliermaster/1'), { ...person, name: 'Emulator Supplier' });
    batch.set(db.doc('itemmaster/1'), { code: 1, name: 'Test Stock Item', sp: 100, cost: 80, unit: 1, hsncode: '1001',
      cgst_perc: 9, sgst_perc: 9, igst_perc: 0, cess_perc: 0, taxPercentage: 18, stock: 100, purchase: 100, sales: 2 });
    const timestamp = new Date(2026, 10, 12).getTime();
    const header = { invoiceNo: 'E2E-INVOICE-1', invoiceDate: firebase.firestore.Timestamp.fromMillis(timestamp),
      timestamp, paymentType: 1, paidAmt: 236, otherCharges: 0, chqNo: 0, chqDate: null, chqBank: '', chqAmt: null,
      netAmt: 236, taxAmt: 36 };
    const detail = { itemName: 'Test Stock Item', itemCode: 1, hsncode: '1001', quantity: 2, unit: 1, totalUnit: 2,
      sp: 100, netAmt: 236, cgstAmt: 18, sgstAmt: 18, igstAmt: 0, cessAmt: 0,
      cgst_perc: 9, sgst_perc: 9, igst_perc: 0, cess_perc: 0, taxPercentage: 18 };
    batch.set(db.doc('salesheader/1001'), { ...header, id: 1001, customerCode: 1, customerName: person.name });
    batch.set(db.doc('salesdetail/10011'), { ...detail, id: 1001 });
    batch.set(db.doc('purchaseHeader/2001'), { ...header, id: 2001, supplierCode: 1, supplierName: 'Emulator Supplier' });
    batch.set(db.doc('purchaseDetail/20011'), { ...detail, id: 2001 });
    batch.set(db.doc('salesheader/1002'), { ...header, id: 1002, timestamp: timestamp + 1000,
      invoiceNo: 'ZZ-SECOND-SALE', customerCode: 1, customerName: person.name });
    batch.set(db.doc('salesdetail/10021'), { ...detail, id: 1002 });
    batch.set(db.doc('purchaseHeader/2002'), { ...header, id: 2002, timestamp: timestamp + 1000,
      invoiceNo: 'ZZ-SECOND-PURCHASE', supplierCode: 1, supplierName: 'Emulator Supplier' });
    batch.set(db.doc('purchaseDetail/20021'), { ...detail, id: 2002 });
    batch.set(db.doc('customerpayments/0'), { id: 0, code: 1, name: person.name,
      timestamp, date: firebase.firestore.Timestamp.fromMillis(timestamp), paymentType: 'cash',
      note: 'Seeded payment', amount: 10 });
    await batch.commit();
    const result = await db.collection('salesdetail').where('id', '==', 1001).get();
    if (result.size !== 1 || result.docs[0].data()['netAmt'] !== 236) throw new Error('Seeded batch/query verification failed.');
    await auth.signOut();
  } finally {
    await db.terminate();
    await app.delete();
  }
}

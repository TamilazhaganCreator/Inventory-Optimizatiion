import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { environment } from '../environments/environment';

// Keep the existing Firestore query and batch semantics during the SDK upgrade.
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app = firebase.apps.length ? firebase.app() : firebase.initializeApp(environment.firebase);
  readonly firestore = this.app.firestore();
  readonly auth = this.app.auth();

  constructor() {
    if (environment.firebaseEmulators) {
      if (environment.firebase.projectId !== 'demo-inventory-upgrade') {
        throw new Error('Emulator mode requires the isolated demo project.');
      }
      this.auth.useEmulator('http://127.0.0.1:9099');
      this.firestore.useEmulator('127.0.0.1', 8080);
    }
  }
}

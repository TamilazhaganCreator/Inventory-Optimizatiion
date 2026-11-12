import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private firebase: FirebaseService) {}

  doLogin(email: string, pwd: string) {
    return this.firebase.auth.signInWithEmailAndPassword(email, pwd);
  }

  doLogout(): Promise<void> {
    return this.firebase.auth.signOut();
  }
}

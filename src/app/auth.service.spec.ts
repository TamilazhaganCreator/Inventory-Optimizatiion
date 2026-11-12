import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

describe('AuthService Firebase SDK migration', () => {
  const auth = {
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  };
  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: FirebaseService, useValue: { auth } }] });
  });

  it('passes credentials to Firebase and returns the authentication result', async () => {
    const result = { user: { uid: 'test-user' } };
    auth.signInWithEmailAndPassword.mockResolvedValue(result);
    await expect(TestBed.inject(AuthService).doLogin('user@example.com', 'password')).resolves.toBe(result);
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith('user@example.com', 'password');
  });

  it('waits for Firebase sign-out to complete', async () => {
    auth.signOut.mockResolvedValue(undefined);
    await TestBed.inject(AuthService).doLogout();
    expect(auth.signOut).toHaveBeenCalledOnce();
  });

  it('propagates a sign-out failure', async () => {
    auth.signOut.mockRejectedValue(new Error('sign-out failed'));
    await expect(TestBed.inject(AuthService).doLogout()).rejects.toThrow('sign-out failed');
  });
});

import { GenericLovService } from '../app/genericlov/genericlov.service';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { FirebaseService } from '../app/firebase.service';
import { MasterService } from '../app/master/master.service';

export function testProviders() {
  const snapshot = { docs: [], empty: true, size: 0, forEach: () => {} };
  const query = {
    orderBy: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(snapshot),
    doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: false, data: () => undefined }) }),
  };
  return [
    provideRouter([]),
    provideNoopAnimations(),
    MasterService,
    GenericLovService,
    { provide: FirebaseService, useValue: {
      firestore: { collection: vi.fn().mockReturnValue(query) },
      auth: { signInWithEmailAndPassword: vi.fn(), signOut: vi.fn().mockResolvedValue(undefined) },
    } },
  ];
}

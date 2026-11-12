import { testProviders } from '../../testing/providers';
import { TestBed } from '@angular/core/testing';

import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  it('should be created', () => {
    const service: TransactionService = TestBed.inject(TransactionService);
    expect(service).toBeTruthy();
  });
});

import { testProviders } from '../testing/providers';
import { TestBed } from '@angular/core/testing';

import { GlobalService } from './global.service';

describe('GlobalService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  it('should be created', () => {
    const service: GlobalService = TestBed.inject(GlobalService);
    expect(service).toBeTruthy();
  });
});

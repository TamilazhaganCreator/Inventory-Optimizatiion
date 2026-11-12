import { testProviders } from '../../testing/providers';
import { TestBed } from '@angular/core/testing';

import { MasterService } from './master.service';

describe('MasterService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  it('should be created', () => {
    const service: MasterService = TestBed.inject(MasterService);
    expect(service).toBeTruthy();
  });
});

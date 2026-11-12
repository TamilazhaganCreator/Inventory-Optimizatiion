import { testProviders } from '../../testing/providers';
import { TestBed } from '@angular/core/testing';

import { ReportService } from './report.service';

describe('ReportService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: testProviders() }));

  it('should be created', () => {
    const service: ReportService = TestBed.inject(ReportService);
    expect(service).toBeTruthy();
  });
});

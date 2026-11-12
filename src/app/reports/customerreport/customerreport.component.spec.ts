import { TestBed } from '@angular/core/testing';
import { CustomerreportComponent } from './customerreport.component';
import { ReportModule } from '../report.module';
import { testProviders } from '../../../testing/providers';

describe('CustomerreportComponent', () => {
  it('renders with the upgraded feature module', async () => {
    await TestBed.configureTestingModule({
      imports: [ReportModule],
      providers: testProviders(),
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomerreportComponent);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 160));
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.children.length).toBeGreaterThan(0);
  });
});

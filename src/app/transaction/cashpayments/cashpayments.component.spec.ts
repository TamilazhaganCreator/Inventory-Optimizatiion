import { TestBed } from '@angular/core/testing';
import { CashpaymentsComponent } from './cashpayments.component';
import { TransactionModule } from '../transaction.module';
import { testProviders } from '../../../testing/providers';

describe('CashpaymentsComponent', () => {
  it('renders with the upgraded feature module', async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionModule],
      providers: testProviders(),
    }).compileComponents();
    const fixture = TestBed.createComponent(CashpaymentsComponent);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 160));
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.children.length).toBeGreaterThan(0);
  });
});

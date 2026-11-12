import { TestBed } from '@angular/core/testing';
import { UnitmasterComponent } from './unitmaster.component';
import { MasterModule } from '../master.module';
import { testProviders } from '../../../testing/providers';

describe('UnitmasterComponent', () => {
  it('renders with the upgraded feature module', async () => {
    await TestBed.configureTestingModule({
      imports: [MasterModule],
      providers: testProviders(),
    }).compileComponents();
    const fixture = TestBed.createComponent(UnitmasterComponent);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 160));
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.children.length).toBeGreaterThan(0);
  });
});

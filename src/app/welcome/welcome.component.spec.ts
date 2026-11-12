import { TestBed } from '@angular/core/testing';
import { WelcomeComponent } from './welcome.component';
import { AppModule } from '../app.module';
import { testProviders } from '../../testing/providers';

describe('WelcomeComponent', () => {
  it('renders with the upgraded feature module', async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: testProviders(),
    }).compileComponents();
    const fixture = TestBed.createComponent(WelcomeComponent);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 160));
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.children.length).toBeGreaterThan(0);
  });
});

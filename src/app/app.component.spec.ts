import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { AuthService } from './auth.service';
import { testProviders } from '../testing/providers';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [AppModule], providers: testProviders() }).compileComponents();
  });

  it('renders the login form when there is no saved session', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#user')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#pwd')).toBeTruthy();
  });

  it('validates missing credentials without calling Firebase', () => {
    const auth = vi.spyOn(TestBed.inject(AuthService), 'doLogin');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.login();
    expect(auth).not.toHaveBeenCalled();
    expect(fixture.componentInstance.global.loader).toBe(false);
  });

  it('restores the existing saved session', () => {
    localStorage.setItem('loginStatus', 'LoggedIn');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loggedIn).toBe(true);
    localStorage.clear();
  });
});

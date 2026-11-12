import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as M from '@materializecss/materialize';
import { MaterializeModule } from './materialize.module';

@Component({
  imports: [MaterializeModule],
  template: `<div><input materialize="pickadate" [materializeParams]="params" (input)="value = $any($event.target).value"></div>`,
})
class DateHost {
  params = [{ format: 'dd/mm/yyyy' }];
  value = '';
}

describe('Materialize date picker migration', () => {
  it('updates Angular with a formatted date without recursive change events', async () => {
    await TestBed.configureTestingModule({ imports: [DateHost] }).compileComponents();
    const fixture = TestBed.createComponent(DateHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    const picker = M.Datepicker.getInstance(input);
    picker.setDate(new Date(2026, 10, 12));
    expect(input.value).toBe('12/11/2026');
    expect(fixture.componentInstance.value).toBe('12/11/2026');
  });
});

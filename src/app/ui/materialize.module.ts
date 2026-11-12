import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgModule, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import * as M from '@materializecss/materialize';

export interface MaterializeAction {
  action: string;
  params: any[];
}

// Bridge the existing templates to Materialize's current, jQuery-free API.
@Directive({ selector: '[materialize]', standalone: false })
export class MaterializeDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() materialize = '';
  @Input() materializeParams: any[] = [];
  @Input() materializeActions?: EventEmitter<string | MaterializeAction>;
  private instance: any;
  private actions?: Subscription;
  private initialized = false;

  constructor(private element: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit() {
    this.initialized = true;
    this.initialize();
    this.actions = this.materializeActions?.subscribe(action => {
      if (typeof action === 'string') return;
      const [method, ...params] = action.params;
      this.instance?.[method]?.(...params);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized && changes['materializeParams']) this.initialize();
  }

  private initialize() {
    this.instance?.destroy();
    const element = this.element.nativeElement;
    const options = { ...this.materializeParams[0] };
    this.zone.runOutsideAngular(() => {
      switch (this.materialize) {
        case 'modal':
          this.instance = this.initializeDialog(element as HTMLDialogElement, options);
          break;
        case 'collapsible':
          this.instance = M.Collapsible.init(element, options);
          break;
        case 'pickadate':
          // Materialize 2 replaces Pickadate. Preserve the app's dd/mm/yyyy values.
          options.autoSubmit = true;
          options.format ??= 'dd/mm/yyyy';
          options.parse = (value: string) => {
            const [day, month, year] = value.split('/').map(Number);
            return new Date(year, month - 1, day);
          };
          if (options.max === true) options.maxDate = new Date();
          if ((element as HTMLInputElement).value) {
            options.defaultDate = options.parse((element as HTMLInputElement).value);
          }
          if (options.min instanceof Date) options.minDate = options.min;
          options.onSelect = () => this.zone.run(() => {
            this.instance.setInputValues();
            element.dispatchEvent(new Event('input', { bubbles: true }));
          });
          this.instance = this.initializeDatepicker(element as HTMLInputElement, options);
          break;
        case 'dropdown':
          this.instance = M.Dropdown.init(element, { hover: true, coverTrigger: false, constrainWidth: false, ...options });
          // Materialize 2.4 emits an invalid position-area() value for top.
          this.instance.dropdownEl.style.top = 'anchor(bottom)';
          this.instance.dropdownEl.style.bottom = 'auto';
          break;
        // Native selects retain Angular's value accessor and dynamic option updates.
        case 'material_select':
          element.classList.add('browser-default');
          break;
      }
    });
  }

  private initializeDatepicker(input: HTMLInputElement, options: any) {
    // 2.4 renders an inline calendar; the app expects a popup that does not
    // participate in the float grid. Own its native dialog and lifecycle.
    const dialog = document.createElement('dialog');
    dialog.className = 'modal datepicker-modal app-datepicker';
    dialog.setAttribute('aria-label', 'Choose date');
    document.body.append(dialog);
    const popup = this.initializeDialog(dialog, {});
    const picker = M.Datepicker.init(input, {
      ...options,
      container: dialog,
      onInputInteraction: () => {
        if (!input.readOnly && !input.disabled) popup.open();
      },
      onConfirm: () => popup.close(),
      onCancel: () => popup.close(),
    });
    // The library's click handler uses Date.parse, which misreads dd/mm/yyyy.
    picker.setDateFromInput = (element: HTMLInputElement) => {
      const date = options.parse(element.value);
      if (!isNaN(date.getTime())) picker.setDate(date, true);
    };
    const destroy = picker.destroy.bind(picker);
    picker.destroy = () => {
      popup.destroy();
      destroy();
      dialog.remove();
    };
    return picker;
  }

  private initializeDialog(dialog: HTMLDialogElement, options: any) {
    // Materialize 2.4's Modal class is a no-op; modals now use native dialogs.
    const close = () => {
      if (dialog.open) dialog.close();
    };
    const onCancel = (event: Event) => {
      if (options.dismissible === false) event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.modal-close') && !target.closest('.disabled')) close();
      if (target === dialog && options.dismissible !== false) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }
    };
    const onClose = () => this.zone.run(() => {
      options.onCloseEnd?.(dialog);
      options.complete?.();
    });
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('close', onClose);
    return {
      open: () => {
        if (dialog.open) return;
        this.zone.run(() => options.onOpenStart?.(dialog));
        dialog.showModal();
        this.zone.run(() => {
          options.onOpenEnd?.(dialog);
          options.ready?.();
        });
      },
      close,
      destroy: () => {
        dialog.removeEventListener('cancel', onCancel);
        dialog.removeEventListener('click', onClick);
        dialog.removeEventListener('close', onClose);
        close();
      },
    };
  }

  ngOnDestroy() {
    this.actions?.unsubscribe();
    this.instance?.destroy();
  }
}

// A blank placeholder lets CSS track actual values, including Angular writes,
// without maintaining a second label state in every form component.
@Directive({ selector: 'input, textarea', standalone: false })
export class MaterializeInputDirective implements AfterViewInit {
  constructor(private element: ElementRef<HTMLInputElement | HTMLTextAreaElement>) {}

  ngAfterViewInit() {
    const input = this.element.nativeElement;
    if (input.closest('.input-field') && !input.hasAttribute('placeholder')) {
      input.setAttribute('placeholder', ' ');
    }
  }
}

@NgModule({
  declarations: [MaterializeDirective, MaterializeInputDirective],
  exports: [MaterializeDirective, MaterializeInputDirective],
})
export class MaterializeModule {}

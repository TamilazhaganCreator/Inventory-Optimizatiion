import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular';
import { AllCommunityModule, CellContextMenuEvent, ColDef, ICellRendererParams, ModelUpdatedEvent, themeQuartz } from 'ag-grid-community';

interface ViewCellParams extends ICellRendererParams {
  onView: (record: any) => void;
}

@Component({
  selector: 'app-grid-view-button',
  template: `<button type="button" class="view-button" (click)="open($event)">View</button>`,
  styles: [`.view-button { cursor: pointer; height: 28px; min-height: 0; box-sizing: border-box; margin: 3px 0; padding: 0 12px; vertical-align: top; border: 1px solid #1976a3; border-radius: 4px; background: white; color: #145b7f; font: inherit; line-height: 26px; } .view-button:focus-visible { outline: 2px solid #145b7f; outline-offset: 2px; }`],
})
export class GridViewButtonComponent implements ICellRendererAngularComp {
  private params: ViewCellParams;
  agInit(params: ViewCellParams) { this.params = params; }
  refresh(params: ViewCellParams) { this.params = params; return true; }
  open(event: MouseEvent) {
    event.stopPropagation();
    this.params.onView(this.params.data);
  }
}

@Component({
  selector: 'app-report-grid',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular style="width: 100%; height: 440px"
      [modules]="modules" [theme]="theme" [rowData]="rows" [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef" [rowHeight]="36" [headerHeight]="40"
      [animateRows]="false" [suppressCellFocus]="false"
      (cellContextMenu)="openContextMenu($event)" (modelUpdated)="refreshRowNumbers($event)" />
    @if (contextRow) {
      <div class="report-context-menu" role="menu" [style.left.px]="contextX" [style.top.px]="contextY">
        <button type="button" role="menuitem" (click)="viewContextRow()">View</button>
      </div>
    }
  `,
  styles: [`.report-context-menu { position: fixed; z-index: 100001; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 3px 12px #0003; padding: 4px; } .report-context-menu button { padding: 8px 24px; border: 0; background: white; color: #145b7f; cursor: pointer; }`],
})
export class ReportGridComponent implements OnChanges {
  @Input() rows: any[] = [];
  @Input() columns: ColDef[] = [];
  @Input() showView = false;
  @Output() view = new EventEmitter<any>();
  readonly modules = [AllCommunityModule];
  readonly theme = themeQuartz.withParams({ fontSize: 13, headerFontSize: 12, accentColor: '#00897b' });
  readonly defaultColDef: ColDef = {
    flex: 1, minWidth: 135, sortable: true, resizable: true,
    filter: true, floatingFilter: true, editable: false, cellDataType: false,
  };
  columnDefs: ColDef[] = [];
  contextRow: any = null;
  contextX = 0;
  contextY = 0;

  ngOnChanges() {
    this.contextRow = null;
    this.columnDefs = [
      { colId: 'rowNumber', headerName: '#', valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
        width: 55, minWidth: 55, maxWidth: 55, flex: 0, pinned: 'left', sortable: false, filter: false },
      ...this.columns,
      ...(this.showView ? [{ colId: 'view', headerName: 'Actions', width: 95, minWidth: 95, maxWidth: 95, flex: 0,
        pinned: 'right' as const, sortable: false, filter: false, cellRenderer: GridViewButtonComponent,
        cellRendererParams: { onView: (record: any) => this.view.emit(record) },
      }] : []),
    ];
  }

  refreshRowNumbers(event: ModelUpdatedEvent) {
    event.api.refreshCells({ columns: ['rowNumber'], force: true });
  }

  openContextMenu(event: CellContextMenuEvent) {
    if (!this.showView || !event.data || !event.event) return;
    event.event.preventDefault();
    const mouse = event.event as MouseEvent;
    this.contextX = Math.max(0, Math.min(mouse.clientX, window.innerWidth - 110));
    this.contextY = Math.max(0, Math.min(mouse.clientY, window.innerHeight - 50));
    this.contextRow = event.data;
  }

  viewContextRow() {
    const record = this.contextRow;
    this.contextRow = null;
    if (record) this.view.emit(record);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeContextMenu() { this.contextRow = null; }
}

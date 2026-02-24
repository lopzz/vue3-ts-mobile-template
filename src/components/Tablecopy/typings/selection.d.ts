import type { ColumnDef, RowData } from './table.d.ts';
import type { RowNode } from './rowNode.d.ts';

interface HeaderSelectionChangedEvent {
  type: 'selectionChanged';
  column: ColumnDef;
  checked: boolean;
}

interface SelectionChangedEvent {
  type: 'selectionChanged';
  selectedNodes: RowNode[];
  selectedData: RowData[];
  selectionCount: number;
}

interface RowSelectionOptions {
  mode: 'single' | 'multiple';
  enableClickSelection?: boolean;
}

export type {
  HeaderSelectionChangedEvent,
  SelectionChangedEvent,
  RowSelectionOptions,
};

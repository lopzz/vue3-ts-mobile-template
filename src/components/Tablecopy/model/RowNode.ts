import type { RowNode as IRowNode, RowData } from '../typings';

export class RowNode implements IRowNode {
  id: string;
  data: RowData;
  rowIndex: number = -1;
  displayIndex: number = -1;
  selected: boolean = false;

  constructor(id: string, data: RowData, rowIndex: number) {
    this.id = id;
    this.data = data;
    this.rowIndex = rowIndex;
    this.displayIndex = rowIndex;
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
  }

  isSelected(): boolean {
    return this.selected;
  }

  toggleSelected(): void {
    this.selected = !this.selected;
  }

  getRowIndex(): number {
    return this.rowIndex;
  }

  getDisplayIndex(): number {
    return this.displayIndex;
  }

  getData(): RowData {
    return this.data;
  }

  updateData(data: Partial<RowData>): void {
    this.data = { ...this.data, ...data };
  }

  updateDisplayIndex(newIndex: number): void {
    this.displayIndex = newIndex;
  }
}

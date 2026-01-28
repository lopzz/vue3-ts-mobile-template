// GridApi.ts
import { RowManager } from './RowManager';
import type {
  RowData,
  RowNode,
  GridApi as IGridApi,
  SelectionChangedEvent,
} from '../typings';

type EventHandler = (event: SelectionChangedEvent) => void;

export class GridApi implements IGridApi {
  private rowManager: RowManager;
  private selectionHandlers: EventHandler[] = [];

  constructor(rowManager: RowManager) {
    this.rowManager = rowManager;
  }

  // 获取节点
  getRowNode(id: string): RowNode | undefined {
    return this.rowManager.getNode(id);
  }

  // 获取指定位置的节点
  getRowAtIndex(index: number): RowNode | undefined {
    return this.rowManager.getNodeAt(index);
  }

  // 遍历所有行
  forEachRow(callback: (row: RowNode, index: number) => void): void {
    this.rowManager.forEachNode(callback);
  }

  // 获取行数
  getRowCount(): number {
    return this.rowManager.getNodeCount();
  }

  // 获取选中的行数据
  getSelectedRows(): RowData[] {
    return this.rowManager.getSelectedData();
  }

  // 获取选中的节点
  getSelectedNodes(): RowNode[] {
    return this.rowManager.getSelectedNodes();
  }

  // 全选
  selectAll(): void {
    this.rowManager.selectAll();
  }

  // 取消全选
  deselectAll(): void {
    this.rowManager.deselectAll();
  }

  // 选中节点
  selectNode(node: RowNode, clearSelection: boolean = true): void {
    this.rowManager.selectNode(node, clearSelection);
  }

  // 取消选中节点
  deselectNode(node: RowNode): void {
    this.rowManager.deselectNode(node);
  }

  // 切换节点选择
  toggleNodeSelection(node: RowNode): void {
    this.rowManager.toggleNodeSelection(node);
  }

  // 判断是否全选
  isAllSelected(): boolean {
    return this.rowManager.isAllSelected();
  }

  // 设置数据
  setData(data: RowData[]): void {
    this.rowManager.setData(data);
  }

  // 刷新
  refresh(): void {}
}

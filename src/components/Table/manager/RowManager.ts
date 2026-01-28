import type { RowData, RowSelectionOptions } from '../typings';
import { RowNode } from '../model/RowNode';
import { SelectionManager } from './SelectionManager';

export class RowManager {
  private nodes: RowNode[] = [];
  private nodeMap: Map<string, RowNode> = new Map();
  private selectionManager: SelectionManager;

  constructor(
    private getRowId?: (data: RowData) => string,
    rowSelection: RowSelectionOptions = { mode: 'single' },
  ) {
    this.selectionManager = new SelectionManager(rowSelection);
  }

  // 设置数据
  setData(data: RowData[]): void {
    this.clear();

    data.forEach((item, index) => {
      const id = this.generateNodeId(item, index);
      const node = new RowNode(id, item, index);

      this.nodes.push(node);
      this.nodeMap.set(id, node);
      item._id = id;
    });

    this.updateDisplayIndices();
  }

  // 生成节点ID
  private generateNodeId(data: RowData, index: number): string {
    if (this.getRowId) {
      return this.getRowId(data);
    }

    if (data.id !== undefined) {
      return String(data.id);
    }

    return `row_${index}`;
  }

  // 获取所有节点
  getAllNodes(): RowNode[] {
    return this.nodes;
  }

  // 获取节点
  getNode(id: string): RowNode | undefined {
    return this.nodeMap.get(id);
  }

  // 获取指定位置的节点
  getNodeAt(index: number): RowNode | undefined {
    if (index >= 0 && index < this.nodes.length) {
      return this.nodes[index];
    }
    return undefined;
  }

  // 获取节点数量
  getNodeCount(): number {
    return this.nodes.length;
  }

  // 遍历所有节点
  forEachNode(callback: (node: RowNode, index: number) => void): void {
    this.nodes.forEach((node, index) => {
      callback(node, index);
    });
  }

  // 更新显示索引
  updateDisplayIndices(): void {
    this.nodes.forEach((node, index) => {
      node.updateDisplayIndex(index);
    });
  }

  // 清空
  clear(): void {
    this.nodes = [];
    this.nodeMap.clear();
    this.selectionManager.clearSelection();
  }

  // 选择管理器相关方法
  getSelectionManager(): SelectionManager {
    return this.selectionManager;
  }

  // 代理选择管理器的方法
  selectNode(node: RowNode, clearSelection: boolean = true): void {
    this.selectionManager.selectNode(node, clearSelection);
  }

  deselectNode(node: RowNode): void {
    this.selectionManager.deselectNode(node);
  }

  toggleNodeSelection(node: RowNode): void {
    this.selectionManager.toggleNodeSelection(node);
  }

  selectAll(): void {
    this.selectionManager.selectAll(this.nodes);
  }

  deselectAll(): void {
    this.selectionManager.deselectAll();
  }

  getSelectedNodes(): RowNode[] {
    return this.selectionManager.getSelectedNodes();
  }

  getSelectedData(): RowData[] {
    return this.selectionManager.getSelectedData();
  }

  getSelectionCount(): number {
    return this.selectionManager.getSelectionCount();
  }

  // 判断是否全选
  isAllSelected(): boolean {
    if (this.nodes.length === 0) {
      return false;
    }
    return this.getSelectionCount() === this.nodes.length;
  }
}

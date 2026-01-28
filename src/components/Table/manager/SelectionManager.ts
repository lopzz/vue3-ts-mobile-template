import type { RowData, RowSelectionOptions } from '../typings';
import { RowNode } from '../model/RowNode';

export class SelectionManager {
  private selectedNodes: Set<RowNode> = new Set();
  private lastSelectedNode: RowNode | null = null;
  private enableMultiSelection: boolean = true;

  constructor(rowSelection: RowSelectionOptions) {
    this.enableMultiSelection = rowSelection.mode === 'multiple';
  }

  // 选中单个节点
  selectNode(node: RowNode, clearSelection: boolean = true): void {
    if (clearSelection || !this.enableMultiSelection) {
      this.clearSelection();
    }

    node.setSelected(true);
    this.selectedNodes.add(node);
    this.lastSelectedNode = node;
  }

  // 取消选中节点
  deselectNode(node: RowNode): void {
    node.setSelected(false);
    this.selectedNodes.delete(node);

    if (this.lastSelectedNode === node) {
      this.lastSelectedNode = null;
    }
  }

  // 切换节点选择
  toggleNodeSelection(node: RowNode): void {
    if (node.isSelected()) {
      this.deselectNode(node);
    } else {
      this.selectNode(node, !this.enableMultiSelection);
    }
  }

  // 全选
  selectAll(nodes: RowNode[]): void {
    if (!this.enableMultiSelection) return;

    this.clearSelection();

    nodes.forEach((node) => {
      node.setSelected(true);
      this.selectedNodes.add(node);
    });
  }

  // 取消全选
  deselectAll(): void {
    this.selectedNodes.forEach((node) => {
      node.setSelected(false);
    });
    this.selectedNodes.clear();
    this.lastSelectedNode = null;
  }

  // 清除所有选择
  clearSelection(): void {
    this.deselectAll();
  }

  // 获取选中的节点
  getSelectedNodes(): RowNode[] {
    return Array.from(this.selectedNodes);
  }

  // 获取选中的数据
  getSelectedData(): RowData[] {
    return this.getSelectedNodes().map((node) => node.getData());
  }

  // 获取选中数量
  getSelectionCount(): number {
    return this.selectedNodes.size;
  }

  // 处理范围选择
  selectRange(nodes: RowNode[], fromNode: RowNode, toNode: RowNode): void {
    if (!this.enableMultiSelection) return;

    const startIndex = nodes.findIndex((n) => n.id === fromNode.id);
    const endIndex = nodes.findIndex((n) => n.id === toNode.id);

    if (startIndex === -1 || endIndex === -1) return;

    const [first, last] = [
      Math.min(startIndex, endIndex),
      Math.max(startIndex, endIndex),
    ];

    this.clearSelection();

    for (let i = first; i <= last; i++) {
      const node = nodes[i];
      if (node) {
        node.setSelected(true);
        this.selectedNodes.add(node);
      }
    }

    this.lastSelectedNode = toNode;
  }

  // 判断是否有选择
  hasSelection(): boolean {
    return this.selectedNodes.size > 0;
  }

  // 获取最后选中的节点
  getLastSelectedNode(): RowNode | null {
    return this.lastSelectedNode;
  }
}

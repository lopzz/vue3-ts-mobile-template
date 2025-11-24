import type { RouteRecordRaw } from 'vue-router';

// 定义递归类型以将 RouteRecordRaw 的 component 属性更改为 string
type RouteRecordStringComponent<T = string> = Omit<
  RouteRecordRaw,
  'children' | 'component'
> & {
  children?: RouteRecordStringComponent<T>[];
  component: T;
};

export type { RouteRecordRaw, RouteRecordStringComponent };

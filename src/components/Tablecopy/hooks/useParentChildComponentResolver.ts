import { getCurrentInstance } from 'vue';
import type { DefineComponent } from 'vue';

/**
 * 精简版组件查找 Hook
 * 只查找父组件和当前组件注册的组件
 */
export function useParentChildComponentResolver() {
  const instance = getCurrentInstance();

  if (!instance) {
    throw new Error(
      'useParentChildComponentResolver must be called within a setup function',
    );
  }

  // 获取组件选项
  const getComponentOptions = (inst: any) => {
    // 尝试多种方式获取组件选项
    return inst?.proxy?.$options || inst?.type || {};
  };

  /**
   * 在父组件和当前组件中查找组件
   * @param componentName 组件名称
   * @returns 找到的组件定义，未找到返回 null
   */
  const findComponent = (componentName: string): DefineComponent | null => {
    const currentOptions = getComponentOptions(instance);
    const parentOptions = instance.parent
      ? getComponentOptions(instance.parent)
      : null;

    // 1. 在当前组件的组件选项中查找
    if (currentOptions.components?.[componentName]) {
      return currentOptions.components[componentName];
    }

    // 2. 在父组件的组件选项中查找
    if (parentOptions?.components?.[componentName]) {
      return parentOptions.components[componentName];
    }

    return null;
  };

  /**
   * 批量查找多个组件
   * @param componentNames 组件名称数组
   * @returns 组件名称到组件定义的映射
   */
  const findComponents = (
    componentNames: string[],
  ): Record<string, DefineComponent> => {
    const result: Record<string, DefineComponent> = {};

    componentNames.forEach((name) => {
      const component = findComponent(name);
      if (component) {
        result[name] = component;
      }
    });

    return result;
  };

  /**
   * 安全获取组件（找不到时抛出错误或返回备用组件）
   * @param componentName 组件名称
   * @param fallback 可选的备用组件
   * @returns 找到的组件或备用组件
   */
  const resolveComponent = (
    componentName: string,
    fallback?: DefineComponent,
  ): DefineComponent => {
    const component = findComponent(componentName);

    if (!component) {
      if (fallback) {
        console.warn(
          `Component "${componentName}" not found in parent or current component, using fallback`,
        );
        return fallback;
      }
      throw new Error(
        `Component "${componentName}" not found in parent or current component`,
      );
    }

    return component;
  };

  /**
   * 获取父组件和当前组件的组件注册表
   */
  const getParentChildComponentRegistry = (): Record<
    string,
    DefineComponent
  > => {
    const registry: Record<string, DefineComponent> = {};
    const currentOptions = getComponentOptions(instance);
    const parentOptions = instance.parent
      ? getComponentOptions(instance.parent)
      : null;

    // 收集父组件的组件
    if (parentOptions?.components) {
      Object.assign(registry, parentOptions.components);
    }

    // 收集当前组件的组件
    if (currentOptions.components) {
      Object.assign(registry, currentOptions.components);
    }

    return registry;
  };

  /**
   * 检查组件是否在父组件或当前组件中注册
   */
  const hasComponent = (componentName: string): boolean => {
    return findComponent(componentName) !== null;
  };

  /**
   * 检查组件是在父组件中还是当前组件中注册
   */
  const getComponentLocation = (
    componentName: string,
  ): 'current' | 'parent' | 'none' => {
    const currentOptions = getComponentOptions(instance);
    const parentOptions = instance.parent
      ? getComponentOptions(instance.parent)
      : null;

    // 先检查当前组件
    if (currentOptions.components?.[componentName]) {
      return 'current';
    }

    // 再检查父组件
    if (parentOptions?.components?.[componentName]) {
      return 'parent';
    }

    return 'none';
  };

  /**
   * 获取查找结果详情
   */
  const getComponentLookupDetail = (componentName: string) => {
    const location = getComponentLocation(componentName);
    const component = findComponent(componentName);

    return {
      found: location !== 'none',
      location,
      component,
      parentComponentName: instance.parent?.type.name || 'unknown',
      currentComponentName: instance.type.name || 'anonymous',
    };
  };

  return {
    findComponent,
    findComponents,
    resolveComponent,
    getParentChildComponentRegistry,
    hasComponent,
    getComponentLocation,
    getComponentLookupDetail,
  };
}

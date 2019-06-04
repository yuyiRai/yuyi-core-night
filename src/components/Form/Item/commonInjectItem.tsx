import { isString } from 'lodash';
import { inject, IReactComponent, IWrappedComponent, observer } from 'mobx-react';
export function commonInjectItem(target: string, ...stores: string[]): <T extends IReactComponent>(target: T) => T & (T extends IReactComponent<infer P> ? IWrappedComponent<P> : never);
export function commonInjectItem<T extends IReactComponent>(target: T): T & (T extends IReactComponent<infer P> ? IWrappedComponent<P> : never);
export function commonInjectItem<T extends IReactComponent>(Target: T | string, ...append: string[]) {
  if (isString(Target)) {
    return function (InjectTarget: T) {
      return inject('formStore', 'antdForm', 'itemConfig', Target, ...append)(observer(InjectTarget));
    };
  }
  return inject('formStore', 'antdForm', 'itemConfig')(observer(Target));
}
// export const commonInjectItem = () => function <T extends IReactComponent>(target: T) {
//   return inject('formStore', 'antdForm')(observer(target));
// };
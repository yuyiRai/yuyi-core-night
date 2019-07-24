import { IKeyValueMap } from 'mobx';
import { Observer, useObserver } from 'mobx-react-lite';
import { IDisposer } from 'mobx-utils';
import * as React from 'react';
import { concat } from 'lodash'
import { Utils } from 'yuyi-core-utils';
import { HashItemList } from './HashItemList';

// const aaa = <T>(state: T, action: T) => {
//   state = null
//   return action
// }

export const RefMap = new WeakMap();
window.RefMap = RefMap;
declare global {
  interface Window {
    RefMap: WeakMap<any, any>;
  }
}

export type SafeRef<T> = {
  value: T;
  lastValue: T;
}

/**
 * 安全useCallback
 */
export type SafeCallbackFactory<Store> = <Params extends HashItemList = HashItemList>(
  callback: ((This: Store, ...p: Params) => void),
  deps?: Params
) => (() => void)
export function useForceUpdate() {
  const version = React.useState(0)
  return React.useCallback(() => version[1](number => number + 1), [])
}
/**
 * aaaa
 */
export type UseSafeRefReturns<T> = [React.MutableRefObject<SafeRef<T>>, React.Dispatch<T>, SafeCallbackFactory<T>]
/**
 * 使用安全的Ref
 * @param initValue 初始化值Or初始化函数
 * @param initParamaters 初始化函数参数
 * @returns
 */
export function useSafeRef<T = any, P = any>(
  initValue: T | ((initParamaters?: P) => T) = null, initParamaters?: P
): UseSafeRefReturns<T> {
  const testRef = React.useRef<SafeRef<T>>(null)
  if (!testRef.current) {
    testRef.current = {
      value: Utils.isFunction(initValue) ? initValue(initParamaters) : initValue,
      lastValue: null as T
    }
  }
  React.useDebugValue('useGlobalRef')
  const forceUpdate = useForceUpdate()
  useMountHooks(function (ref, RefMap) {
    RefMap.set(ref.current, {})
    return function (ref) {
      ref.current = null
      ref = null
    }
  }, [testRef, RefMap])
  return [testRef, React.useCallback((nextValue: T) => {
    if (testRef.current) {
      const { value } = testRef.current
      if (value !== nextValue) {
        testRef.current.lastValue = value
        testRef.current.value = nextValue
      }
    }
    forceUpdate()
  }, []), function (callback, deps) {
    return React.useCallback(() => Reflect.apply(callback, testRef.current, concat([testRef.current.value], deps)), deps || [])
  }]
}


export type UseRefCallbackReturns<T> = [T, (next: T) => IDisposer, SafeCallbackFactory<T>]

/**
 * 
 */
export function useRefCallback<T>(): UseRefCallbackReturns<T> {
  const [ref, setRef, useCallback] = useSafeRef<T>()
  // const [current, setRef] = React.useReducer(aaa, init)
  // useUnmount(() => {
  //   console.error('get ref callback unmount');
  // })
  const getRef = React.useCallback(function (instance) {
    setRef(instance)
    // console.error('get ref callback', instance);
    return function () {
      // console.error('get ref callback unmount2');
      setRef(null)
      // instance = null
    }
  }, [])
  return [
    ref.current.value,
    getRef,
    useCallback
  ]
}

type SafeStoreOptions<T> = {
  storeRef?: UseRefCallbackReturns<T>[1]
}
type SafeStoreUtils<T> = {
  useCallback?: UseRefCallbackReturns<T>[2];
  useObserver<R>(fn: (store: T) => R, deps?: any[], useName?: string): R;
  useComputedChild?: (fn: (store: T) => any, deps?: any[]) => any;
}
export type UseSafeStoreProviderReturns<T> = [SafeStoreUtils<T>, UseSafeRefReturns<T>[0]]
export function useSafeStoreProvider<T extends IKeyValueMap = IKeyValueMap, P = any>(
  initValue: T | ((initParamaters?: P) => T),
  initParamaters?: P,
  options: SafeStoreOptions<T> = {}
): UseSafeStoreProviderReturns<T> {
  const refs = useSafeRef(initValue, initParamaters)
  useMountHooks(({ storeRef }, [ref]) => Utils.isFunction(storeRef) && storeRef(ref.current.value), [options, refs])
  const utils = React.useMemo(() => ({
    useCallback: refs[2],
    useObserver(fn: (store: T) => any, deps: readonly any[] = [], useName: string) {
      const memoFn = React.useCallback(fn, deps)
      return useObserver(() => Reflect.apply(memoFn, null, [refs[0].current.value]), useName, {})
    },
    useComputedChild(fn: (store: T) => any, deps: readonly any[] = []) {
      const memoFn = React.useCallback(fn, deps)
      return React.createElement(Observer, {}, () => Reflect.apply(memoFn, null, [refs[0].current.value]))
    }
  }), [refs[0]])
  const provider = React.useMemo(() => Object.freeze([
    utils,
    refs[0]
  ]), [refs[0], utils])
  return provider as any
}

const stubArray = Utils.stubArray()
export function useUnmount(componentWillUnmount: () => void, deps: readonly any[] = stubArray) {
  return React.useEffect(() => componentWillUnmount, stubArray)
}

export function useMountHooks<Args extends HashItemList>(mountedWithUnmount: (...args: Args) => (...args: Args) => void, deps?: Args): void;
export function useMountHooks(mountedWithUnmount: Function, deps = stubArray) {
  const unmount = React.useRef(null)
  let params = React.useRef(deps)
  React.useEffect(() => {
    params.current = deps
  })
  useUnmount(() => {
    if (Utils.isFunction(unmount.current)) {
      unmount.current(...params.current)
    }
    params.current = []
    params = null
  })
  return React.useLayoutEffect(() => {
    unmount.current = mountedWithUnmount(...params.current)
  }, stubArray)
}

const factory = <T>(lastValue: React.MutableRefObject<T>, isEquals?: ((a: any, b: any) => boolean) | boolean) => {
  return isEquals === false
    ? (function () { return true })
    : (
      Utils.isFunction(isEquals)
        ? (function (nextValue: T) { return (isEquals as Function)(lastValue, nextValue) })
        : (function (nextValue: T) { return lastValue.current !== nextValue })
    )
}

type DiffCreaterHandler<T> = (nextValue: T) => any
/**
 * 函数工厂
 * @param equals 缓存过的比较函数
 * @param lastValue 最后值的react.ref
 */
function diffCreater<T>(equals: (nextValue: T) => any, lastValue: React.MutableRefObject<T>) {
  return function (nextValue: T) {
    const r = equals(nextValue);
    if (r) {
      lastValue.current = nextValue;
    }
    return r;
  };
}

type UseDiffProp<T> = {
  last: T,
  differ: DiffCreaterHandler<T>
}
export function usePropDiffer<T>(isEquals?: ((a: any, b: any) => boolean) | boolean): UseDiffProp<T> {
  const lastValue = React.useRef<T>(null)
  const equals = React.useMemo(() => factory(lastValue, isEquals), [isEquals])
  return {
    last: lastValue.current,
    differ: diffCreater<T>(equals, lastValue)
  }
}

type componentWillReciveProps<T> = (nextValue: T, lastValue: T) => void | (() => any)


function usePropsReciveFactory<T = any>(differ: DiffCreaterHandler<T>, nextValue: T, last: T, componentWillReciveProps: componentWillReciveProps<T>) {
  if (differ(nextValue)) {
    return componentWillReciveProps(nextValue, last)
  }
}

export function usePropsRecive<T = any, D extends [T, ...any[]] = [T]>(componentWillReciveProps: componentWillReciveProps<D[0]>, nextValueAndDeps: D) {
  const { last, differ } = usePropDiffer<T>(true)
  const callback = React.useCallback(
    function PropsReciveCallback() {
      return usePropsReciveFactory<T>(differ, nextValueAndDeps[0], last, componentWillReciveProps)
    },
    [differ, last, componentWillReciveProps].concat(nextValueAndDeps)
  )
  React.useLayoutEffect(
    callback,
    [differ, last, componentWillReciveProps].concat(nextValueAndDeps)
  )
}

export function usePropsReciveSync<T = any>(componentNextPropsRecive: componentWillReciveProps<T>, nextValue: T) {
  const { last, differ } = usePropDiffer<T>(false)
  if (differ(nextValue)) {
    return componentNextPropsRecive(nextValue, last)
  }
}
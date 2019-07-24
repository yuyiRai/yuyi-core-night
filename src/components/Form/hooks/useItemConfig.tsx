import { useLocalStore, useUnmount } from '@/hooks';
import { ItemConfig } from '@/stores';
import { OptionsStore } from '@/stores/ItemConfig/OptionsStore';
import { IKeyValueMap, runInAction, set } from 'mobx';
import { ITransformer } from 'mobx-utils';
import * as React from 'react';
import { Utils } from 'yuyi-core-utils';
import { FormStoreContext } from './useCommonForm';

export type ItemConfigContext = { code: string, pipe?: (itemConfig: ItemConfig) => any }
export const FormItemConfigContext = React.createContext<ItemConfigContext>({ code: null })

export function useFormItemConfig<V = any, FM extends IKeyValueMap = IKeyValueMap>(): { itemConfig: ItemConfig<V, FM> } {
  const [{ useObserver }, ref] = React.useContext(FormStoreContext)
  const { code, pipe = (a: any) => a } = React.useContext(FormItemConfigContext)
  const current = React.useRef({
    itemConfig: pipe(ref.current.value.useItemStore(code).itemConfig),
    useObserver
  })
  useUnmount(() => {
    current.current = null
  }, [current])
  return current.current
}
export type ReturnMapType<T extends IKeyValueMap> = { [K in keyof T]: ReturnType<T[K]> }
export type ComputedMap<T extends ComputedMap = any> = IKeyValueMap<(this: ILiteSearchStore<T>) => any>
export interface ILiteSearchStore<T extends ComputedMap = any> extends IUseSearchStoreOptions<T> {
  searchStore: IUseSearchStoreOptions<T>['itemConfig']['searchStore'];
  optionsStore: IUseSearchStoreOptions<T>['itemConfig']['optionsStore'];
  code: IUseSearchStoreOptions<T>['itemConfig']['code'];
  type: IUseSearchStoreOptions<T>['itemConfig']['type'];
  destory(): any;
  append(key: keyof T, value: ReturnType<T[typeof key]>): void;
  [k: string]: any;
}
export type LiteSearchStore<T extends ComputedMap<T> = any> = ILiteSearchStore<T> & ReturnMapType<T>

export interface IUseSearchStoreOptions<T extends ComputedMap<T> = ComputedMap> {
  transformer?: ITransformer<OptionsStore<any, any>, any[]>,
  itemConfigContext?: { itemConfig: ItemConfig },
  itemConfig?: ItemConfig,
  computedMap?: T,
  ref?: React.MutableRefObject<any>
  callback?: React.MutableRefObject<{ callback: (key: string) => any }>
}


const mapper = new WeakMap();
(window as any).mappermapper = mapper

function searchStoreCreater<T extends ComputedMap>({ itemConfigContext, transformer, computedMap }: IUseSearchStoreOptions<T>): LiteSearchStore<T> {
  // console.error('searchStoreCreater');
  const base = {
    itemConfig: itemConfigContext.itemConfig,
    code: itemConfigContext.itemConfig.code,
    type: itemConfigContext.itemConfig.type,
    computedMap: {} as T,
    transformer,
    get searchStore(): ItemConfig['searchStore'] {
      if (this.itemConfig) {
        const store = this.itemConfig.useSearchStore(this.transformer)
        // console.error(Object.getOwnPropertyDescriptors(store))
        // return new Proxy(store, {
        //   get: (target, key, receiver) => {
        //     const value = Reflect.get(target, key, receiver)
        //     // console.error(target, key, receiver, value);
        //     return Utils.isFunction(value) ? ((...args) => value(...args)) : value
        //   }
        // })
        return store
      }
    },
    set searchStore(v: ItemConfig['searchStore']) {
      this.itemConfig && this.itemConfig.useSearchStore(v)
    },
    get optionsStore(): ItemConfig['optionsStore'] {
      return this.searchStore && this.searchStore.itemConfig.optionsStore
    },
    destory() {
      runInAction(() => {
        for (const key in this.computedMap) {
          Reflect.deleteProperty(this, key)
        }
        this.computedMap = null
        this.itemConfig = null
      })
    },
    append(key: keyof T, value: any) {
      set(this, key, value)
    },
    ...computedMap
  }
  for (const key in computedMap) {
    (base as any).computedMap[key] = computedMap[key]
  }
  return base as any
}

type Creater<T> = T | (() => T)
export function useSearchStore<T extends ComputedMap, O extends IUseSearchStoreOptions<T>>(options: Creater<O & { computedMap?: T }>) {
  const state: IUseSearchStoreOptions<T> = React.useMemo(() => Utils.isFunction(options) ? options() : options, [])
  const { transformer, computedMap = {} as O } = state
  let store = useLocalStore(searchStoreCreater, { transformer, computedMap, itemConfigContext: useFormItemConfig() } as IUseSearchStoreOptions<T>)
  let ref = React.useRef(store)
  const callback = React.useCallback((key) => {
    return Reflect.apply(ref.current.computedMap[key], ref.current, [])
  }, [ref])
  const callbackRef = React.useRef(callback);
  React.useEffect(() => {
    (window as any).mappermapper.set(ref.current, ref.current.itemConfig.code)
    const dispose = ref.current.itemConfig.reaction(() => ref.current, (storeRef: typeof ref['current']) => {
      for (const key in ref.current.computedMap) {
        storeRef.append(key, storeRef.searchStore ? callbackRef.current(key) : null)
      }
      storeRef = null
    }, { fireImmediately: true, name: 'useSearchStore-computed' })
    return () => {
      ref.current.destory()
      callbackRef.current = null
      ref.current = null
      dispose()
    }
  }, [ref, callbackRef])
  return ref.current as LiteSearchStore<T>
}
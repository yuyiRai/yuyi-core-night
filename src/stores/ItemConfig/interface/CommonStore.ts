import { EventStoreProvider } from '@/stores/EventStore';
import { autobind } from 'core-decorators';
import { Utils } from '@/utils';
import { difference, forEach, cloneDeep, get, isNil, keys, set, unset } from 'lodash';
import { action, autorun, computed, IArrayChange, IArraySplice, IArrayWillChange, IArrayWillSplice, IAutorunOptions, IComputedValue, IInterceptor, IMapDidChange, IMapWillChange, intercept, IObjectDidChange, IObjectWillChange, IObservableArray, IObservableValue, IReactionDisposer, IReactionOptions, IReactionPublic, ISetDidChange, ISetWillChange, isObservableProp, IValueDidChange, IValueWillChange, Lambda, observable, ObservableMap, ObservableSet, observe, reaction, toJS } from "mobx";
import { createTransformer } from 'mobx-utils';


export const ExportUtils = {
  export: createTransformer(<M extends object>(instance: M): ExportedFormModel<M> => {
    const model: any = {}
    for (const key in instance) {
      model[key] = cloneDeep(toJS(instance[key]));
    }
    model.__isExportObject = true;
    return model;
  })
}

export abstract class CommonStore<M extends CommonStore = any> extends EventStoreProvider {
  @observable private destorySet: Set<IReactionDisposer | Lambda> = new Set<IReactionDisposer | Lambda>();
  @action.bound public reaction(source: (r: IReactionPublic) => {}, callback: (arg: {}, r: IReactionPublic) => void, options?: IReactionOptions): IReactionDisposer {
    return this.registerDisposer(reaction(source, callback, options))
  }

  @action.bound public onceReaction(source: (r: IReactionPublic) => {}, callback: (arg: {}, r: IReactionPublic) => void, options?: IReactionOptions): void {
    const a = this.reaction(source, (arg: {}, r: IReactionPublic) => {
      callback(arg, r);
      a();
    }, options);
  }
  @action.bound public autorun(view: (r: IReactionPublic) => any, opts?: IAutorunOptions): void {
    this.destorySet.add(autorun(view, opts));
  };
  observe<T>(value: IObservableValue<T> | IComputedValue<T>, listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
  observe<T>(observableArray: IObservableArray<T>, listener: (change: IArrayChange<T> | IArraySplice<T>) => void, fireImmediately?: boolean): Lambda;
  observe<V>(observableMap: ObservableSet<V>, listener: (change: ISetDidChange<V>) => void, fireImmediately?: boolean): Lambda;
  observe<K, V>(observableMap: ObservableMap<K, V>, listener: (change: IMapDidChange<K, V>) => void, fireImmediately?: boolean): Lambda;
  observe<K, V>(observableMap: ObservableMap<K, V>, property: K, listener: (change: IValueDidChange<V>) => void, fireImmediately?: boolean): Lambda;
  observe(object: Object, listener: (change: IObjectDidChange) => void, fireImmediately?: boolean): Lambda;
  observe<T, K extends keyof T>(object: T, property: K, listener: (change: IValueDidChange<T[K]>) => void, fireImmediately?: boolean): Lambda;
  @action.bound public observe(a: any, b: any, c?: any, d?: any): Lambda {
    return this.registerDisposer(observe(a, b, c, d))
  }

  private registerDisposer<T extends Lambda | IReactionDisposer>(r: Lambda | IReactionDisposer) {
    this.destorySet.add(r);
    return (() => {
      this.destorySet.delete(r)
      r()
    }) as T;
  }

  intercept<T>(value: IObservableValue<T>, handler: IInterceptor<IValueWillChange<T>>): void;
  intercept<T>(observableArray: IObservableArray<T>, handler: IInterceptor<IArrayWillChange<T> | IArrayWillSplice<T>>): void;
  intercept<K, V>(observableMap: ObservableMap<K, V>, handler: IInterceptor<IMapWillChange<K, V>>): void;
  intercept<V>(observableMap: ObservableSet<V>, handler: IInterceptor<ISetWillChange<V>>): void;
  intercept<K, V>(observableMap: ObservableMap<K, V>, property: K, handler: IInterceptor<IValueWillChange<V>>): void;
  intercept(object: Object, handler: IInterceptor<IObjectWillChange>): void;
  intercept<T extends Object, K extends keyof T>(object: T, property: K, handler: IInterceptor<IValueWillChange<any>>): void;

  @action.bound public intercept(a: any, b: any, c?: any, ): void {
    this.destorySet.add(intercept(a, b, c));
  }
  @action.bound public interceptProperty(object: any, property: string, handler: IInterceptor<IValueWillChange<any>>): void {
    if (isObservableProp(object, property)) {
      this.destorySet.add(intercept(object, property, handler));
    }
  }

  @action.bound public destory() {
    for (const destory of this.destorySet) {
      destory();
    }
    this.destorySet.clear();
    return this;
  }

  protected mapToDiff<T extends object>(map: ObservableMap<any>, source: T, cahce?: T, deepClone?: boolean) {
    // console.log('map', source)
    let useCahce = Utils.isObject(cahce)
    const push = difference(keys(source), Array.from(map.keys()));
    forEach(map.toJSON(), (value, key) => {
      if (isNil(source[key])) {
        map.delete(key)
        if (useCahce) {
          unset(cahce, key)
        }
      } else if (useCahce && !Utils.isEqual(cahce[key], source[key])) {
        cahce[key] = cloneDeep(toJS(source[key]))
        map.set(key, source[key]);
      } else if (!useCahce && !Utils.isEqual(source[key], value)) {
        map.set(key, source[key]);
      }
    });
    // console.log('map push', source)
    forEach(push, key => {
      if(useCahce) {
        cahce[key] = cloneDeep(toJS(source[key]))
        // console.log('useCahce', source[key], cahce[key])
      }
      map.set(key, source[key]);
    });
    return map;
  }

  public objectToDiff(obj: any, source: any) {
    const push = difference(keys(source), keys(obj));
    forEach(obj, (value, key) => {
      if (isNil(source[key]))
        delete obj[key];
      else if (!Utils.isEqual(source[key], value)) {
        obj[key] = source[key];
      }
    });
    forEach(push, key => {
      obj[key] = source[key];
    });
    return obj;
  }

  public registerKey(target: any, key: string, deep: boolean = false) {
    if (!Utils.isNil(key)) {
      const keyDeep = key.split('.');
      // const coreKey = `$$core_${keyDeep[0]}`;
      const resolver = keyDeep[0]
      const defaultV = get(target, resolver, null);
      const d = (deep ? observable : observable.ref);
      d(target, resolver, { value: defaultV, enumerable: false, configurable: true });
      return true
    }
    return false
    // computed.struct(target, keyDeep[0], {
    //   get() { return get(this, coreKey) },
    //   set(value) { set(this, coreKey, value) }
    // })
    // console.log('registerKey', target, key);
  }
  public registerGet(target: any, key: string, getter: any) {
    const keyDeep = key.split('.');
    const resolver = keyDeep.pop()
    if (keyDeep.length > 0) {
      const deepResolver = keyDeep.length > 0 ? keyDeep.join('.') : resolver;
      // const coreKey = `$$core_${keyDeep[0]}`;
      const deepTarget = Utils.isObjectFilter(get(target, deepResolver)) || {};
      computed(deepTarget, resolver, { get: getter, enumerable: false, configurable: true });
      set(target, deepResolver, deepTarget)
    } else {
      computed(target, resolver, { get: getter, enumerable: false, configurable: true });
    }
    // computed.struct(target, keyDeep[0], {
    //   get() { return get(this, coreKey) },
    //   set(value) { set(this, coreKey, value) }
    // })
    // console.log('registerKey', target, key);
  }

  @autobind public safeGet(path: string, defaultValue?: any) {
    return get(this, path, defaultValue);
  }


  @computed public get propertyNameList() {
    return keys(this)
  }

  
  @autobind
  public export(): ExportedFormModel<M> {
    return ExportUtils.export(this) as any
  }
}
export type ExportedFormModel<T> = Partial<T> & {
  __isExportObject: true
}

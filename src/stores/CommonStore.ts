import { EventStore } from '@/stores/EventStore';
import { Utils } from '@/utils';
import { autobind, nonenumerable } from 'core-decorators';
import { cloneDeep, difference, forEach, get, isNil, keys, set, unset } from 'lodash';
import { action, autorun, computed, flow, IArrayChange, IArraySplice, IArrayWillChange, IArrayWillSplice, IAutorunOptions, IComputedValue, IInterceptor, IKeyValueMap, IMapDidChange, IMapWillChange, intercept, IObjectDidChange, IObjectWillChange, IObservableArray, IObservableValue, IReactionDisposer, IReactionOptions, IReactionPublic, ISetDidChange, ISetWillChange, isObservableProp, IValueDidChange, IValueWillChange, Lambda, observable, ObservableMap, ObservableSet, observe, reaction, runInAction, toJS } from "mobx";


function exportWith (exportWith: <M extends object>(value: M[typeof key], key: keyof M, next: any, instance: M) => void) {
  return function<M extends object>(instance: M): ExportedFormModel<M> {
    const model: any = {}
    for (const key in instance) {
      exportWith(instance[key], key, model, instance)
    }
    model.__isExportObject = true;
    return model;
  }
}
export const ExportUtils = {
  exportWith,
  export: exportWith(function(value, key, next) {
    next[key] = cloneDeep(toJS(value))
  }),
  shadowExport: exportWith(function(value, key, next) {
    if (Utils.isObject(value)) {
      next[key] = {}
    } else if(Utils.isFunction(value)) {
      // if (key === 'setOptions'){
      //   debugger
      // }
      next[key] = Utils.stubFunction;
    }
  }) 
}
export type FlowFunction<This, R, Arg1, Arg2, Arg3, Arg4, Arg5> = (this: This, arg1?: Arg1, arg2?: Arg2, arg3?: Arg3, arg4?: Arg4, arg5?: Arg5) => IterableIterator<R>


export abstract class CommonStore<M = any> {
  public name: string | undefined;
  public uuid: string = Utils.uuid()

  @observable
  public commonInstance: IKeyValueMap<{}>;

  @nonenumerable
  protected get $storeKey() {
    return this.name || this.constructor.name
  } 


  @nonenumerable
  @observable
  private destorySet: ObservableSet<IReactionDisposer | Lambda>;
  
  constructor() {
    this.postInit()
  }

  @action 
  protected postInit() {
    // console.error('CommonStore constructor', this.$storeKey);
    this.commonInstance = {}
    let temp: EventStore;
    this.setEventList()
    this.destorySet = observable.set<IReactionDisposer | Lambda>()
    this.reaction(() => this.$eventStore, (store: EventStore) => {
      temp = store
    }, { fireImmediately: true })
    // let c = onBecomeUnobserved(this, '$eventStore', (...args: any[]) => {
    //   this.$eventStore.dispose()
    //   this.$eventStore.unsubscribe()
    //   if (temp) {
    //     temp.dispose()
    //     temp.unsubscribe()
    //     temp = null
    //   }
    //   c()
    // })
    this.registerDisposer((...args: any[]) => {
      this.$eventStore.dispose()
      if (temp) {
        temp.dispose()
        temp.unsubscribe()
        temp = null
      }
      this.setEventList(null)
      // c()
    })
  }

  @nonenumerable
  @observable 
  private $eventList: string[]

  @action
  private setEventList(list: string[] = []) {
    this.$eventList = list;
  }

  @nonenumerable
  @computed
  private get $eventStore() {
    return this.$eventList && new EventStore(this.$eventList, this)
  }

  @action 
  public $on(eventName: string, callback: Function, instance?: any) {
    return this.$eventStore.$on(eventName, callback, instance)
  }

  @action 
  public $emit(eventName: string, ...args: any[]) {
    return this.$eventStore.$emit(eventName, ...args)
  }



  @nonenumerable
  @action('commonStore-reaction-hooks')
  public reaction<T>(source: (r: IReactionPublic) => T, callback: (arg: T, r: IReactionPublic) => void, options?: IReactionOptions): IReactionDisposer {
    return this.registerDisposer(reaction(source, callback, options))
  }

  @nonenumerable
  @action('commonStore-onceReaction-hooks')
  public onceReaction(source: (r: IReactionPublic) => {}, callback: (arg: {}, r: IReactionPublic) => void, options?: IReactionOptions): void {
    const a = this.reaction(source, (arg: any, r: IReactionPublic) => {
      callback(arg, r);
      a();
    }, options);
  }

  @nonenumerable
  @action('commonStore-autorun-hooks')
  public autorun(view: (r: IReactionPublic) => any, opts?: IAutorunOptions): IReactionDisposer {
    return this.registerDisposer(autorun(view, opts));
  };
  observe<T>(value: IObservableValue<T> | IComputedValue<T>, listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
  observe<T>(observableArray: IObservableArray<T>, listener: (change: IArrayChange<T> | IArraySplice<T>) => void, fireImmediately?: boolean): Lambda;
  observe<V>(observableMap: ObservableSet<V>, listener: (change: ISetDidChange<V>) => void, fireImmediately?: boolean): Lambda;
  observe<K, V>(observableMap: ObservableMap<K, V>, listener: (change: IMapDidChange<K, V>) => void, fireImmediately?: boolean): Lambda;
  observe<K, V>(observableMap: ObservableMap<K, V>, property: K, listener: (change: IValueDidChange<V>) => void, fireImmediately?: boolean): Lambda;
  observe(object: Object, listener: (change: IObjectDidChange) => void, fireImmediately?: boolean): Lambda;
  observe<T, K extends keyof T>(object: T, property: K, listener: (change: IValueDidChange<T[K]>) => void, fireImmediately?: boolean): Lambda;
  
  @nonenumerable
  @action('commonStore-observe-hooks')
  public observe(a: any, b: any, c?: any, d?: any): Lambda {
    return this.registerDisposer(observe(a, b, c, d))
  }

  @nonenumerable
  @action('commonStore-registerDisposer-hooks')
  protected registerDisposer<T extends Lambda | IReactionDisposer>(r: T): T {
    this.destorySet.add(action('commonStore-registerDisposer', r));
    return action('commonStore-nativeClear', () => {
      if (!this.destoryFlag) {
        this.destorySet.delete(r)
      }
      // console.error('$registerDisposer');
      r()
      r = null
    }) as any;
  }

  intercept<T>(value: IObservableValue<T>, handler: IInterceptor<IValueWillChange<T>>): Lambda;
  intercept<T>(observableArray: IObservableArray<T>, handler: IInterceptor<IArrayWillChange<T> | IArrayWillSplice<T>>): Lambda;
  intercept<K, V>(observableMap: ObservableMap<K, V>, handler: IInterceptor<IMapWillChange<K, V>>): Lambda;
  intercept<V>(observableMap: ObservableSet<V>, handler: IInterceptor<ISetWillChange<V>>): Lambda;
  intercept<K, V>(observableMap: ObservableMap<K, V>, property: K, handler: IInterceptor<IValueWillChange<V>>): Lambda;
  intercept(object: Object, handler: IInterceptor<IObjectWillChange>): Lambda;
  intercept<T extends Object, K extends keyof T>(object: T, property: K, handler: IInterceptor<IValueWillChange<any>>): Lambda;

  @nonenumerable
  @action('commonStore-intercept-hooks')
  public intercept(a: any, b: any, c?: any, ): Lambda {
    return this.registerDisposer(intercept(a, b, c));
  }

  @nonenumerable
  @action('commonStore-flow-hooks')
  public flow<R, Arg1, Arg2, Arg3, Arg4, Arg5>(
    generator: FlowFunction<this, R, Arg1, Arg2, Arg3, Arg4, Arg5>
  ): FlowFunction<this, R, Arg1, Arg2, Arg3, Arg4, Arg5> {
    return flow(generator as any) as any
  }

  @nonenumerable
  @action('commonStore-interceptProperty-hooks')
  public interceptProperty(object: any, property: string, handler: IInterceptor<IValueWillChange<any>>): Lambda | void {
    if (isObservableProp(object, property)) {
      return this.registerDisposer(intercept(object, property, handler));
    }
  }

  protected destoryFlag = false;

  @action('commonStore-destory')
  public destory() {
    if (!this.destoryFlag) {
      this.destoryFlag = true;
      // console.error(`@${this.$storeKey}.destory(@${this.uuid})`, this.propertyNameList);
      for (const destory of this.destorySet) {
        destory();
      }
      this.destorySet.clear();
      this.destorySet = null;
      let keyList = []
      for (const key of this.propertyNameList) {
        // console.error((this as any).code, key, this[key], Object.getOwnPropertyDescriptor(this, key));
        if (this[key] && Utils.isFunction(this[key] && this[key].destory)) {
          this[key].destory()
          keyList.push(key)
        }
      }
      for (const key in this.commonInstance) {
        this.commonInstance[key] = null
      }
      this.commonInstance = null
      setTimeout((instance: this) => runInAction('destory', () => {
        for(const key of keyList) {
          instance[key] = null
        }
        keyList = null
        instance = null
        // Object.freeze(this)
      }), 0, this); 
    }
    return this;
  }


  protected cloneFormMapToObjWithKeys<T extends object>(map: ObservableMap<keyof T, T[keyof T]>, codes: string[]): T {
    const tmp: T = {} as T
    for (const code of codes) {
      this.registerGet(tmp, code, (resolver, deepResolver) => {
        const base = map.get(resolver as keyof T)
        return deepResolver ? Utils.get(base, deepResolver) : base
      }, false)
    }
    return tmp
  }

  @action
  protected mapToDiff<T extends object>(map: ObservableMap<any>, source: T, cahce?: T, deepClone?: boolean) {
    // console.log('map', source)
    let useCahce = Utils.isObject(cahce)
    const push = difference(keys(source), Array.from(map.keys()));
    forEach(map.toJSON(), (value, key) => {
      if (isNil(source[key]) && map.has(key)) {
        // console.log('delete Key', key);
        map.delete(key)
        if (useCahce) {
          unset(cahce, key)
        }
      } else if (useCahce && !Utils.isEqual(cahce[key], source[key])) {
        // console.log('update Key', key, source[key], map.get(key));
        // debugger
        cahce[key] = cloneDeep(toJS(source[key]))
        map.set(key, source[key]);
      } else if (!useCahce && !Utils.isEqual(source[key], value)) {
        // console.log('update Key', key, source[key], map.get(key));
        map.set(key, source[key]);
      }
    });
    // console.log('map push', source)
    forEach(push, key => {
      if (useCahce) {
        cahce[key] = cloneDeep(toJS(source[key]))
        // console.log('useCahce', source[key], cahce[key])
      }
      map.set(key, source[key]);
      // console.log('add Key', key);
    });
    return map;
  }

  @action
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

  @action
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

  /**
   * 注册一个deep get属性
   * @param target 目标对象
   * @param key 属性键名
   * @param getter getter方法
   * @param isComputed 是否使用@computed，传递字符串可以作为computed的name
   */
  @action
  public registerGet(target: any, key: string, getter: (resolver?: string, deepResolver?: string) => any, isComputed: boolean | string = true) {
    const keyDeep = key.split('.');
    const resolver = keyDeep.shift()
    const caller = isComputed ? computed({ name: Utils.isStringFilter(isComputed) }) : Object.defineProperty
    // 嵌套路径单独处理
    if (keyDeep.length > 0) {
      const deepResolver = keyDeep.pop() // 弹出路径最深处的字段
      const deepBaseResolver = keyDeep.concat([resolver]).join('.') // 连接之前的路径字符串
      const deepTarget = Utils.isObjectFilter(get(target, deepBaseResolver)) || {};
      caller(deepTarget, deepResolver, { get: () => getter(deepBaseResolver, deepResolver), enumerable: false, configurable: true });
      set(target, deepBaseResolver, deepTarget)
    } else {
      caller(target, resolver, { get: () => getter(resolver), enumerable: false, configurable: true });
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


  public get propertyNameList() {
    try {
      return keys(this)
    } catch (e) {
      // console.log(e);
      return []
    }
  }


  public export(): ExportedFormModel<M> {
    return ExportUtils.export(this) as any
  }
  public shadowExport(): ExportedFormModel<M> {
    return ExportUtils.shadowExport(this) as any
  }
}
export type ExportedFormModel<T> = Partial<T> & {
  __isExportObject: true
}

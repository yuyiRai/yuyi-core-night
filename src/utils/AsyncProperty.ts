import { autobind } from 'core-decorators';
import { last } from 'lodash';
import { action, computed, extendObservable, observable, reaction, runInAction, ObservableMap, isComputed, getDebugName } from 'mobx';
import { Utils } from '@/utils';

export class AsyncLoadProperty<V = any> {
  @observable.ref type: any;
  @observable.ref defaultValue: V;
  @observable.ref currentValue: V;
  lastParam: any;
  @observable.ref loading = true;
  @observable isInited: boolean;
  @observable.ref getterFunc: Function = () => this.defaultValue
  timeBuffer: number = 0;
  @observable.ref emitter: any = null;

  constructor(type: any, getter: any, defaultValue: V = null, timeBuffer = 0) {
    this.type = type;
    this.reset(defaultValue, true)
    if (timeBuffer > 0) {
      this.timeBuffer = timeBuffer
    }
    this.registerGetter(getter)
    // reaction(() => this.loading, loading => {
    //   console.log('loading change', loading)
    // }, { fireImmediately: true })
    // reaction(() => this.isInited, value => {
    //   console.log('初始化状态变更', value)
    // }, { fireImmediately: true })
    // reaction(() => this.currentValue, value => {
    //   console.log('value change', value)
    // })
  }


  getValue = (param: any) => {
    if (param === this.lastParam) {
      return this.currentValue;
    }
    this.lastParam = param;
    this.valueGetter(param)
    return this.currentValue
  }

  @action.bound reset(nextDefaultValue: V, force?: boolean) {
    if (this.isTypedValue(nextDefaultValue)) {
      this.defaultValue = nextDefaultValue
      this.currentValue = this.defaultValue
      this.isInited = false;
    } else if (force) {
      this.isInited = false;
    }
    return this;
  }

  @action.bound async updateValue(nextValue: V) {
    const value = await nextValue
    console.log('update value', value, this.currentValue)
    if (this.isTypedValue(value)) {
      this.currentValue = value
      if (!this.isInited) {
        this.isInited = true
      }
      this.loadingEnd()
    }
  }
  @action.bound registerGetter(getter: any) {
    this.getterFunc = Utils.isFunctionFilter(getter, this.getterFunc);
  }
  @computed.struct get valueGetter() {
    if (this.timeBuffer > 0) {
      const emitter = Utils.createSimpleTimeBufferInput((resList) => {
        this.updateValue(this.getterFunc(last(resList)))
      }, this, this.timeBuffer, true)
      return action((param) => {
        runInAction(async () => {
          this.loadingStart()
          return emitter(param)
        })
      })
    }
    return action((param) => {
      runInAction(() => {
        this.loadingStart()
        this.updateValue(this.getterFunc(param))
      })
    })
  }

  @action.bound loadingStart() {
    if (!this.loading)
      this.loading = true
  }
  @action.bound loadingEnd() {
    if (this.loading)
      this.loading = false
  }

  @autobind isTypedValue(value: any) {
    if (value == null) {
      return true
    } else if (Utils.isFunction(this.type)) {
      return this.type(value)
    } else {
      const { type } = this
      switch (type) {
        case String: return Utils.isString(value)
        case Boolean: return Utils.isBoolean(value)
        case Array: return Utils.isArray(value)
        case Number: return Utils.isNumber(value)
        default: return value instanceof type
      }
    }
  }
}

function getAsyncPropertyName(propertyName: string) {
  return `$${propertyName}Async`
}
const asyncPropertyNameKey = '__$$$AsyncPropertyName'
const asyncPropertyName = '__$$$AsyncProperty'
const asyncPropertyMapKey = '$$$AsyncPropertyMap'

export type AsyncProperty<V> = V & {
  [asyncPropertyNameKey]: string;
  [asyncPropertyName]: AsyncLoadProperty<V>
}

function createInstance<V>(nextValue: V, asyncName: string, config: AsyncLoadProperty<V>): AsyncProperty<V> {
  Object.defineProperty(nextValue, asyncPropertyNameKey, {
    value: asyncName,
    writable: false,
    enumerable: false
  })
  Object.defineProperty(nextValue, asyncPropertyName, {
    get() { return config },
    enumerable: false
  })
  return nextValue as any;
}
export type AsyncComputedConfig<V> = { type: any, defaultValue: V, watcher: any, time: number }
/**
 * @return { PropertyDecorator }
 */
export function asyncComputed<V = any>({ type, defaultValue, watcher, time }: AsyncComputedConfig<V>): PropertyDecorator {
  /**
   * @type {PropertyDecorator}
   * @param { * } target 
   * @param { string } propertyName 
   * @param { PropertyDescriptor } descriptor
   */
  function Async(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<V>) {
    const asyncName = getAsyncPropertyName(propertyName)
    const { get: getter } = descriptor
    if (getter) {
      descriptor.get = function(): V | AsyncProperty<V> {
        let sourceInstance = this;
        console.log('getter', this, isComputed(this))
        if(!this[asyncPropertyMapKey]) {
          const map = new Map<string, AsyncLoadProperty>()
          extendObservable(this, { get [asyncPropertyMapKey]() { return map } })
        }
        const store: ObservableMap<string, AsyncLoadProperty> = this[asyncPropertyMapKey]
        const asyncConfig: AsyncLoadProperty | undefined = this[asyncName]
        if (!this[asyncName]) {
          const asyncConfig = new AsyncLoadProperty<V>(type, () => Reflect.apply(getter, sourceInstance, []), defaultValue, time)
          extendObservable(this, { get [asyncName]() { return asyncConfig } })
          store.set(asyncName, asyncConfig) 
          if (!Utils.isNil(watcher)) {
            reaction(
              () => this[watcher],
              trigger => {
                asyncConfig.reset(asyncConfig.currentValue).getValue(trigger)
                console.log('trigger update', trigger, this[asyncName])
              },
              { fireImmediately: true }
            )
            reaction(
              () => this[propertyName],
              property => {
                console.log('property update', property, this)
              },
              { fireImmediately: true }
            )
          }
        }
        
        const currentValue = asyncConfig.getValue(this[watcher])
        if(currentValue === defaultValue) {
          console.log('get init value now!')
          return createInstance<V>(Utils.cloneDeep(currentValue), asyncName, asyncConfig)
        } else {
          console.log('get update value now!')
        }
        return currentValue
      }
    }
    return computed(target, propertyName, descriptor);
  }
  return Async as any;
}

export class AsyncPropertyGetter {
  @observable name: string;
  @observable t: any
  @computed get tt(){
    return this.t
  }
  get(t: any, key: string) {
    this.t = t;
    // Reflect.setPrototypeOf(this, Reflect.getPrototypeOf(t))
    return getDebugName(t[key])
  }
}
(window as any).AsyncPropertyGetter = AsyncPropertyGetter;
(window as any).getDebugName = getDebugName;
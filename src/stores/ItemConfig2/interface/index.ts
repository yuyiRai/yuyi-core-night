import { get } from "lodash";
import { IComputedValue, IInterceptor, intercept, IObservableValue, IReactionDisposer, IReactionOptions, IReactionPublic, IValueDidChange, IValueWillChange, Lambda, observable, observe, reaction } from "mobx";
import { ITransformer } from "mobx-utils";
import { OptionBase } from "../../../utils";
import { IEventStoreBase } from "@/stores/EventStore";
import { FilterType, IFormValueTransform } from "../../ItemConfig/input";
import { IDisplayConfig, IDisplayConfigCreater } from "../../ItemConfig/ItemDisplayConfig";
import { ISearchConfig, ISearchConfigCreater } from "../../ItemConfig/SearchStore";
export type FormItemType = "" | "text" | "textArea" | "textarea"
| 'number'
| 'date' | 'dateTime' | 'dateToDate'
| 'select' | 'search'
| 'check' | 'radio' | 'radioOne'
| 'checkOne' | 'switch' | 'address' | 'cascader' | undefined | null | never

export type ComputedProperty<T, M = any> = T | ComputedPropertyConstructor<T, M>
export type ComputedPropertyConstructor<T, M = any> = (form: M, itemConfig?: IItemConfig) => T

export type ItemConfigEventHandler<T, R = void> = (e: T, formSource?: any, config?: IFormItemConfig) => R;
export type ValueAny = any;

export interface IFormItemBase {
  type?: FormItemType;
  code: string | '_';
  nameCode?: string;
  label?: string;
  onChange?: ItemConfigEventHandler<ValueAny>;
}

/**
 * typeof i
 */
export interface IFormItemConstructor<M = any> extends IFormItemBase, ISearchConfigCreater<any, any>, IDisplayConfigCreater<M> {
  [key: string]: ComputedProperty<any, M>
}

export interface IBaseConfig extends IFormItemBase {
  value?: any;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  refConfig?: (...args: any[]) => void
  filter?: FilterType<any>;
  filterToValue?: FilterType<any>;
  transformer?: IFormValueTransform<any> | FilterType<any>;
}

export interface IFormItemConfig extends IBaseConfig, IDisplayConfig<any>, ISearchConfig<any, any> {
  rule?: any[] | string;
  requiredMessage?: string;
  options?: OptionBase[];
  loading?: boolean;
}

export abstract class CommonStore2 {
  destorySet: Set<IReactionDisposer | Lambda> = new Set<IReactionDisposer | Lambda>();
  reaction(source: (r: IReactionPublic) => {}, callback: (arg: {}, r: IReactionPublic) => void, options?: IReactionOptions): void {
    this.destorySet.add(reaction(source, callback, options))
  };
  onceReaction(source: (r: IReactionPublic) => {}, callback: (arg: {}, r: IReactionPublic) => void, options?: IReactionOptions): void {
    const a = reaction(source, (arg: {}, r: IReactionPublic) => {
      callback(arg, r)
      a()
    }, options)
  }
  observe<T = any>(value: IObservableValue<T> | IComputedValue<T>, listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): void {
    this.destorySet.add(observe(value, listener, fireImmediately))
  }
  intercept(object: any, handler: IInterceptor<IValueWillChange<any>>): void {
    this.destorySet.add(intercept(object, handler))
  }
  interceptProperty(object: any, property: string, handler: IInterceptor<IValueWillChange<any>>): void {
    this.destorySet.add(intercept(object, property, handler))
  }
  destory() {
    for (const destory of this.destorySet) {
      destory()
    }
    this.destorySet.clear();
  }
  public registerKey(target: any, key: string, deep: boolean = false) {
    const keyDeep = key.split('.');
    // const coreKey = `$$core_${keyDeep[0]}`;
    const resolver = keyDeep[0]
    const defaultV = get(target, resolver, null);
    const d = (deep ? observable : observable.ref);
    d(target, resolver, { value: defaultV, enumerable: false, configurable: true });
    // computed.struct(target, keyDeep[0], {
    //   get() { return get(this, coreKey) },
    //   set(value) { set(this, coreKey, value) }
    // })
    // console.log('registerKey', target, key);
  }
}

export interface IItemConfig extends IFormItemConfig, IEventStoreBase, CommonStore2 {
  i?: IFormItemConstructor;
  form: any;
  formSource?: any;
  setOptions(options: any): void;
  setLoading(loading: boolean): void;
  [key: string]: any;
}

export type BaseItemConfigTransformer<T = any> = ITransformer<IItemConfig, T>
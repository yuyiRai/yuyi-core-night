/* eslint-disable */
import { action, computed, IKeyValueMap, IValueDidChange, observable, toJS, IValueWillChange } from 'mobx';
import { FormStore } from '../FormStore';
import { EventStoreInject } from '@/stores/EventStore';
import { IItemConfig, BaseItemConfigTransformer } from './interface';
import { ItemConfigBase2 } from './ItemConfigBase';
import { SearchStore } from '../ItemConfig/SearchStore';
import { ITransformer, createTransformer } from 'mobx-utils';
import { get } from 'lodash';
import { OptionsStore2 } from '../SelectAndSearchStore';
import getTransform, { IFormValueTransform, FilterType } from '../ItemConfig/input/FormValueTransform';

export interface IPropertyChangeEvent<T = any> extends IValueDidChange<T> {
  name: string;
}

@EventStoreInject(['options-change'])
export class ItemConfig2 extends ItemConfigBase2 implements IItemConfig {
  @observable private static commonTransformerConfig: BaseItemConfigTransformer<FilterType<any>>;
  @action.bound public static setCommonTransformerPipe(func: BaseItemConfigTransformer<FilterType<any>>) {
    this.commonTransformerConfig = func;
  }
  @computed public static get commonTransformer(): BaseItemConfigTransformer<FilterType<any>> {
    return createTransformer<IItemConfig, FilterType<any>>(
      this.commonTransformerConfig || function ({ type, multiple }: IItemConfig) {
        if (['select', 'search'].includes(type) && multiple) {
          return 'group'
        }
        return ({
          'check': 'group',
          'checkOne': {
            F2V: (v: any) => v === '1',
            V2F: (v: any) => {
              return v===true ? '1' : '0'
            }
          }
        })[type];
      }
    )
  }

  [key: string]: any;
  @observable.ref form: IKeyValueMap = {};

  @observable $version = 0
  // @observable loading = false;


  @observable searchStore: SearchStore<any, any>;
  @action.bound setSearchStore(searchStore: SearchStore<any, any>) {
    this.searchStore = searchStore
  }
  @action.bound useSearchStore<T>(transformer?: ITransformer<OptionsStore2, T[]>, config: ItemConfig2 = this) {
    const store = this.searchStore || new SearchStore(config as any)
    this.setSearchStore(store)
    this.useOptionsStore(transformer, config)
    return store;
  }

  @computed get formValueTransform(): IFormValueTransform<any> {
    return getTransform(this.code, this.transformer)
  }
  @computed get transformer() {
    return this.i.transformer || ItemConfig2.commonTransformer(this)
  }
  @computed get form2Value() {
    const { filter } = this.i
    return Utils.isFunctionFilter(filter, this.formValueTransform.F2V)
  }
  @computed get value2Form() {
    const { filterToValue } = this.i
    return Utils.isFunctionFilter(filterToValue, this.formValueTransform.V2F)
  }

  @computed get currentComponentValue() {
    return this.form2Value(this.currentValue)
  }
  
  @observable OptionsStore2: OptionsStore2;
  @action.bound useOptionsStore<T>(transformer?: ITransformer<OptionsStore2, T[]>, config: IItemConfig = this) {
    const store = this.OptionsStore2 || new OptionsStore2(config as any, transformer)
    this.OptionsStore2 = store
    return store;
  }
  
  @computed private get keyCode() {
    return this.code.split('.')[0]
  }
  @computed private get keyInnerCode() {
    return this.keyCode!==this.code ? this.code.replace(this.keyCode+'.','') : undefined
  }

  @observable.ref formStore: FormStore;
  @action.bound setFormStore(formStore: FormStore) {
    this.formStore = formStore
    this.interceptProperty(this.formStore.formSource, this.keyCode, (event: IValueWillChange<any>) => {
      console.log(event, event.newValue, get(event.object, this.keyInnerCode), this.keyCode, this.keyInnerCode)
      return event
    })
  }
  @computed.struct get formSource() {
    // console.log('this.formStore', this.formStore && this.formStore.formSource);
    return (this.formStore && this.formStore.lastFormSource) || this.form
  }

  constructor(initModel: any, form: any = {}, componentProps: any = {}) {
    super(initModel, form, componentProps)
  }

  export() {
    const model:any = {}
    for (const key of this.iKeys) {
      model[key] = this[key]
    }
    model.__isExportObject = true
    return toJS(model);
  }

}
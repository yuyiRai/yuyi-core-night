/* eslint-disable */
import { action, computed, IKeyValueMap, IValueDidChange, observable } from 'mobx';
import { createTransformer, ITransformer } from 'mobx-utils';
import { FormStore } from '../../components';
import { EventStoreInject } from '@/stores/EventStore';
import getTransform, { FilterType, IFormValueTransform, IFormValueTransformHandler } from './input/FormValueTransform';
import { BaseItemConfigTransformer, IItemConfig, FormModel } from './interface/ItemConfig';
import { ItemConfigBase } from './ItemConfigBase';
import { DisplayConfig } from './ItemDisplayConfig';
import { OptionsStore } from './OptionsStore';
import { SearchStore } from './SearchStore';
import { Utils } from '@/utils';
// export const Ke = keys<DisplayConfig<any>>();
export interface IPropertyChangeEvent<T = any> extends IValueDidChange<T> {
  name: string;
}
// export const a = keys<ItemConfig>()
@EventStoreInject(['options-change'])
export class ItemConfig<V = any, FM = FormModel> extends ItemConfigBase<V, FM> implements IItemConfig<FM, V> {

  @observable 
  private static commonTransformerConfig: BaseItemConfigTransformer<FormModel>;

  @action.bound 
  public static setCommonTransformerPipe(func: BaseItemConfigTransformer<FormModel>) {
    this.commonTransformerConfig = func;
  }

  @computed 
  public static get commonTransformer(): BaseItemConfigTransformer<any, any> {
    return createTransformer<IItemConfig<any>, FilterType<any>>(
      this.commonTransformerConfig ||
      (function ({ type, multiple, filter, filterToValue }: IItemConfig<any>): FilterType<any> {
        if (filter && filterToValue) {
          if(filter === filterToValue && !Utils.isFunction(filter)) {
            return filter
          }
          return {
            F2V: filter,
            V2F: filterToValue
          } as any
        }
        if (['select', 'search'].includes(type) && multiple) {
          return 'group'
        }
        return ({
          'check': 'group',
          'checkOne': {
            F2V: (v: any) => v === '1',
            V2F: (v: any) => {
              return v === true ? '1' : '0'
            }
          },
          'group': {
            F2V: (v: any) => Utils.isObjectFilter(v) || {},
            V2F: (v: any) => Utils.isObjectFilter(v) || {}
          }
        })[type];
      })
    )
  }

  [key: string]: any;

  @observable 
  public $version = 0
  // @observable loading = false;


  @observable 
  private displayConfig = new DisplayConfig<FM>(this, this.formStore)
  
  @computed
  public get displayProps(): DisplayConfig<FM> {
    return this.displayConfig
  }

  @observable 
  public searchStore: SearchStore<V, FM>;
  @action.bound 
  public setSearchStore(searchStore: SearchStore<V, FM>) {
    this.searchStore = searchStore
  }
  @action.bound 
  public useSearchStore<T>(transformer?: ITransformer<OptionsStore, T[]>, config: ItemConfig<V, FM> = this) {
    const store = this.searchStore || new SearchStore(config)
    this.setSearchStore(store)
    this.useOptionsStore(transformer, config)
    return store;
  }

  @computed 
  public get formValueTransform(): IFormValueTransform<FM> {
    return getTransform(this.code, this.transformer)
  }

  @computed 
  public get transformer(): FilterType<FM, V> {
    return this.i.transformer || ItemConfig.commonTransformer(this)
  }

  @computed 
  public get form2Value(): IFormValueTransformHandler<FM> {
    const { filter } = this.i
    return Utils.isFunctionFilter(filter, this.formValueTransform.F2V)
  }
  @computed  
  public get value2Form(): IFormValueTransformHandler<FM> {
    const { filterToValue } = this.i
    return Utils.isFunctionFilter(filterToValue, this.formValueTransform.V2F)
  }

  @computed 
  public get currentComponentValue() {
    return this.form2Value(this.currentValue, this.formSource)
  }

  @computed.struct  
  public get computed() {
    return Utils.isFunction(this.i.computed) && this.getComputedValue('computed')
  }
  @computed  
  public get isComputedEnable(): boolean {
    return this.computed !== false;
  }

  @observable  
  public optionsStore: OptionsStore<V>;
  @action.bound  
  public useOptionsStore<T>(transformer?: ITransformer<OptionsStore, T[]>, config: IItemConfig<FM, V> = this): OptionsStore<V> {
    const store = this.optionsStore || new OptionsStore<V, T>(config, transformer)
    this.optionsStore = store
    return store;
  }

  @observable  
  public childrenConfig: IKeyValueMap<ItemConfig<V, FM>> = {}
  public log(message: string) {
    console.log(message)
    return this
  }
  constructor(initModel: any, form: any = {}, componentProps: any = {}, formStore?: FormStore) {
    super(initModel, form, componentProps)
    this.setFormStore(formStore)
    this.autorun(() => {
      if (this.formStore && this.isComputedEnable && this.computed !== this.currentValue) {
        this.formStore.setFormValue(this.code, this.computed)
      }
    })
    this.reaction(() => this.children, children => {
      if (children !== false) {
        for (const key in children) {
          if (this.childrenConfig[key] instanceof ItemConfig) {
            this.childrenConfig[key].setFormStore(this.formStore)
          } else {
            this.childrenConfig[key] = new ItemConfig(this.children[key], this.formSource, this.componentProps, this.formStore)
            this.childrenConfig[key].setParentConfig(this)
          }
        }
      } else {
        this.childrenConfig = {}
      }
    }, { fireImmediately: true })
    this.autorun(async () => {
      const { i } = this;
      if (i.autorunMethod) {
        try {
          await i.autorunMethod(this.currentComponentValue, this.formStore, this)
        } catch (e) {
          console.error(e)
        }
      }
    }, { delay: 0 })
  }
}


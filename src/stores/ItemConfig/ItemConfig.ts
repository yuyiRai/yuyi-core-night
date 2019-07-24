/* eslint-disable */
import { Utils } from '@/utils';
import { action, computed, IKeyValueMap, IValueDidChange, observable } from 'mobx';
import { ITransformer } from 'mobx-utils';
import { FormStore } from '../../components';
import getTransform, { FilterType, IFormValueTransform, IFormValueTransformHandler } from './input/FormValueTransform';
import { BaseItemConfigTransformer, FormModel, IItemConfig } from './interface/ItemConfig';
import { ItemConfigBase } from './ItemConfigBase';
import { DisplayConfig } from './ItemDisplayConfig';
import { OptionsStore } from './OptionsStore';
import { SearchStore } from './SearchStore';
// export const Ke = keys<DisplayConfig<any>>();
export interface IPropertyChangeEvent<T = any> extends IValueDidChange<T> {
  name: string;
}
// export const a = keys<ItemConfig>()
// @EventStoreInject(['options-change'])
export class ItemConfig<V = any, FM = FormModel> extends ItemConfigBase<V, FM> implements IItemConfig<FM, V> {
  name: string = 'ItemConfig'

  itemConfig: never;
  @observable.ref
  public uuid = Utils.uuid()

  @observable.ref
  private static commonTransformerConfig: BaseItemConfigTransformer<FormModel>;

  @action
  public static setCommonTransformerPipe(func: BaseItemConfigTransformer<FormModel>) {
    this.commonTransformerConfig = func;
  }

  @computed
  public static get commonTransformer(): BaseItemConfigTransformer<any, any> {
    return this.commonTransformerConfig ||
      (function ({ type, multiple, filter, filterToValue }: IItemConfig<any>): FilterType<any> {
        if (filter && filterToValue) {
          if (filter === filterToValue && !Utils.isFunction(filter)) {
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
  }

  [key: string]: any;

  @observable.ref
  public $version = 0
  // @observable loading = false;


  @observable.ref
  public displayProps: DisplayConfig<FM>;

  @action.bound
  public initDisplayProps() {
    this.displayProps = new DisplayConfig<FM>(this, this.formStore)
    this.registerDisposer(() => {
      this.displayProps = null
    })
  }

  @observable.ref
  public searchStore: SearchStore<V, FM>;
  @observable.ref
  public optionsStore: OptionsStore<V>;

  @action.bound
  public setSearchStore(searchStore?: SearchStore<V, FM>) {
    if (!(searchStore instanceof SearchStore) && this.searchStore) {
      this.searchStore.destory()
      this.searchStore = null
    }
    this.searchStore = searchStore
  }

  @action.bound
  public setOptionsStore(optionsStore?: OptionsStore<V>) {
    if (!(optionsStore instanceof OptionsStore) && this.optionsStore) {
      this.optionsStore.destory()
      this.optionsStore = null
    }
    this.optionsStore = optionsStore
  }

  @action.bound
  public useOptionsStore<T>(transformer?: ITransformer<OptionsStore, T[]>, config: IItemConfig<FM, V> = this): OptionsStore<V> {
    if (!this.optionsStore && !this.destoryFlag) {
      this.setOptionsStore(new OptionsStore<V, T>(config, transformer))
      this.registerDisposer(this.setOptionsStore)
    }
    return this.optionsStore;
  }

  @action.bound
  public useSearchStore<T>(transformer?: ITransformer<OptionsStore, T[]>, config: ItemConfig<V, FM> = this) {
    if (!this.searchStore && !this.destoryFlag) {
      this.setSearchStore(new SearchStore(config))
      this.useOptionsStore(transformer, config)
      this.registerDisposer(this.setSearchStore)
    }
    return this.searchStore
  }

  @computed
  public get formValueTransform(): IFormValueTransform<FM> {
    return getTransform(this.code, this.transformer)
  }

  @computed
  public get transformer(): FilterType<FM, V> {
    return this.i.transformer || ItemConfig.commonTransformer(this)
  }

  public get form2Value(): IFormValueTransformHandler<FM> {
    const { filter } = this.i
    return Utils.isFunctionFilter(filter, this.formValueTransform.F2V)
  }

  public get value2Form(): IFormValueTransformHandler<FM> {
    const { filterToValue } = this.i
    return Utils.isFunctionFilter(filterToValue, this.formValueTransform.V2F)
  }

  @computed
  public get currentComponentValue() {
    return this.form2Value(this.currentValue, this.formSource)
  }

  @computed
  public get computed() {
    // trace()
    return Utils.isFunction(this.i.computed) && this.getComputedValue('computed')
  }
  @computed
  public get isComputedEnable(): boolean {
    return this.computed !== false;
  }

  @observable
  public childrenConfig: IKeyValueMap<ItemConfig<V, FM>> = {}

  constructor(initModel: any, form: any = {}, componentProps: any = {}, formStore?: FormStore) {
    super(initModel, form, componentProps)
    this.initDisplayProps()
    this.setFormStore(formStore)
    // this.autorun(() => {
    //   console.log('computed')
    //   if (this.formStore && this.isComputedEnable && this.computed !== this.currentValue) {
    //     this.formStore.setFormValue(this.code, this.computed)
    //   }
    // })
    this.reaction(() => this.children, children => {
      if (children !== false) {
        for (const key in children) {
          if (this.childrenConfig[key] instanceof ItemConfig) {
            this.childrenConfig[key].setFormStore(this.formStore)
          } else {
            this.childrenConfig[key] = new ItemConfig(this.children[key], this.formSource, this.componentProps, this.formStore)
            this.childrenConfig[key].setParentConfig(this)
          }
          this.registerDisposer(() => {
            this.childrenConfig[key].destory()
          })
        }
      } else {
        this.childrenConfig = {}
      }
    }, { fireImmediately: true })
    this.reaction(() => this.currentComponentValue, (value) => {
      const { i } = this;
      if (i.autorunMethod) {
        try {
          action('autorunMethod', i.autorunMethod)(value, this.formStore, this)
        } catch (e) {
          console.error(e)
        }
      }
    }, { delay: 0 })
  }
}


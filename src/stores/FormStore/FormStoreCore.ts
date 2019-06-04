import { autobind } from 'core-decorators';
import { action, computed, IKeyValueMap, IMapDidChange, observable, ObservableMap, runInAction, Lambda } from 'mobx';
import { EventStoreInject } from '@/stores/EventStore';
import { unset } from 'lodash'
import { isNotEmptyArray } from '@/utils';
import { FormModel } from '../../components/Form/Interface/FormItem';
import { IFormItemStoreCore } from "./FormItemStoreBase";
import { GFormStore } from './GFormStore';
import { Utils } from '@/utils';
import { ConfigInit, ItemConfigGroupStore } from './ItemConfigGroupStore';
import produce from 'immer';

export type onItemChangeCallback = (code: string, value: any) => void

@EventStoreInject(['onItemChange'])
export class FormStoreCore<FM extends FormModel, VM extends IFormItemStoreCore = any> extends GFormStore {
  @observable
  configStore: ItemConfigGroupStore<FM> = new ItemConfigGroupStore<FM>(this);
  formSourceListerner: Lambda;

  @action.bound clearValidate() {
    this.errorGroup.clear()
  }
  @computed get allFormMap() {
    return GFormStore.formMap
  }
  constructor(config?: ConfigInit<FM>) {
    super();
    this.setConfig(config)
    this.observe(this.formMap, change => {
      // console.log('change', change)
      if(change.type==='update' || change.type==='add')
        this.formSource[change.name] = change.newValue
      if(change.type==='delete')
        unset(this.formSource, change.name)
    })
  }
  @action.bound setConfig<V>(config: ConfigInit<FM, V>) {
    this.configStore.setConfigSource(config)
  }
  
  @observable.shallow formMap: ObservableMap<keyof FM, any> = observable.map({}, { deep: false });
  @observable.ref lastFormSource: FM = {} as FM
  @observable.struct formSource: FM = {} as FM

  formCache: FM = {} as FM;

  @action.bound setForm(formSource: FM): void {
    const lastCahce = Utils.cloneDeep(Utils.toJS(this.formCache))
    const nextCache = produce(lastCahce, cache => {
      this.mapToDiff(this.formMap, formSource, cache)
    })
    if(nextCache !== lastCahce) {
      this.formCache = Utils.cloneDeep(nextCache)
      this.lastFormSource = formSource;
    }

    this.clearValidate()
  }

  @action.bound replaceForm(formMap: ObservableMap<string, any>) {
    this.formMap = formMap;
  }
  @action.bound registerFormKey(target: any, deep: boolean = false) {
    for (const code of this.configStore.itemCodeList) {
      this.registerKey(target, code, deep)
    }
    for (const code in this.configStore.itemCodeNameMap) {
      const nameCode = this.configStore.itemCodeNameMap[code]
      this.registerGet(target, nameCode, () => {
        return this.getValueWithName(code, nameCode)
      })
    }
    return
  }
  @autobind getValueWithName(code: string, nameCode: string) {
    const itemConfig = this.configStore.getItemConfig(code)
    const { optionsStore } = itemConfig
    // debugger
    if (optionsStore && Utils.isNotEmptyString(nameCode) && nameCode !== code) {
      return optionsStore.selectedLablesStr;
    }
    return undefined
  }

  @observable formItemStores: IKeyValueMap<IFormItemStoreCore<FM, any>> = {}
  @action.bound registerItemStore<V>(code: string, init: () => VM): IFormItemStoreCore<FM, V> {
    // console.log('registerForm', form)
    // debugger
    this.formItemStores[code] = this.formItemStores[code] || init()
    // this.registerForm(this.formSource, code, this.formItemStores[code].itemConfig)
    return this.formItemStores[code]
  }

  
  @autobind onItemChange(callback: onItemChangeCallback) {
    this.$on('onItemChange', callback, this)
  }
  @autobind onItemChangeEmit(code: string, value: any) {
    this.$emit('onItemChange', code, value)
  }

  
  @observable.ref errorTack: IMapDidChange[] = []
  @observable.shallow errorGroup: ObservableMap<string, Error[] | undefined> = observable.map({}, { deep: false });
  @computed.struct get errors() { return this.errorGroup.toPOJO() }
  @autobind getErrors(itemKey: string) { return this.errorGroup.get(itemKey) }
  @autobind hasErrors(itemKey: string) { return this.errorGroup.has(itemKey) }
  @autobind updateError(itemKey: string, errors?: Error[] | undefined) {
    const nextError = isNotEmptyArray(errors) ? errors : null
    if (!Utils.isEqual(this.errorGroup.get(itemKey), nextError, true)) {
      runInAction(() => nextError ? this.errorGroup.set(itemKey, nextError) : this.errorGroup.delete(itemKey))
    }
  }
}

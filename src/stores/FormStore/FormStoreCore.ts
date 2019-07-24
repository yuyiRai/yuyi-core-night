import { isNotEmptyArray, Utils } from '@/utils';
import { autobind } from 'core-decorators';
import produce from 'immer';
import { unset } from 'lodash';
import { action, computed, IKeyValueMap, IMapDidChange, Lambda, observable, ObservableMap, runInAction } from 'mobx';
import { FormModel } from '../ItemConfig';
import { FormItemStoreCore, IFormItemStoreConstructor } from "./FormItemStoreBase";
import { GFormStore } from './GFormStore';
import { ConfigInit, ItemConfigGroupStore } from './ItemConfigGroupStore';

export type onItemChangeCallback = (code: string, value: any) => void

// @EventStoreInject(['onItemChange'])
export class FormStoreCore<FM extends FormModel, VM extends IFormItemStoreConstructor<FM> = any> extends GFormStore {

  public name: string = 'FormStore'

  @action setUUID(uuid: string) {
    console.error('setuuid');
    this.uuid = uuid
  }

  @observable
  configStore: ItemConfigGroupStore<FM> = new ItemConfigGroupStore<FM>(this);
  formSourceListerner: Lambda;

  /**
   * 下一批待校验的code队列
   */
  @observable validateList = new Set<string>();

  @action clearValidate() {
    this.errorGroup.clear()
  }
  @computed get allFormMap() {
    return GFormStore.formMap
  }
  constructor() {
    super();
    this.observe(this.formMap, change => {
      // console.log('change', change)
      if (change.type === 'update' || change.type === 'add')
        this.formSource[change.name] = change.newValue
      if (change.type === 'delete')
        unset(this.formSource, change.name)
    })
  }


  @observable.ref lastSetConfig: ConfigInit<FM>;

  @action setConfig<V>(config: ConfigInit<FM, V>) {
    if (this.lastSetConfig !== config) {
      this.configStore.setConfigSource(config)
      this.configStore.itemCodeList.forEach(code => this.validateList.add(code))
      this.lastSetConfig = config;
    }
  }

  @observable.shallow formMap: ObservableMap<keyof FM, any> = observable.map({}, { deep: false });
  @observable.ref lastFormSource: FM = {} as FM
  @observable.struct formSource: FM = {} as FM


  /**
   * 克隆自formMap的对象，取到对应字段时才触发reaction
   */
  @computed get formsourceCloneFromMap() {
    // trace()
    return this.cloneFormMapToObjWithKeys(this.formMap, this.configStore.itemCodeList)
  }

  formCache: FM = {} as FM;

  @action setForm(formSource: FM): void {
    console.log('setForm', formSource);
    const lastCahce = Utils.cloneDeep(Utils.toJS(this.formCache))
    const nextCache = produce(lastCahce, cache => {
      this.mapToDiff(this.formMap, formSource, cache)
    })
    if (nextCache !== lastCahce) {
      this.formCache = Utils.cloneDeep(nextCache)
      this.lastFormSource = formSource;
    }

    this.clearValidate()
  }

  @action replaceForm(formMap: ObservableMap<string, any>) {
    this.formMap = formMap;
  }
  // @action registerFormKey(target: any, deep: boolean = false) {
  //   for (const code of this.configStore.itemCodeList) {
  //     this.registerKey(target, code, deep)
  //   }
  //   for (const code in this.configStore.itemCodeNameMap) {
  //     const nameCode = this.configStore.itemCodeNameMap[code]
  //     this.registerGet(target, nameCode, () => {
  //       return this.getValueWithName(code, nameCode)
  //     }, `itemConfig@code^nameCode`)
  //   }
  //   return
  // }
  @action.bound getValueWithName(code: string, nameCode: string) {
    const itemConfig = this.configStore.getItemConfig(code)
    const { optionsStore } = itemConfig
    // debugger
    if (optionsStore && Utils.isNotEmptyString(nameCode) && nameCode !== code) {
      return optionsStore.selectedLablesStr;
    }
    return undefined
  }

  @observable formItemStores: IKeyValueMap<FormItemStoreCore<FM, any>> = {}
  @action.bound registerItemStore<T extends FormItemStoreCore<FM, any>>(code: string, Init: VM): T {
    // debugger
    if (!this.formItemStores[code]) {
      console.error('registerForm')
      this.formItemStores[code] = new Init(this, code) as FormItemStoreCore<FM, any>
    }
    // this.formItemStores[code] = this.formItemStores[code] || init
    // this.registerForm(this.formSource, code, this.formItemStores[code].itemConfig)
    return this.formItemStores[code] as any
    // return init
  }
  @action.bound unregisterItemStore(code: string): boolean {
    this.formItemStores[code] = null
    return true;
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

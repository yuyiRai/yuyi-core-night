import { autobind } from 'core-decorators';
import { assign, reduce, values } from 'lodash';
import { action, computed, IKeyValueMap, observable } from 'mobx';
import { CommonStore } from '../CommonStore';
import { FormModel, IFormItemConstructor, ItemConfig } from '../ItemConfig';
import { KeyDataMapStore } from '../ListStore/MapAndListStore';
import { FormStoreCore } from './FormStoreCore';

export type ConfigInit<FM = FormModel, VKeys = any> = IFormItemConstructor<FM, VKeys>[] | IKeyValueMap<IFormItemConstructor<FM, VKeys>>


export class ItemConfigGroupStore<FM = FormModel, VKeys = any> extends CommonStore {
  @observable.ref
  private configSourceMap: KeyDataMapStore<'code', IFormItemConstructor<FM, VKeys>, ItemConfig<VKeys, FM>>;
  @observable.ref
  public store: FormStoreCore<FM>;

  constructor(formStore: FormStoreCore<FM>) {
    super();
    this.store = formStore
    this.configSourceMap = new KeyDataMapStore<'code', IFormItemConstructor<FM, VKeys>, ItemConfig<VKeys, FM>>('code', {
      create: (config) => {
        return new ItemConfig<VKeys, FM>(config, this.store.formSource, this, this.store as any)
      },
      delete(itemConfig) {
        itemConfig.destory()
      },
      update(config, itemConfig) {
        itemConfig.setConfig(config);
        return itemConfig
      }
    })
    this.registerDisposer(() => {
      this.configSourceMap = null
      this.store = null
    })
  }

  @action
  public setConfigSource<V>(configSource: ConfigInit<FM, VKeys>) {
    this.configSourceMap.setSourceData(configSource)
  }

  @computed
  public get itemConfigGroup() {
    return this.configSourceMap.targetData
  }

  public get configList(): ReadonlyArray<IFormItemConstructor<any, VKeys, VKeys>> {
    return this.configSourceMap.sourceValueList
  }

  public get itemConfigConstructorMap(): IKeyValueMap<IFormItemConstructor<FM, VKeys>> {
    return this.configSourceMap.sourceData
  }

  public get itemCodeList() {
    return this.configSourceMap.keyList
  }

  @computed
  public get itemCodeNameMap(): IKeyValueMap<string> {
    console.log('itemCodeNameMap');
    return reduce(this.itemConfigConstructorMap, (obj, config) => {
      return config.nameCode ? assign(obj, {
        [config.code]: config.nameCode
      }) : obj;
    }, {});
  }

  @computed
  public get itemCodeNameList() {
    return values(this.itemCodeNameMap);
  }

  @autobind
  public getConfig(code: string) {
    return this.configSourceMap.getSourceData(code)
  }
  
  @autobind
  public getItemConfig(code: string) {
    return this.configSourceMap.getTargetData(code)
  }
  
}

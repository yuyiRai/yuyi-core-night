import { autobind } from 'core-decorators';
import { assign, reduce, values } from 'lodash';
import { Memoize } from 'lodash-decorators/memoize';
import { action, computed, IKeyValueMap, observable } from 'mobx';
import { ItemConfig } from '@/stores';
import { KeyDataMapStore } from '@/stores/ListStore/MapAndListStore';
import { CommonStore, FormModel, IFormItemConstructor } from '@/stores/ItemConfig/interface';
import { FormStoreCore } from './FormStoreCore';

export type ConfigInit<FM = FormModel, VKeys = any> = IFormItemConstructor<FM, VKeys>[] | IKeyValueMap<IFormItemConstructor<FM, VKeys>>


export class ItemConfigGroupStore<FM = FormModel, VKeys = any> extends CommonStore {
  @observable 
  private configSourceMap: KeyDataMapStore<'code', IFormItemConstructor<FM, VKeys>, ItemConfig<VKeys, FM>>;
  @observable 
  public store: FormStoreCore<FM>;
  
  constructor(formStore: FormStoreCore<FM>) {
    super();
    this.store = formStore
    this.configSourceMap = new KeyDataMapStore<'code', IFormItemConstructor<FM, VKeys>, ItemConfig<VKeys, FM>>('code', {
      create: (config) => {
        return new ItemConfig<VKeys, FM>(config, this.store.formSource, this, this.store as any)
      },
      delete(itemConfig){
        itemConfig.destory()
      },
      update(config, itemConfig) {
        itemConfig.setConfig(config);
        return itemConfig
      }
    })
  }


  @Memoize
  @action.bound
  public setConfigSource<V>(configSource: ConfigInit<FM, VKeys>) {
    this.configSourceMap.setSourceData(configSource)
  }

  @computed
  public get itemConfigGroup() {
    return this.configSourceMap.targetData
  }

  @computed
  public get configList(): readonly IFormItemConstructor<FM, VKeys, VKeys>[] {
    return this.configSourceMap.sourceValueList
  }

  @computed
  public get itemConfigConstructorMap(): IKeyValueMap<IFormItemConstructor<FM, VKeys>> {
    return this.configSourceMap.sourceData
  }
  
  @computed
  public get itemCodeList() {
    return this.configSourceMap.keyList
  }

  @computed
  public get itemCodeNameMap(): IKeyValueMap<string> {
    return reduce(this.configSourceMap.sourceData, (obj, config) => {
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

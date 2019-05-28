import { FormStore } from '@/components/Form/FormStore';
import { EventStoreInject } from '@/stores/EventStore';
import { Utils } from '@/utils/Utils';
import { autobind, override } from 'core-decorators';
import { get } from 'lodash';
import { action, computed, IKeyValueMap, observable, toJS } from 'mobx';
import { createTransformer, createViewModel, IViewModel } from 'mobx-utils';
import { CommonStore } from "./interface/CommonStore";
import { IFormItemConstructor } from './interface/ItemConfig';
import { IPropertyChangeEvent } from './ItemConfigBase';

@EventStoreInject(['options-change'])
export class ItemConfigBaseConfigModel<V, FM> extends CommonStore {
  [k: string]: any;
  @observable.ref
  public baseConfigKeys: string[] = [];
  @observable.ref
  public baseConfig: IFormItemConstructor<FM, V> = { code: '_' };
  @observable
  public baseConfigModel: IViewModel<IFormItemConstructor<FM, V>> = createViewModel(observable(this.baseConfig));
  @computed.struct
  public get i(): IFormItemConstructor<FM, V> {
    return this.baseConfigModel.model;
  }
  @computed
  public get type() {
    return this.i.type;
  }
  @computed
  public get code() {
    return this.i.code;
  }
  @computed
  public get keyCode() {
    return this.code.split('.')[0];
  }
  @computed
  public get keyInnerCode() {
    return this.keyCode !== this.code ? this.code.replace(this.keyCode + '.', '') : undefined;
  }

  @computed get children(): IKeyValueMap<IFormItemConstructor<FM, V>> | false {
    return this.type === 'group' && Utils.isNotEmptyObject(this.i.children) ? Utils.reduce(
      this.i.children,
      (obj, i, key) => Object.assign(
        obj, {
          [key]: {
            ...i,
            code: `${this.code}.${i.code}`
          }
        }), {}) : false
  }
  
  @computed.struct get currentValueFromStore() {
    if(this.keyInnerCode) {
      return get(this.formStore.formMap.get(this.keyCode), this.keyInnerCode)
    }
    return this.formStore.formMap.get(this.keyCode)
  }

  @observable.ref
  public formStore: FormStore;
  @action.bound
  public setFormStore(formStore: FormStore) {
    if (formStore instanceof FormStore) {
      this.formStore = formStore;
    }
  }

  @computed.struct
  public get formSource(): FM {
    // console.log('this.formStore', this.formStore && this.formStore.formSource);
    return (this.formStore && this.formStore.formSource) || {} as FM;
  }

  private lastReceiveConfig: IKeyValueMap<IFormItemConstructor<FM, V>> = {}
  protected configInited: boolean = false
  @action.bound
  protected setBaseConfig(baseConfig: IFormItemConstructor<FM, V>, strict: boolean = false): boolean {
    baseConfig = baseConfig && baseConfig.i ? baseConfig.i : baseConfig
    if (strict || !Utils.isEqual(this.lastReceiveConfig, baseConfig)) {
      if (this.configInited) {
        // if (this.label==='机构'){
        //   debugger
        // }
        for (const key in baseConfig) {
          if (!Utils.isEqual(this.lastReceiveConfig[key], baseConfig[key])) {
            this.baseConfig[key] = baseConfig[key]
          }
        }
      } else {
        // console.log('setBaseConfig', baseConfig, strict)
        this.baseConfig = baseConfig
        this.baseConfigKeys = Object.keys(baseConfig);
        for (const name of this.baseConfigKeys.concat(['options', 'loading'])) {
          this.registerKey(baseConfig, name);
        }
        this.baseConfigModel = createViewModel(baseConfig);
        this.observe(baseConfig, (e: IPropertyChangeEvent) => { });
        // console.log('initConfig change init', baseConfig, this);
        // this.objectToDiff(this.baseConfigModel.model, baseConfig)
        if (Utils.isFunction(baseConfig.refConfig)) {
          Reflect.apply(baseConfig.refConfig, this, [this]);
        }
        this.configInited = true
      }
      this.lastReceiveConfig = Utils.cloneDeep(baseConfig);
      return true;
    }
    return false;
  }
  @autobind
  public getComputedValue(key: string, target: IFormItemConstructor<FM, V> = this.i, defaultValue?: any) {
    try {
      const keyValue = target[key];
      if (!(/(^refConfig$)|^(on|get(.*?))|((.*?)Method)$|(.*?)filter(.*?)/.test(key)) && (keyValue instanceof Function)) {
        const computedValue = keyValue(this.formStore.formMap.toJSON(), this);
        return Utils.isNil(computedValue) ? defaultValue : computedValue;
      }
      return keyValue;
    } catch (e) {
      return undefined;
    }
  }
  
  @override
  @autobind
  public export(): ExportedFormModel<IFormItemConstructor<FM>> {
    return ItemConfigBaseConfigModel.export<FM>(this)
  }

  public static export = createTransformer(<FM>(config: ItemConfigBaseConfigModel<any, FM>): ExportedFormModel<IFormItemConstructor<FM>> => {
    const model: ExportedFormModel<IFormItemConstructor<FM>> = {} as ExportedFormModel<IFormItemConstructor<FM>>;
    for (const key of config.baseConfigKeys) {
      model[key] = config[key];
    }
    model.__isExportObject = true;
    return toJS(model);
  })
}

export type ExportedFormModel<T> = Partial<T> & {
  __isExportObject: true
}
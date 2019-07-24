import { FormStore } from '@/stores/FormStore/FormStore';
import { Utils } from '@/utils';
import { override } from 'core-decorators';
import produce from 'immer';
import { get } from 'lodash';
import { action, computed, IKeyValueMap, observable, toJS } from 'mobx';
import { CommonStore } from "../CommonStore";
import { FormItemType, IFormItemConstructor } from './interface/ItemConfig';

const FormItemGroup = new WeakMap()

// @EventStoreInject(['options-change'])
export class ItemConfigBaseConfigModel<V, FM> extends CommonStore {
  [k: string]: any;
  @observable.ref
  public baseConfigKeys: string[] = [];
  @observable
  public baseConfigMap = observable.map<keyof IFormItemConstructor, IFormItemConstructor[keyof IFormItemConstructor]>({ code: '_' } as any, { deep: false })

  @computed.struct
  public get i(): IFormItemConstructor<FM, V> {
    return this.cloneFormMapToObjWithKeys(this.baseConfigMap, this.baseConfigKeys);
  }

  public code: string;

  @observable.ref
  public type: FormItemType;

  @observable.ref
  public nameCode: string;

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
    if (this.keyInnerCode) {
      return get(this.formStore.formMap.get(this.keyCode), this.keyInnerCode)
    }
    return this.formStore.formMap.get(this.keyCode)
  }

  @observable.ref
  public formStore: FormStore;
  @action
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

  private lastReceiveConfig: IFormItemConstructor<FM, V> = { code: '_' }
  private baseConfigCache: IFormItemConstructor<FM, V> = { code: '_' }
  protected configInited: boolean = false


  @computed get FormItemGroup() {
    return FormItemGroup
  }

  constructor() {
    super();
    this.registerDisposer(() => {
      this.setBaseConfig({ code: this.code }, true)
    })
  }

  /**
   * 设置
   * @param baseConfig 配置项内容
   * @param strict 
   */
  @action.bound
  protected setBaseConfig(baseConfig: IFormItemConstructor<FM, V>, strict: boolean = true): boolean {
    baseConfig = baseConfig && baseConfig.i ? baseConfig.i : baseConfig
    if (baseConfig) {
      this.type = baseConfig.type
      this.code = baseConfig.code
      this.nameCode = baseConfig.nameCode
      this.FormItemGroup.set(this, baseConfig.code)
    }
    // console.error('setBaseConfig', this.lastReceiveConfig, baseConfig, this);
    
    // 严格模式下进行深比较
    if (!(strict ? Utils.isEqual(this.lastReceiveConfig, baseConfig) : this.lastReceiveConfig === baseConfig)) {
      const nextCache = produce(this.baseConfigCache, (cache: typeof baseConfig) => {
        this.mapToDiff(this.baseConfigMap, baseConfig, cache, strict)
      })
      if (nextCache !== this.baseConfigCache) {
        this.baseConfigCache = nextCache
      }
      this.baseConfigKeys = Object.keys(baseConfig).concat(['options', 'loading']); // 部分属性持久化
      if (!this.configInited) {
        if (Utils.isFunction(baseConfig.refConfig)) {
          Reflect.apply(baseConfig.refConfig, this, [this]);
        }
        this.configInited = true
      }
      // 严格模式下进行深拷贝进行
      this.lastReceiveConfig = strict ? Utils.cloneDeep(baseConfig) : baseConfig;
      return true;
    }
    return false;
  }
  
  protected getComputedValue(key: string, target: IFormItemConstructor<FM, V> = this.i, defaultValue?: any) {
    try {
      const keyValue = target[key];
      if (!(/(^refConfig$)|^(on|get(.*?))|((.*?)Method)$|(.*?)filter(.*?)/.test(key)) && (keyValue instanceof Function)) {
        const computedValue = keyValue(this.formStore.formsourceCloneFromMap, this);
        return Utils.isNil(computedValue) ? defaultValue : computedValue;
      }
      return keyValue;
    } catch (e) {
      return undefined;
    }
  }


  @override
  public export(): ExportedFormModel<IFormItemConstructor<FM>> {
    return ItemConfigBaseConfigModel.export(this)
  }

  public static export = <FM>(config: ItemConfigBaseConfigModel<any, FM>): ExportedFormModel<IFormItemConstructor<FM>> => {
    const model: ExportedFormModel<IFormItemConstructor<FM>> = {} as ExportedFormModel<IFormItemConstructor<FM>>;
    for (const key of config.baseConfigKeys) {
      model[key] = config[key];
    }
    model.__isExportObject = true;
    return toJS(model);
  }
}

export type ExportedFormModel<T> = Partial<T> & {
  __isExportObject: true
}
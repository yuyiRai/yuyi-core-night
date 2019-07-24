import { Utils } from '@/utils';
import { autobind, readonly } from 'core-decorators';
import { assign, reduce } from 'lodash';
import { action, computed, IKeyValueMap, keys as getKeys, observable, ObservableMap, toJS, values } from 'mobx';
import { CommonStore } from '../CommonStore';

export type IKeyData<Key extends string> = IKeyValueMap<any> & {
  readonly [K in Key]-?: string;
}


export class KeyDataMapStore<
  DataKey extends string,
  SourceData extends IKeyData<DataKey>,
  TargetData extends IKeyData<DataKey> = SourceData,
> extends CommonStore {

  @observable
  public sourceMap: ObservableMap<string, SourceData> = observable.map(new Map(), { deep: false })

  @observable
  @readonly
  protected readonly targetMap: ObservableMap<string, TargetData> = observable.map({}, { deep: false })

  @computed
  public get sourceData(): IKeyValueMap<SourceData> {
    // console.log('sourceData', this);
    
    // const c = toJS(this.sourceMap.toPOJO())
    // return forEach(c, (value, key) => {
    //   c[key] = toJS(value)
    // })
    // toJS(this.sourceMap.toPOJO())
    return reduce(this.keyList, (obj, key) => {
      const value = Utils.obsGet(this.sourceMap, key)
      return assign(obj, {
        [key]: toJS(value)
      });
    }, {})
  }

  public sourceDataSnapshot: IKeyValueMap<SourceData> = {};

  @computed.struct
  public get targetData(): IKeyValueMap<TargetData> {
    // console.log('targetData', this);
    return toJS(this.targetMap.toJSON())
  }

  @computed.struct
  public get sourceValueList() {
    // trace()
    return toJS(values(this.sourceMap))
  }

  @computed.struct
  public get keyList(): string[] {
    return getKeys(this.sourceMap) as string[]
  }
  @computed.struct
  public get valueList(): ReadonlyArray<TargetData> {
    return toJS(values(this.targetMap))
  }

  @action
  public getSourceData(keyValue: string): SourceData {
    return this.sourceMap.get(keyValue)
  }

  @action reduce(callback: any, init: any) {
    return reduce(this.sourceData, action(callback), init);
  }

  @action 
  public mapValueWithSource<VT = any>(valueKey: string, autoZip = false): IKeyValueMap<VT> {
    const obj = {}
    for (const key of this.keyList) {
      const value = this.getSourceData(key)[valueKey]
      if ((autoZip && value) || autoZip) {
        obj[key] = value
      }
    }
    return obj;
  }

  @action 
  public mapValueWithTarget<VT = any>(valueKey: string, autoZip = false): IKeyValueMap<VT> {
    return reduce(this.keyList, (obj, key) => {
      const value = this.getTargetData(key)[valueKey]
      return autoZip && value ? obj : assign(obj, { [key]: value })
    }, {} as any);
  }

  @autobind
  @readonly
  public getTargetData(keyValue: string): TargetData {
    return this.targetMap.get(keyValue)
  }

  @autobind
  public getConfigKey(config: SourceData | TargetData): (SourceData | TargetData)[DataKey] {
    return config[this.keyName]
  }

  @autobind
  public setConfigKey(config: SourceData | TargetData, keyValue: string) {
    return config[this.keyName] = keyValue as (SourceData | TargetData)[DataKey]
  }

  @readonly
  public setSourceData(sourceData: SourceData[] | IKeyValueMap<SourceData>) {
    const { getConfigKey: getKey } = this;
    // console.log('set', sourceData)
    this.mapToDiff(this.sourceMap,
      reduce(sourceData, (object, nextConfig: SourceData, key: string | number) => {
        if (Utils.isNumber(key) && Utils.isNil(getKey(nextConfig))) {
          this.setConfigKey(nextConfig, (key + '') as SourceData[DataKey])
        }
        const keyValue = getKey(nextConfig)
        if (Utils.isString(keyValue)) {
          const patch: { [key: string]: SourceData } = {}
          patch[keyValue] = nextConfig
          assign(object, patch)
        }
        return object
      }, {}),
      this.sourceDataSnapshot
    )
    // console.log(this.sourceMap)
  }

  constructor(public readonly keyName: DataKey, public transformer: IMapTransformer<DataKey, SourceData, TargetData>) {
    super()
    this.registerDisposer(() => {
      // console.error('registerDisposer', this);
      for(const key of this.keyList) {
        this.sourceMap.delete(key)
      }
      this.sourceMap.clear()
      this.targetMap.clear()
      this.transformer = null
      this.sourceDataSnapshot = {}
    })
    
    this.intercept(this.sourceMap, listener => {
      // console.log(listener, 1)
      if (listener.type === 'add') {
        this.targetMap.set(listener.name, transformer.create(listener.newValue))
      } else if (listener.type === 'delete') {
        transformer.delete(this.getTargetData(listener.name), this.getSourceData(listener.name))
        this.targetMap.delete(listener.name)
      } else {
        transformer.update(listener.newValue, this.getTargetData(listener.name))
      }
      return listener
    })
  }
}

export interface IMapTransformer<DataKey extends string, SourceData extends IKeyData<DataKey>, TargetData extends IKeyData<DataKey> = SourceData> {
  create(source: Readonly<SourceData>): TargetData;
  update(newSource: Readonly<SourceData>, prevTarget: TargetData): TargetData;
  delete?(target: TargetData, source?: SourceData): void;
}
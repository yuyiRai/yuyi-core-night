import { autobind, readonly } from 'core-decorators';
import { assign, reduce } from 'lodash';
import { action, computed, IKeyValueMap, keys as getKeys, observable, ObservableMap, toJS, values } from 'mobx';
import { Utils } from 'src/utils';
import { CommonStore } from '../ItemConfig/interface';

export type IKeyData<Key extends string> = IKeyValueMap<any> & {
  readonly [K in Key]-?: string;
}

export class KeyDataMapStore<
  DataKey extends string,
  SourceData extends IKeyData<DataKey>,
  TargetData extends IKeyData<DataKey> = SourceData
  > extends CommonStore {

  @observable.shallow
  @readonly
  protected readonly sourceMap: ObservableMap<string, SourceData> = observable.map({}, { deep: false })

  @observable
  @readonly
  protected readonly targetMap: ObservableMap<string, TargetData> = observable.map({}, { deep: false })

  @computed.struct
  public get sourceData(): IKeyValueMap<SourceData> {
    // const c = toJS(this.sourceMap.toPOJO())
    // return forEach(c, (value, key) => {
    //   c[key] = toJS(value)
    // })
    return toJS(this.sourceMap.toPOJO())
  }

  public sourceDataSnapshot: IKeyValueMap<SourceData> = {};

  @computed.struct
  public get targetData(): IKeyValueMap<TargetData> {
    return toJS(this.targetMap.toJSON())
  }

  @computed.struct
  public get sourceValueList(): readonly SourceData[] {
    return toJS(values(this.sourceMap));
  }

  @computed.struct
  public get keyList(): string[] {
    return getKeys(this.sourceMap) as string[];
  }
  @computed.struct
  public get valueList(): readonly TargetData[] {
    return toJS(values(this.targetMap));
  }

  @computed.struct
  public get itemCodeNameMap(): IKeyValueMap<string> {
    return reduce(this.sourceMap, (obj, config) => {
      return config.nameCode ? assign(obj, {
        [config.code]: config.nameCode
      }) : obj;
    }, {});
  }

  @computed.struct
  public get itemCodeNameList() {
    return values(this.itemCodeNameMap);
  }

  @autobind
  @readonly
  public getSourceData(keyValue: string): SourceData {
    return this.sourceMap.get(keyValue)
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

  @action.bound
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

  @action register(transformer: IMapTransformer<DataKey, SourceData, TargetData>) {
    return this.observe(this.sourceMap, listener => {
      // console.log(listener)
      if (listener.type === 'add') {
        this.targetMap.set(listener.name, transformer.create(listener.newValue))
      } else if (listener.type === 'delete') {
        transformer.delete(this.getTargetData(listener.name), this.getSourceData(listener.name))
        this.targetMap.delete(listener.name)
      } else {
        transformer.update(listener.newValue, this.getTargetData(listener.name))
      }
    })
  }
  constructor(public readonly keyName: DataKey, transformer: IMapTransformer<DataKey, SourceData, TargetData>) {
    super()
    // console.log(transformer)
    this.register(transformer);
  }
}

export interface IMapTransformer<
  DataKey extends string,
  SourceData extends IKeyData<DataKey>,
  TargetData extends IKeyData<DataKey> = SourceData
  > {
  create(source: Readonly<SourceData>): TargetData;
  update(newSource: Readonly<SourceData>, prevTarget: TargetData): TargetData;
  delete?(target: TargetData, source?: SourceData): void;
}
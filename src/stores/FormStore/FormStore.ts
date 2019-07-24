import { WrappedFormUtils } from 'antd/lib/form/Form';
import merge from 'deepmerge';
import produce from 'immer';
import { get, groupBy, set } from 'lodash';
import { action, computed, IKeyValueMap, IMapDidChange, observable, ObservableMap, transaction } from 'mobx';
import { BufferCacheGroup, createSimpleTimeBufferInput, EventEmitter, Utils } from 'yuyi-core-utils';
import { FormModel, IFormItemConstructor, ItemConfig } from '../ItemConfig';
import getTransform, { TransformerType } from '../ItemConfig/input/FormValueTransform';
import { IFormItemStoreConstructor } from "./FormItemStoreBase";
import { FormStoreCore } from './FormStoreCore';
import { PatchDataTree } from './PatchData';


export interface IFormItemValueUpdateTask {
  /**
   * formMap的key，浅层Key
   */
  mapKey: string,
  /**
   * formMap的value，浅层value
   */
  mapValue: any,
  /**
   * 完整的itemConfig.code
   */
  code: string,
  /**
   * 更新值
   */
  value: any,
  /**
   * 上一个值
   */
  lastValue: any
}

// export const ConfigKeys: any[] = keys<ICommonFormConfig>()
export interface ICommonFormConfig extends IKeyValueMap {
  $formStore?: FormStore;
  [k: string]: WrappedFormUtils | FormStore | ItemConfig;
}

export type onItemChangeCallback = (code: string, value: any) => void

export class FormStore<
  FM extends FormModel = any,
  VM extends IFormItemStoreConstructor<FM, any> = IFormItemStoreConstructor<FM, any>
  > extends FormStoreCore<FM, VM> {
  public antFormInited: boolean = false;
  get BufferCacheGroup() {
    return BufferCacheGroup
  }
  constructor(configList?: IFormItemConstructor<any, FM>[]) {
    super()
    this.observe(this.errorGroup, (listener: IMapDidChange) => {
      this.errorTack.push(listener)
      console.log('this.errorGroup', listener, this.errorTack)
    })
    // this.observe(this.formMap, listener => {
    // const config = this.formItemConfigMap[listener.name]
    // console.log('this.formMap', listener, this.formSource)
    // for (const key in this.formItemConfigMap) {
    //   const config = this.formItemConfigMap[key]
    //   console.log('update config', config, key, (listener.name))
    //   if (config instanceof ItemConfig) {
    //     config.form[listener.name] = (listener as any).newValue
    //     // break;
    //   }
    // }

    // })
    // reaction(() => this.formMap, () => {
    //   // console.log('this.formMap')
    // })
    this.registerDisposer(() => {
      this.antdFormMap.clear()
      this.setForm({} as FM)
      this.configStore.setConfigSource([])
      this.configStore = null
      for (const code in this.formItemStores) {
        this.formItemStores[code].destory()
      }
    })
  }


  public patchFieldsChange(patch: PatchDataTree<FM>): IKeyValueMap<boolean>
  public patchFieldsChange(patch: PatchDataTree<FM>, async: true): Promise<IKeyValueMap<boolean>>

  /**
   * 增量更新表单值
   * @param patch 增量包
   * @param async 异步汇总模式
   */
  @action.bound
  public patchFieldsChange(patch: PatchDataTree<FM>, async: boolean = false): IKeyValueMap<boolean> | Promise<IKeyValueMap<boolean>> {
    if (!async) {
      return this.withFieldsChange(patch)
    }
    return this.firePatchFieldsChangeTaskList(patch)
  }

  @computed get firePatchFieldsChangeTaskList() {
    this.commonInstance.firePatchFieldsChangeTaskList = {}
    return createSimpleTimeBufferInput((list: object[]) => {
      const mergeEvent = Utils.reduce(list, (obj, res) => merge(obj, res), {})
      console.log('firePatchFieldsChangeTask', list, mergeEvent);
      return this.withFieldsChange(mergeEvent)
    }, this.commonInstance.firePatchFieldsChangeTaskList, 10, false)
  }

  /**
   * 变更字段值
   * @param patch 
   * @param path 
   * @param callback 
   */
  @action.bound
  private withFieldsChange(patch: PatchDataTree<FM>, path: string[] = [], callback?: any): IKeyValueMap<boolean> {
    // console.log('patchFieldsChange', patch, this)
    const result: IKeyValueMap<boolean> = {}
    // debugger
    for (const [key, data] of Object.entries(patch)) {
      if (Utils.isNotEmptyObject(data)) {
        const nextpath = path.concat([key])
        const pathStr = nextpath.join('.')
        if (Utils.isString(data.name) && data.name === pathStr) {
          // validating 为ture表示正在校验，为false表示结束校验，空则代表不影响值变更
          if (data.validating !== true) {
            // console.log('hasError', data.name, data, isNotEmptyArray(data.errors))
            if (data.validating === false && (data.errors instanceof Array || data.errors === undefined)) {
              this.updateError(data.name, data.errors as (Error[] | undefined))
            }
            // this.registerKey(this.formSource, pathStr)
          }
          if (Utils.isFunction(callback)) {
            Object.assign(result, callback(pathStr, data.value))
          } else {
            const isChanged = this.setFormValueWithComponentValue(key, data.value)
            Object.assign(result, { [key]: isChanged })
          }
        } else if (Utils.isNil(data.name)) {
          const next = this.withFieldsChange(data as PatchDataTree<FM>, nextpath, callback || ((pathStr: string, value: any): IKeyValueMap<boolean> => {
            const isChanged = this.setFormValueWithComponentValue(pathStr, value)
            return { [pathStr]: isChanged } // 值不变
          }))
          Object.assign(result, next)
        }
      }
    }
    return result
  }


  /**
   * item.value翻译器集合
   */
  @computed({})
  public get formValueTransform() {
    return Utils.reduce(Utils.zipEmptyData(this.configStore.itemConfigGroup), (nextMap, i: ItemConfig<any, FM>) => {
      const key = i.code
      return nextMap.set(key, i.formValueTransform || getTransform<FM>(key, i.type))
    }, observable.map())
  }

  /**
   * 将组件用value转换为表单用的value
   * @param key 完整code
   * @param value 值
   */
  @action.bound public getV2FValue(key: string, value: any) {
    const transforms = this.formValueTransform.get(key)
    if (transforms) {
      return transforms.V2F(value, this.formSource)
    }
    return value
  }
  /**
   * 将表单用value转换为组件用的value
   * @param key 完整code
   * @param value form值
   */
  @action.bound public getF2VValue(key: string, value: any) {
    const transforms = this.formValueTransform.get(key)
    if (transforms) {
      return Utils.cloneDeep(transforms.F2V(value, Utils.cloneDeep(this.formSource)))
    }
    return value
  }

  /**
   * store的form里记录的都是原始值
   * component使用的值是在使用时进行过转译
   * 然后在onchange时再将返回回来的组件用值转译为form值
   * @param code 
   * @param value 原始值
   */
  @action.bound
  public setFormValue(code: string, value: any) {
    if (this.antdForm) {
      this.antdForm.setFieldsValue(set({}, code, value))
    } else {
      const codeDeep = code.split('.')
      const key = codeDeep.shift()
      this.setFormValueBy(value, key, codeDeep.join('.'))
    }
  }

  /**
   * 使用组件值设置表单的值
   * @param code 字段
   * @param value 值
   */
  @action.bound
  public setFormValueWithComponentValue(code: string, value: any): boolean {
    // debugger
    // console.log('setFormValueWithComponentValue', code, value);

    const codeDeep = code.split('.')
    const key = codeDeep.shift()
    return this.setFormValueBy(value, key, codeDeep.join('.'), TransformerType.V2F)
  }

  /**
   * 直接设置form的值
   * @param value 原始值
   * @param key 基础键
   * @param innerPath 深入键
   * @param transformerType 翻译器类型（不传则表示不翻译）
   */
  @action.bound
  private setFormValueBy(value: any, key: string, innerPath?: string, transformerType?: TransformerType): boolean {
    let isChanged: boolean;
    let nextValue: any;
    let lastValue: any;
    let nextMapValue: any;
    let pathStr = key;
    const transformer = transformerType === TransformerType.V2F ? this.getV2FValue : null
    // const transformerReserval = transformerType === TransformerType.V2F ? this.getF2VValue : null
    if (Utils.isNotEmptyString(innerPath)) {
      pathStr += '.' + innerPath
      const preObj = Utils.cloneDeep(this.formMap.get(key)) || {}
      // console.log(preObj)
      const obj = produce(preObj, (i: any) => {
        lastValue = get(i, innerPath)
        if (!Utils.isEqual(lastValue, value, true)) {
          const toValue = transformer ? transformer(pathStr, value) : value
          nextValue = toValue;
          set(i, innerPath, toValue)
        }
      })
      nextMapValue = obj
      isChanged = obj !== preObj
    } else {
      lastValue = this.formSource[key]
      nextValue = transformer ? transformer(key, value) : value
      nextMapValue = nextValue
      isChanged = !Utils.isEqual(lastValue, nextValue, true)
    }
    if (isChanged) {
      // console.log('pushTaskList', pathStr, value);
      this.pushTaskList({
        mapKey: key,
        code: pathStr,
        value: nextValue,
        lastValue: lastValue,
        mapValue: nextMapValue
      })
    }
    return isChanged
  }

  /**
   * 
   * @param code 
   * @returns 是否成功（不成功可能是因为没有名字）
   */
  @action.bound setFormValueWithName(code: string, nameValue?: string): boolean {
    const nameCode = this.configStore.getItemConfig(code).nameCode
    if (Utils.isString(nameCode)) {
      const name = nameValue || this.getValueWithName(code, nameCode)
      set(this.formSource, nameCode, name)
      this.onItemChangeEmit(nameCode, name)
      return true
    }
    return false
  }

  @action.bound
  pushTaskList(req: IFormItemValueUpdateTask) {
    this.formMap.set(req.mapKey, req.mapValue)
    this.fireUpdateValueTaskList(req)
    // this.formMap.set(code, value)
  }

  @computed
  protected get fireUpdateValueTaskList() {
    this.commonInstance.fireUpdateValueTaskList = {}
    return createSimpleTimeBufferInput((list: IFormItemValueUpdateTask[]) => {
      // console.log('set formMap useTaskList', list);
      transaction(() => {
        Utils.forEach(groupBy(list, r => r.mapKey), this.handleUpdateFormValue)
      })
      // console.log('set formMap end', this)
    }, this.commonInstance.fireUpdateValueTaskList, 10, true)
  }

  @action.bound handleUpdateFormValue(tasklist: IFormItemValueUpdateTask[]) {
    const { code, value } = Utils.last(tasklist)
    // runInAction('handleUpdateFormValue', () => {
    // this.formMap.set(mapKey, value)
    const itemConfig = this.configStore.getItemConfig(code)
    // console.log(`set formMap baseCode=${mapKey} lastValue, newValue`, lastValue, value, this)
    this.validateList.add(code)
    this.setFormValueWithName(code)
    // this.formMap.set(mapKey, mapValue)
    // debugger
    const { onChange } = itemConfig.i
    if (Utils.isFunction(onChange)) {
      onChange(value, this.formSource, itemConfig)
    }
    this.onItemChangeEmit(code, value)
    // })
  }
  @action.bound async validate(codeList: string[] = this.configStore.itemCodeList) {
    try {
      const r = await (this.antdForm && this.antdForm.validateFields(codeList || Array.from(this.validateList), { force: true }))
      this.validateList.clear()
      console.error('validate', r);
      return r
    } catch (error) {
      return error
    }
  }


  // @observable formItemMap: ObservableMap<any, ICommonFormConfig> = observable.map({})
  // @computed.struct get formItemConfigMap() {
  //   return this.formItemMap.get(this.formSource) || {}
  // }

  @observable.ref reactionAntdFormEmitter = new EventEmitter<WrappedFormUtils>()
  @action.bound reactionAntdForm(callback: (antdForm: WrappedFormUtils) => void) {
    const sub = this.reactionAntdFormEmitter.subscribe((antdForm) => {
      // console.log('reactionAntdForm', sub)
      callback(antdForm)
      sub.unsubscribe()
    })
    callback = null
  }

  @action.bound receiveAntdForm(antdForm: WrappedFormUtils) {
    this.reactionAntdFormEmitter.emit(antdForm)
  }

  @observable.ref antdForm: WrappedFormUtils;
  @observable.shallow antdFormMap: ObservableMap<string, WrappedFormUtils> = observable.map({})
  @action.bound
  public setAntdForm(antdForm: WrappedFormUtils, code?: string) {
    if (antdForm !== this.antdForm) {
      this.antdForm = antdForm
    }
    if (code) {
      this.antdFormMap.set(code, antdForm)
    }
  }

  // @action.bound registerForm(form: any, code: string, itemConfig: ItemConfig) {
  //   // console.log('registerForm', form)
  //   const keyMap: ICommonFormConfig = this.formItemMap.get(form) || {}
  //   if(keyMap[code] !== itemConfig){
  //     keyMap.$formStore = this
  //     keyMap[code] = itemConfig
  //     this.formItemMap.set(form, keyMap)
  //   }
  // }
}

import { IFormValueTransform, ItemConfig } from '../ItemConfig';
import getTransform, { TransformerType } from '../ItemConfig/input/FormValueTransform';
import { EventEmitter, Utils } from 'yuyi-core-utils';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import { autobind } from 'core-decorators';
import produce from 'immer';
import { get, set } from 'lodash';
import { action, computed, IKeyValueMap, IMapDidChange, observable, ObservableMap } from 'mobx';
import { FormModel, IFormItemConstructor } from '../ItemConfig';
import { IFormItemStoreCore } from "./FormItemStoreBase";
import { FormStoreCore } from './FormStoreCore';
import { PatchDataTree } from './PatchData';

// export const ConfigKeys: any[] = keys<ICommonFormConfig>()
export interface ICommonFormConfig extends IKeyValueMap {
  $formStore?: FormStore;
  [k: string]: WrappedFormUtils | FormStore | ItemConfig;
}

export type onItemChangeCallback = (code: string, value: any) => void

export class FormStore<
  FM extends FormModel = any,
  VM extends IFormItemStoreCore<FM, any> = IFormItemStoreCore<FM, any>
> extends FormStoreCore<FM, VM> {
  public antFormInited: boolean = false;
  constructor(configList?: IFormItemConstructor<any, FM>[]) {
    super()
    this.observe(this.errorGroup, (listener: IMapDidChange) => {
      this.errorTack.push(listener)
      // console.log('this.errorGroup', this.errorTack)
    })
    this.observe(this.formMap, listener => {
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

    })
    // reaction(() => this.formMap, () => {
    //   // console.log('this.formMap')
    // })
  }



  // @Memoize
  @action.bound patchFieldsChange(patch: PatchDataTree<FM>, path: string[] = [], callback?: any): IKeyValueMap<boolean> {
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
            this.registerKey(this.formSource, pathStr)
          }
          if (Utils.isFunction(callback)) {
            Object.assign(result, callback(pathStr, data.value))
          } else {
            const isChanged = this.setFormValueWithComponentSource(key, data.value)
            Object.assign(result, { [key]: isChanged })
          }
        } else if (Utils.isNil(data.name)) {
          const next = this.patchFieldsChange(data as PatchDataTree<FM>, nextpath, callback || ((pathStr: string, value: any): IKeyValueMap<boolean> => {
            const isChanged = this.setFormValueWithComponentSource(pathStr, value)
            return { [pathStr]: isChanged } // 值不变
          }))
          Object.assign(result, next)
        }
      }
    }
    return result
  }

  @computed get formValueTransform() {
    return Utils.reduce(Utils.zipEmptyData(this.configStore.itemConfigGroup), (nextMap, i: ItemConfig<any, FM>) => {
      const key = i.code
      return nextMap.set(key, i.formValueTransform || getTransform<FM>(key, i.type))
    }, new Map<string, IFormValueTransform<FM>>())
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
    const codeDeep = code.split('.')
    const key = codeDeep.shift()
    this.setFormValueBy(value, key, codeDeep.join('.'))
  }

  @action.bound
  public setFormValueWithComponentSource(code: string, value: any): boolean {
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
    let pathStr = key;
    const transformer = transformerType === TransformerType.V2F ? this.getV2FValue : null
    // const transformerReserval = transformerType === TransformerType.V2F ? this.getF2VValue : null
    if (Utils.isNotEmptyString(innerPath)) {
      pathStr += '.' + innerPath
      const preObj = Utils.cloneDeep(this.formMap.get(key)) || {}
      // console.log(preObj)
      const obj = produce(preObj, (i: any) => {
        if (!Utils.isEqual(get(i, innerPath), value, true)) {
          const toValue = transformer ? transformer(pathStr, value) : value
          set(i, innerPath, toValue)
        }
      })
      nextValue = obj;
      isChanged = obj !== preObj
    } else {
      nextValue = transformer ? transformer(key, value) : value
      isChanged = !Utils.isEqual(this.formSource[key], nextValue, true)
    }
    if (isChanged) {
      this.formSource[key as keyof FM] = nextValue
      this.formMap.set(key, nextValue)
      this.onItemChangeEmit(pathStr, nextValue)
      // debugger
      const itemConfig = this.configStore.getItemConfig(pathStr)
      console.log('set', 'formMap', pathStr, value, nextValue, this.formSource, this.formItemStores, itemConfig)
      // this.setFormValueWithName(pathStr)
      const { onChange } = itemConfig
      if (Utils.isFunction(onChange)) {
        onChange(nextValue)
      }
    }
    return isChanged
  }
  // @action.bound setFormValueWithName(code: string) {
  // const nameCode = this.itemCodeNameMap[code]
  // set(this.formSource, nameCode, this.getValueWithName(code, nameCode))
  // }

  @autobind async validate(codeList?: string[]) {
    try {
      const r = await (this.antdForm && this.antdForm.validateFields(codeList || this.configStore.itemCodeList, { force: true }))
      console.log('validate', r);
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
  }

  @action.bound receiveAntdForm(antdForm: WrappedFormUtils) {
    this.reactionAntdFormEmitter.emit(antdForm)
  }

  @observable.ref antdForm: WrappedFormUtils;
  @observable.shallow antdFormMap: ObservableMap<string, WrappedFormUtils> = observable.map({})
  @action.bound setAntdForm(antdForm: WrappedFormUtils, code?: string) {
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

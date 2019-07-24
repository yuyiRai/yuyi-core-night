/* eslint-disable */
import { EventEmitter, OptionBase, Utils } from '@/utils';
import { autobind } from 'core-decorators';
import { difference, get, isError } from 'lodash';
import { action, computed, extendObservable, IKeyValueMap, isComputedProp, IValueDidChange, observable, toJS, transaction } from 'mobx';
import { IFormItemConstructor, IItemConfig } from './interface/ItemConfig';
import { ItemConfigBaseConfig } from './ItemConfigBaseConfig';

export interface IPropertyChangeEvent<T = any> extends IValueDidChange<T> {
  name: string;
}
export class ItemConfigBase<V, FM = any> extends ItemConfigBaseConfig<V, FM> implements IItemConfig<FM, V> {
  [key: string]: any;

  // @observable initConfig: ObservableMap<string, any> = observable.map({})

  @observable.ref $version = 0
  // @observable loading = false;
  @computed private get otherKey() {
    return difference(
      this.baseConfigKeys,
      this.propertyNameList,
      ['refConfig', 'code', 'rule', 'remoteMethod', 'loading', 'children', 'options', 'viewOnly', 'isViewOnly', 'transformer', 'computed']
    )
  }

  onPropertyChange = new EventEmitter<IPropertyChangeEvent>()

  constructor(initModel: IFormItemConstructor<FM, V>, form: FM = {} as FM, componentProps: any = {}) {
    super()
    // this.reaction(() => this.i.options, options => {
    //   console.log('initConfig change', Utils.isArrayFilter(options, this.getComputedValue('options')) || [])
    // })
    // this.observe(this.initConfig, (e: IMapDidChange) => {
    //   console.log('initConfig change', e, this);
    // })

    if (initModel) {
      this.init(initModel, form, componentProps)
    }
    // this.observe(this.formSource, (e: IPropertyChangeEvent) => {
    //   console.log('initConfig change2', this[e.name], this.baseConfig[e.name], e, this)
    // }
    // this.observe(this.baseConfigModel.model, (e: IPropertyChangeEvent) => {
    //   this.onPropertyChange.emit(e)
    //   // console.log('initConfig change2', this[e.name], this.baseConfig[e.name], e, this)
    //     const { oldValue, newValue, name } = e
    //     if (name === 'options' && !Utils.isEqual(oldValue, newValue)) {
    // //       this.label === '查勘地点' && console.log(
    // //         `${name}: options[${(oldValue || []).length}] => options[${(newValue || []).length}]`, { config: i, event: e }, this.options)
    // //       if (newValue) {
    // //         this.optionsInited = Utils.isNotEmptyArray(newValue)
    // //       }
    //       // this.$emit('options-change', e.newValue)
    //     }
    //     // console.log(`${e.name}: ${e.oldValue} => ${e.newValue}`, {config: i, event: e})
    // })
    // this.onPropertyChange.subscribe()
  }

  @action registerObservables(baseConfig: IFormItemConstructor<FM, V>) {
    transaction(() => {
      for (const key of this.otherKey) {
        if (!isComputedProp(this, key)) {
          const thisArg = this;
          extendObservable(this, {
            get [key]() {
              return thisArg.getComputedValue(key, baseConfig)
            },
            // [keyName](value) {
            //   // console.log(key, 'set', value, baseConfig.label)
            //   return baseConfig[key] = value
            // }
          }, {
              // [keyName]: action
            }, { deep: false })
        }
      }
    })
  }

  optionsInited = false
  @action setConfig(baseConfig: IFormItemConstructor<FM, V>, strict?: boolean) {
    const isChange = this.setBaseConfig(baseConfig, strict)
    isChange && this.registerObservables(this.i)
  }

  @action init(initModel: IFormItemConstructor<FM, V>, form: IKeyValueMap, componentProps = {}) {
    this.setConfig(initModel)
    this.componentProps = componentProps
  }


  @computed.struct get searchName() {
    return this.getSearchName()
  }
  @autobind getSearchName() {
    const v = get(Utils.cloneDeep(this.formSource), this.nameCode)
    return Utils.isStringFilter(v) || this.currentValue
  }

  @computed get currentValue() {
    // trace()
    const v = this.parentConfig 
      ? get((this.parentConfig as any).currentComponentValue, this.keyInnerCode) 
      : this.currentValueFromStore
    return toJS(v)
  }

  @autobind validateHandler(value: any, strict: boolean = false) {
    return new Promise((resolve, reject) => {
      const resultList = []
      const ruleList = this.rules.filter((rule) => (rule.strict && strict) || (!rule.strict && !strict))
      // console.log('validateHandler start', ruleList)
      if ((Utils.isArrayFilter(ruleList) || []).length === 0) {
        return resolve(true)
      }
      // console.log('validateHandler', ruleList)
      const length = ruleList.length
      for (const rule of ruleList) {
        if ((rule.strict && strict) || (!rule.strict && !strict)) {
          const validator = Utils.isFunctionFilter(rule.validator) || ((a: any, b: any, c: (arg0: boolean) => void) => c(true))
          validator(ruleList, value, (e: Error | undefined) => {
            resultList.push(rule)
            if (isError(e)) {
              reject(e.message || rule.message)
            } else if (resultList.length === length) {
              resolve(true)
            }
          })
        }
      }
    })
  }

  @action updateVersion() {
    this.$version = this.$version + 1
  }


  /**
   * @type {function}
   */
  onValidateHandler = () => { }
  /**
   * 
   * @param { (code: string, isValid: boolean, errorMsg: string, config: this) => void} callback 
   */
  onValidate(callback: () => void) {
    if (Utils.isFunction(callback))
      this.onValidateHandler = callback
  }

  @autobind async optionsMatcher(r: any, values: any, callback: any) {
    if (!this.allowCreate) {
      const options = await Reflect.apply(this.getOptionsSafe, this, [])
      for (const value of Utils.isStringFilter(values, '').split(',')) {
        if (Utils.isNotEmptyValue(value) && (Utils.isArrayFilter(Utils.getOptionsByValue(options, value)) || []).length === 0) {
          console.error(this.label, '选择项匹配失败，请重新选择！', options, this.form, values, this)
          return callback(new Error(`[${this.label}]数据异常，请重新输入选择！`))
        }
      }
    }
    // console.log(this.label, '选择项匹配成功！', options, this.form, values, this)
    return callback()
  }

  @autobind async getOptionsSafe(): Promise<OptionBase[]> {
    if (this.type === 'search' && (this.options.length === 0 || !this.optionsInited)) {
      if (!Utils.isArrayFilter(this.remoteOptions)) {
        // console.log('safe start', this.label, this.searchName, this.remoteOptions, this.options)
        const options = await this.remoteOptions
        // console.log('safe end', this.label, this.searchName, options)
        return options
      }
      // console.log('get remote', this.label, this.searchName, this.remoteOptions)
      return this.remoteOptions;
    }
    return this.options;
  }
}


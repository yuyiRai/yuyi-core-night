/* eslint-disable */
import { observable, computed, action, runInAction } from 'mobx';
import { autobind } from 'core-decorators';
import Utils, { Option } from '@/utils';
import { findIndex, cloneDeep, pullAll } from 'lodash'
import { createTransformer, ITransformer } from 'mobx-utils'
import { IItemConfig } from '../ItemConfig/interface';


export class OptionsStore2<V = any> {
  [k: string]: any;
  @observable itemConfig: IItemConfig<any, V>;
  __keyMap = {};
  __optionMap = new WeakMap();
  @observable.ref transformer: ITransformer<OptionsStore2, V[]>;
  constructor(itemConfig: IItemConfig<any, V>, transformer?: ITransformer<OptionsStore2, V[]>) {
    this.itemConfig = itemConfig;
    if (transformer) {
      this.transformer = createTransformer(transformer)
    }
    if (this.itemConfig.allowInput) {
      // console.log(this);
      // this.$on('options-change', (options: Option[]) => {
      //   console.log(options, this.lastOptions, this.shadowOption)
      //   this.lastOptions = cloneDeep(options)
      //   // if(this.itemConfig.label==='归属车辆')
      //   //   debugger
      //   this.setShadowOption(this.shadowOption.label, 'options-update');
      // });
      // reaction(() => this.itemConfig.options, options => {
      //   // console.log(options, this.shadowOption.value)
      //   // if(this.itemConfig.label==='归属车辆')
      //   //   debugger
      //   this.setShadowOptionByValue(this.shadowOption.value, 'options-update')
      // }, { fireImmediately: true })
    }
  }
  @observable shadowOption: Option = { key: Utils.uuid(), errorMsg: null, label: '', value: '', highlight: true };
  @computed get shadowOptionMode() {
    return this.itemConfig.code === this.itemConfig.nameCode ? 'text' : 'code';
  }
  /**
   * 录入值的自动转化
   * @param { string } value
   * @param { string } label
   */
  @action.bound async setShadowOptionByValue(value: string, source: any) {
    const options = await this.itemConfig.getOptionsSafe();
    // if(this.itemConfig.label==='交强险承保单位')
    //   debugger
    const label = Utils.isStringFilter(Utils.valueToLabel(options, value), this.itemConfig.searchName);
    this.shadowUpdateDispatcher(label, value, source + 'byvaue');
  }
  /**
   * 录入值的自动转化
   * @param { string } value
   * @param { string } label
   */
  @action.bound async setShadowOption(label: string, source: any) {
    await this.itemConfig.getOptionsSafe();
    // if(this.itemConfig.label==='交强险承保单位')
    //   debugger
    const value = this.labelToValue(label);
    this.shadowUpdateDispatcher(label, value, source);
  }

  @autobind labelToValue(label: any) {
    return Utils.isStringFilter(Utils.labelToValue(this.displayOptions, new RegExp(`^(\\\[(.*)\\\]|)${Utils.escapeRegExp(label)}(\\\[(.*)\\\]|)$`)), label);
  }

  @autobind async shadowUpdateDispatcher(label: any, value: any, source: any) {
    console.log(`setShadowOption by ${source} mode: ${this.shadowOptionMode}, value: ${value}, label: ${label}`, {
      options: cloneDeep(this.displayOptions), config: this.itemConfig, options1: cloneDeep(this.itemConfig.options)
    })
    try {
      await this.itemConfig.validateHandler(value);
      // if (Utils.isNotEmptyString(value)) {
      //   // console.log(result, value)
      // } else {
      //   throw new Error();
      // }
      // console.error('shadowOption result', result, value)
      runInAction(() => this.updateShadowOption(value, label));
    } catch (error) {
      console.log('shadowOption', error)
      if (this.shadowOption.label !== value) {
        this.shadowOption.value = value;
        this.shadowOption.label = label;
        this.shadowOption.errorMsg = error;
      }
    }
  }
  @action.bound updateShadowOption(value: any, label: any = undefined) {
    if (Utils.isString(this.shadowOption.errorMsg)) {
      this.shadowOption.errorMsg = null;
    }
    // if (this.itemConfig.label === '交强险承保单位')
    //   debugger;
    if (value === this.value && this.shadowOption.value != this.value) {
      // console.log(this.selectedLablesStr)
      this.shadowOption.label = label || this.selectedLablesStr;
      this.shadowOption.value = this.value;
    }
    else if (value !== this.value) {
      const shadowOptionSafe = Utils.getOptionsByValue(this.filterOptions, value, true);
      if (shadowOptionSafe) {
        this.shadowOption.label = shadowOptionSafe.label;
      }
      else {
        const { allowCreate } = this.itemConfig as any ;
        if (Utils.isFunction(allowCreate)) {
          const { label } = allowCreate(value);
          this.shadowOption.label = Utils.isStringFilter(label, value, '');
        }
        else {
          this.shadowOption.label = Utils.isStringFilter(label, value, '');
        }
      }
      this.shadowOption.value = value;
    }
    // debugger
    // if (value === this.value && this.shadowOption.value != this.value) {
    //   // console.log(this.selectedLablesStr)
    //   this.shadowOption.label = label || this.selectedLablesStr
    //   this.shadowOption.value = this.value
    // } else if(value !== this.value) {
    //   if (Utils.isFunction(allowCreate)) {
    //     const { label } = allowCreate(value)
    //     this.shadowOption.label = Utils.isStringFilter(label, value, '')
    //   } else {
    //     this.shadowOption.label = Utils.isStringFilter(label, value, '')
    //   }
    //   this.shadowOption.value = Utils.isStringFilter(value, '')
    // }
    console.log(Utils.cloneDeep(this.shadowOption));
    return this.shadowOption = { ...this.shadowOption };
  }
  @computed get isValidShadowOption() {
    return !this.itemConfig.allowInput || !Utils.isString(this.shadowOption.errorMsg);
  }

  static getOptionsKey(item: any, index: any) {
    return Utils.isStringFilter(item.id, item.key, item.value, (Utils.isObject(item) ? index : item) + '');
  }

  @computed get __optionArr(): Option[] {
    const options = Utils.isArrayFilter(this.itemConfig.options) || []
    // this.arrayMap(this.__optionArr, this.toConvertedOption)
    const length = Math.min(options.length, 100);
    const next = Array(length);
    let index = -1
    while(++index < length) {
      const item = options[index]
      if (!Utils.isNil(item)) {
        next[index] = (Utils.isObject(item) ? ((item as any).__key == null ? { ...item, __key: OptionsStore2.getOptionsKey(item, index) } : item) : {
          __key: OptionsStore2.getOptionsKey(item, index),
          value: item
        });
      }
    }
    return next;
  }
  @autobind toConvertedOption(item: Option, index: number): Option {
    if (!this.__optionMap.get(item)) {
      // if (!Utils.isNumber(this.__keyMap[item.__key])) {
      //   this.__keyMap[item.__key] = 0;
      // }
      // this.__keyMap[item.__key]++;
      // this.__optionMap.set(item, {
      //   ...item,
      //   key: `${item.__key}.${this.__keyMap[item.__key]}`,
      //   label: Utils.isStringFilter(item.label, item.value, (Utils.isObject(item) ? index : item) + ''),
      //   value: Utils.isStringFilter(item.value, (Utils.isObject(item) ? index : item) + '')
      // });
      if (Utils.isNil(this.__keyMap[item.__key])) {
        this.__keyMap[item.__key] = true;
        const option = {
          ...item,
          key: `${item.__key}.${this.__keyMap[item.__key]}`,
          label: Utils.isStringFilter(item.label, item.value, (Utils.isObject(item) ? index : item) + ''),
          value: Utils.isStringFilter(item.value, (Utils.isObject(item) ? index : item) + '')
        }
        this.__optionMap.set(item, option);
        return option
      } else {
        return null
      }
    }
    return this.__optionMap.get(item);
  }
  @computed get convertedOption(): Option[] {
    this.__keyMap = {}
    // console.time(`2displayOptionsNative${this.itemConfig.label}`)
    const result = []
    Utils.forEach(this.__optionArr, (o, index) => {
      const option = this.toConvertedOption(o, index);
      if(option){
        result.push(option)
      }
    })
    // console.timeEnd(`2displayOptionsNative${this.itemConfig.label}`)
    // console.time(`displayOptionsNative${this.itemConfig.label}`)
    // const result = [], array = this.__optionArr
    // while (result.length < array.length) {
    //   result[result.length] = (this.toConvertedOption(array[result.length], result.length, this.__keyMap, this.__optionMap))
    // }
    // console.timeEnd(`displayOptionsNative${this.itemConfig.label}`)
    return result;
  }
  @computed get filterOptions(): Option[] {
    // trace()
    const { filterOptions } = this.itemConfig;
    return Utils.isNotEmptyArray(filterOptions) 
      ? Utils.arrayFilterDive(this.convertedOption, (item: Option) => !filterOptions.includes(item.label)) : this.convertedOption;
  }
  @computed get selectedItemIndex(): number {
    const value = Utils.isNotEmptyValueFilter(this.shadowOption.value, this.value);
    return findIndex(this.filterOptions, ({ value: v, label }) => {
      // debugger
      return Utils.isEqual(v, value) || (Utils.isEqual(label, value));
    });
  }
  @computed get displayOptions(): Option[] {
    const { allowInput } = this.itemConfig;
    const defaultOptions = this.filterOptions;
    if (allowInput) {
      // debugger
      // console.log('getShadowOption', defaultOptions, this.shadowOption)
      if (this.selectedItemIndex > -1) {
        return Utils.arrayMapDive(defaultOptions, 
          (option: Option, index: number) => this.selectedItemIndex === index ? { ...option, highlight: true } : option
        );
      }
      else if (Utils.isNotEmptyString(this.shadowOption.value) && !Utils.getOptionsByLabel(defaultOptions, this.shadowOption.label, true)) {
        // this.itemConfig.allowInput && console.log('shadowOption', {...this.shadowOption}, this)
        return Utils.concat(this.shadowOption, defaultOptions);
      }
    }
    return defaultOptions;
  }

  @computed get transformOption(): V[] {
    return this.transformer ? this.transformer(this) : []
  }

  @autobind valuesToLabels(value: any) {
    return Utils.valuesToLabels(this.displayOptions, value)
  }
  
  @autobind labelsToValues(label: any) {
    return Utils.labelsToValues(this.displayOptions, label)
  }

  @computed get selectedLables() {
    const { currentComponentValue: value } = this.itemConfig
    return Utils.zipEmptyData(Utils.isNotEmptyArrayFilter(this.valuesToLabels(value)) || [this.shadowOption.label])
  }
  @computed get selectedOptions() {
    const { currentComponentValue: value } = this.itemConfig
    
    return Utils.zipEmptyData(Utils.isNotEmptyArrayFilter(this.valuesToLabels(value)) || [this.shadowOption.label])
  }
  @computed get selectedLablesStr() {
    return this.selectedLables.join(',')
  }
  @computed get selectedLablesConfig(): LabelsConfigList {
    const { currentComponentValue: value } = this.itemConfig
    return Utils.arrayMapDive(this.selectedLables, (label: string, index: number) => {
      return {
        label,
        value: Utils.labelToValue(this.displayOptions, label),
        remove: (onChange: onChangeHandler) => {
          onChange(pullAll([...Utils.castArray(value)], this.labelsToValues(label)))
        }
      }
    })
  }
  @computed get hasSelectedTag(){
    // console.log('selectedLablesConfig', this.selectedLablesConfig)
    return this.selectedLables.length > 0
  }
}

export type onChangeHandler = (value: any) => void
export interface ILabelsConfig {
  label: string;
  remove(onChange: onChangeHandler): void;
}
export type LabelsConfigList = Array<ILabelsConfig>
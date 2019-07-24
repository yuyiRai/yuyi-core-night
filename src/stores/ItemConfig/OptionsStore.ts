/* eslint-disable */
import Utils, { Option, OptionBase } from '@/utils';
import { cloneDeep, findIndex, map, pullAll } from 'lodash';
import { action, computed, observable, runInAction } from 'mobx';
import { expr, ITransformer } from 'mobx-utils';
import { IItemConfig } from './interface';
import { ItemConfigModule } from './itemConfigModule';

export interface PathOption extends Option {
  path: string;
  parentOption?: Option;
}

export class OptionsTransformerStore<V, T> extends ItemConfigModule<any, V> {
  [k: string]: any;
  __keyMap = {};
  @observable.ref transformer: ITransformer<OptionsStore, T[]>;

  constructor(itemConfig: IItemConfig<any, V>, transformer?: ITransformer<OptionsStore, T[]>) {
    super(itemConfig)
    this.postConstructor(transformer)
  }
  @action postConstructor(transformer?: ITransformer<OptionsStore, T[]>) {
    this.registerDisposer(() => {
      this.transformer = null
    })
    if (transformer) {
      this.transformer = transformer
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

  public static getOptionsKey(item: any, index: number, parentKey?: string) {
    return `${
      Utils.isString(parentKey) ? `${parentKey}.` : ''
      }${
      Utils.isStringFilter(item.id, item.key, item.value, (Utils.isObject(item) ? index : item) + '')
      }`;
  }

  @computed 
  private get __optionArr(): Option[] {
    return OptionsStore.getOptionArr(this.itemConfig.options);
  }

  private static getOptionArr(sourceOptions: OptionBase[], parentKey?: any): Option[] {
    const options = Utils.zipEmptyData(Utils.isArrayFilter(sourceOptions) || []);
    const length = Math.min(options.length, 100);
    const next: Option[] = Array(length);
    let index = -1;
    while (++index < length) {
      const item = options[index];
      if (!Utils.isNil(item)) {
        const option: Option = (
          Utils.isObject(item)
            ? (
              (item as any).__key == null
                ? { ...item, __key: OptionsStore.getOptionsKey(item, index, parentKey) }
                : item
            )
            : {
              __key: OptionsStore.getOptionsKey(item, index, parentKey),
              value: item
            }
        );
        if (option && option.children) {
          option.children = OptionsStore.getOptionArr(option.children, option.__key)
        }
        next[index] = option
      }
    }
    return next;
  }

  private toConvertedOption(item: Option, index: number): Option {
    if (Utils.isNil(this.__keyMap[item.__key])) {
      this.__keyMap[item.__key] = true;
      const option = {
        ...item,
        key: item.key || `${item.__key}.${this.__keyMap[item.__key]}`,
        label: Utils.isStringFilter(item.label, item.value, (Utils.isObject(item) ? index : item) + ''),
        title: Utils.isStringFilter(item.label, item.value, (Utils.isObject(item) ? index : item) + ''),
        value: Utils.isStringFilter(item.value, (Utils.isObject(item) ? index : item) + ''),
      }
      return option
    } else {
      return null
    }
  }

  @computed get convertedOption(): PathOption[] {
    this.__keyMap = {};
    return observable.array(this.todoConvertOption(this.__optionArr), { name: 'optionsList@', deep: false });
  }

  private todoConvertOption(option: any[], parentOption?: PathOption): PathOption[] {
    // console.time(`2displayOptionsNative${this.itemConfig.label}`)
    const result: PathOption[] = [];
    Utils.forEach(option, (o, index) => {
      const { itemConfig } = this;
      const baseOption: Option = this.toConvertedOption(o, index)
      if (baseOption) {
        const next = {
          ...baseOption,
          get disabled() {
            return itemConfig.loading
          },
          get path() {
            return `${this.parentOption ? `${this.parentOption.path}.children` : ''}[${result.length}]`
          },
          parentOption,
        }
        if (next.children) {
          next.children = this.todoConvertOption(next.children, next)
        }
        result.push(next);
      }
    });
    return result;
  }

  @computed get filterOptions(): Option[] {
    // trace()
    const { filterOptions } = this.itemConfig;
    return Utils.isNotEmptyArray(filterOptions)
      ? Utils.arrayFilterDive(this.convertedOption, (item: Option) => !filterOptions.includes(item.label)) : this.convertedOption;
  }

  @computed get getOptionsLabel() {
    return Utils.isFunctionFilter(this.itemConfig.getOptionsLabel, (option: Option) => option.label)
  }

  getTagByOption(option?: Option) {
    const { getTagByOption } = this.itemConfig
    return Utils.isFunction(getTagByOption) && getTagByOption(option || this.selectedOptions[0])
  }
}

export class OptionsStore<V = any, T = any> extends OptionsTransformerStore<V, T> {
  @observable shadowOption: Option = { key: Utils.uuid(), errorMsg: null, label: '', value: '', highlight: true };
  @computed get shadowOptionMode() {
    return this.itemConfig.code === this.itemConfig.nameCode ? 'text' : 'code';
  }
  /**
   * 录入值的自动转化
   */
  @action async setShadowOptionByValue(value: string, source: any) {
    const options = await this.itemConfig.getOptionsSafe();
    // if(this.itemConfig.label==='交强险承保单位')
    //   debugger
    const label = Utils.isStringFilter(Utils.valueToLabel(options, value), this.itemConfig.searchName);
    this.shadowUpdateDispatcher(label, value, source + 'byvaue');
  }
  /**
   * 录入值的自动转化
   */
  @action async setShadowOption(label: string, source: any) {
    await this.itemConfig.getOptionsSafe();
    // if(this.itemConfig.label==='交强险承保单位')
    //   debugger
    const value = this.labelToValue(label);
    this.shadowUpdateDispatcher(label, value, source);
  }

  public labelToValue(label: any) {
    return Utils.isStringFilter(Utils.labelToValue(this.displayOptions, new RegExp(`^(\\\[(.*)\\\]|)${Utils.escapeRegExp(label)}(\\\[(.*)\\\]|)$`)), label);
  }

  public async shadowUpdateDispatcher(label: any, value: any, source: any) {
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
  @action updateShadowOption(value: any, label: any = undefined) {
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
        const { allowCreate } = this.itemConfig;
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

  @computed get selectedItemIndex(): number {
    const value = Utils.isNotEmptyValueFilter(this.shadowOption.value, this.value);
    return findIndex(this.filterOptions, ({ value: v, label }) => {
      // debugger
      return Utils.isEqual(v, value) || (Utils.isEqual(label, value));
    });
  }
  @computed get displayOptions(): Option[] {
    return expr(() => {
      const { allowInput } = this.itemConfig;
      const defaultOptions = this.filterOptions;
      if (allowInput) {
        // debugger
        // console.log('getShadowOption', defaultOptions, this.shadowOption)
        if (this.selectedItemIndex > -1) {
          return Utils.arrayMapDive(defaultOptions,
            (option: Option, index: number) => this.selectedItemIndex === index ? { ...option, highlight: true } : option
          );
        } else if (Utils.isNotEmptyString(this.shadowOption.value) && !Utils.getOptionsByLabel(defaultOptions, this.shadowOption.label, true)) {
          // this.itemConfig.allowInput && console.log('shadowOption', {...this.shadowOption}, this)
          return Utils.concat(this.shadowOption, defaultOptions);
        }
      }
      return defaultOptions;
    }).slice(0)
  }

  @computed get nativeDisplayOptionList(): Option[] {
    return map(this.displayOptions, option => Utils.toJS(option))
  }
  @computed get transformOption(): (V | Option)[] {
    return this.transformer ? this.transformer(this) : this.nativeDisplayOptionList
  }
  @computed get nativeTransformOption(): Option[] {
    return map(this.transformOption, option => Utils.toJS(option))
  }

  valuesToLabels(value: any) {
    return Utils.valuesToLabels(this.displayOptions, value)
  }

  labelsToValues(label: any) {
    return Utils.labelsToValues(this.displayOptions, label)
  }

  @computed get selectedLables() {
    const { currentComponentValue: value } = this.itemConfig
    return Utils.zipEmptyData(Utils.isNotEmptyArrayFilter(this.valuesToLabels(value)) || [])
  }
  @computed get selectedOptions() {
    const { currentComponentValue: value } = this.itemConfig
    return Utils.zipEmptyData(Utils.isNotEmptyArrayFilter(Utils.getOptionsByValue(this.displayOptions, value)) || [])
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
  @computed get hasSelectedTag() {
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
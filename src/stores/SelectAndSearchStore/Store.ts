/* eslint-disable */
import { observable, computed, action, runInAction } from 'mobx';
import { EventStoreInject } from '@/stores/EventStore';
import { ItemConfigBase } from '../ItemConfig/ItemConfigBase';
import { ItemConfig } from '../ItemConfig/ItemConfig';
import { autobind, } from 'core-decorators';
import { OptionsStore2 } from './OptionsStore';
import Utils, { Option } from '../../utils';

import { last, toString, pullAllBy, some, pullAll, map, filter, concat, get } from 'lodash'
const _ = {
  last, toString, pullAllBy, pullAll, some, map, filter, concat, get
}

@EventStoreInject(['change', 'change-with', 'options-change'], { itemConfig: ItemConfigBase })
export class SelectAndSearchStore {
  [k: string]: any;
  @observable type = 'select';
  /**
   * @type { ItemConfig }
   */
  @observable itemConfig: ItemConfig;
  /**
   * @type { OptionsStore2 }
   */
  @observable OptionsStore2: OptionsStore2;
  @observable.ref searchEventEmitter: (...params: any[]) => Promise<any>;
  /**
   * 至今为止选择过的optionList
   * @type { Array }
   */
  @observable.ref selectedOptions: Option[] = [];
  @observable.ref value: string | string[];
  
  // shadowOptionObserve = observe(this.shadowOption, 'value', next => console.log('shadowOption', next))

  @computed get shadowOption() {
    return this.OptionsStore2.shadowOption || {}
  }

  @action.bound setShadowOption(label: any, source: any) {
    this.OptionsStore2.setShadowOption(label, source)
  }

  @action.bound setShadowOptionByValue(value: any, source: any) {
    this.OptionsStore2.setShadowOptionByValue(value, source)
  }

  @computed get displayOptions(): Option[] {
    return this.OptionsStore2.displayOptions || []
  }

  /**
   * 设置当前值
   * @param {string | Array<string>} value 
   * @param {string} source 
   */
  @action.bound setValue(value: any, source: any) {
    if (this.itemConfig.multiple) {
      const nextValue = Utils.zipEmptyData(Utils.castArray(value))
      if (!Utils.isEqual(nextValue, this.value)) {
        this.value = nextValue
      }
    } else {
      if (!Utils.isString(value))
        value = _.toString(value)
      if (value !== this.value) {
        this.value = value
        if (this.itemConfig.allowInput && value !== this.shadowOption.value) {
          this.OptionsStore2.setShadowOptionByValue(value, 'valueUpdate')
        }
      }
    }
  }

  /**
   * 设置配置
   * @param {'select' | 'search'} type 
   * @param { ItemConfig } itemConfig 
   */
  @action.bound setConfig(type: 'select' | 'search', itemConfig: ItemConfig) {
    this.type = ['select', 'search'].includes(type) ? type : 'select'
    this.itemConfig = (itemConfig instanceof ItemConfig) ? itemConfig : (Utils.isObject(itemConfig) ? new ItemConfig(itemConfig) : this.itemConfig)
    this.OptionsStore2 = new OptionsStore2(this.itemConfig)
    this.searchEventEmitter = Utils.createSimpleTimeBufferInput((keywordList: any[]) => {
      this.remoteMethod(_.last(keywordList))
    }, this, 300)
  }
  /**
   * 
   * @param { string | string[] } key 
   */
  @autobind searchMethods(key: string | string[]) {
    const keyArr = Utils.castArray(key);
    // console.log('keyword list', keyArr, this.selectedLables, key)
    if (Utils.isNotEmptyArray(keyArr) && (keyArr!== this.selectedLables) && !Utils.likeArray(keyArr, this.selectedLables)) {
      if (this.itemConfig.allowInput) {
        // debugger
        this.OptionsStore2.setShadowOption(Utils.castString(key), 'search')
      }
      this.searchEventEmitter(keyArr)
    }
  }

  @computed get placeholder() {
    switch (this.type) {
      case 'select': return Utils.isNotEmptyStringFilter(this.itemConfig.placeholder, '请选择' + (this.itemConfig.label || ''));
      case 'search': return Utils.isNotEmptyStringFilter(this.itemConfig.placeholder, '请输入关键字搜索...')
      default: return ''
    }
  }

  @computed get isSearch() {
    return this.type === "search"
  }
  @computed get hasNameCode() {
    return Utils.isNotEmptyString(this.itemConfig.nameCode)
  }
  @computed get useEmpty() {
    const { useHint, useEmpty } = this.itemConfig
    return Utils.isNil(useHint) && useEmpty !== false ? (options: Option[]) => options && options.length > 0 : () => false
  }

  @computed get isCenter() {
    return this.itemConfig.center === true
  }
  @computed get popperClass() {
    return (this.isCenter?'center':'')
  }


  /**
   * 远程搜索方法
   * @param {string | Array<string>} keyWord 搜索关键字，可以是数组
   */
  @action.bound async remoteMethod(keyWord: string | string[]) {
    // this.itemConfig.label=="受伤部位" && console.log('start remoteMethod', this.itemConfig.label, response)
    const { itemConfig } = this;
    // // this.itemConfig.label=="受伤部位" && console.log(this.itemConfig.remoteMethod)
    const { remoteSearch, multiple, setOptions, label } = itemConfig;
    const keyWordArr = Utils.zipEmptyData(Utils.castArray(keyWord));
    console.log('尝试搜索', label, keyWord, typeof keyWord, keyWordArr)
    // debugger
    const lastValue = Utils.cloneDeep(this.value)
    runInAction(async () => {
      if (Utils.isFunction(setOptions) && Utils.isFunction(remoteSearch)) {
        const nextOptions = await remoteSearch(keyWordArr)
        // 去除之前选择过的重复项
        if (!Utils.isNil(multiple))
          Utils.arrayPush(nextOptions, _.pullAllBy(this.selectedOptions, nextOptions, 'value'))
        setOptions(nextOptions)
        this.patchSelectedOption(nextOptions)
        // debugger
        // 如果输入的完整字符匹配到选项，自动选中
        // this.itemConfig.label=="受伤部位" && console.log('setOptions', this, setOptions, nextOptions)
        const selectedOptions = Utils.getOptionsByLabel(nextOptions, keyWordArr)
        if (selectedOptions.length > 0) {
          const selectValue = multiple
            ? Utils.zipEmptyData(_.concat(lastValue, _.map(selectedOptions, 'value')), true)
            : _.get(selectedOptions, '[0].value')
          console.log('搜索完毕', label, selectedOptions, selectValue, this.value)
          if (!Utils.likeArray(selectValue, Utils.castArray(this.value)))
            this.onChange(selectValue, 'options patch')
          // this.itemConfig.label=="手术名称" && console.log('搜索完毕', label, keyWordArr, itemConfig, nextOptions, this.selectedOptions, this.itemConfig.loading)
        }
      }
    })
  }

  @action.bound onChangeWithLabel(label: string) {
    const value = this.OptionsStore2.labelToValue(label);
    // console.log('onBlur', label, value, this.value)
    // if(Utils.isEqual(value, this.value)) {
    //   return
    // }
    return this.onChange(value, 'blur')
  }

  defaultCreater(value: string) {
    return ({ label: value, value })
  }

  @action.bound onChange(value: string | string[], source?: 'options patch' | 'options delete' | 'options' | 'blur' | 'select') {
    if (!Utils.isEqual(value, this.value)) {
      const { options, label, nameCode, allowCreate } = this.itemConfig;
      // 原始选项中是否选中
      const selectedObj = Utils.getOptionsByValue(options, value)
      // const { pull: pullList, push: pushList } = Utils.getListDifferent(this.value, value)
      // this.patchSelectedOption(pushList)
      // this.value = value
      const isSelected = selectedObj.length > 0
      const isAllowCreateOption = allowCreate && !isSelected && Utils.isNotEmptyValue(value) && this.OptionsStore2.isValidShadowOption

      console.log(`onChange by ${source} label: "${label}" value: "${value}" last-value: "${this.value}" allow-create:${isAllowCreateOption}`)
      if (isAllowCreateOption) {
        const additionOption = Utils.isFunctionFilter(allowCreate, this.defaultCreater)(value)
        if (Utils.getOptionsByValue(options, additionOption.value || additionOption).length == 0) {
          // this.itemConfig.label=="受伤部位" && console.log('update options additions',allowCreate, selectedObj)
          options.push(additionOption)
          selectedObj.push(additionOption)
          console.log('createOptions', additionOption)
          this.itemConfig.setOptions(options)
        }
        // this.itemConfig.setOptions(options.concat([{label: value, value}]))
      } else if(!isSelected && Utils.getOptionsByValue([this.shadowOption], value)){
        selectedObj.push(this.shadowOption)
      }
      // debugger
      if (Utils.isNotEmptyString(nameCode)) {
        // this.itemConfig.label=="受伤部位" && console.log('change-with', label, selectedObj)
        this.$emit('change-with', _.map(selectedObj, 'label').join(','), nameCode)
      }
      return this.$emit('change', value)
    }
  }

  @action.bound patchSelectedOption(pushOptionsList: Option[]) {
    // const { options } = this.itemConfig;
    this.selectedOptions = _.concat(this.selectedOptions,
      _.filter(pushOptionsList,
        item => !_.some(this.selectedOptions, option => option.value === item.value)
      )
    )
  }

  @computed get selectedLables() {
    return Utils.zipEmptyData(Utils.isNotEmptyArrayFilter(this.valuesToLabels(this.value)) || [this.shadowOption.label])
  }
  @computed get selectedLablesStr() {
    return this.selectedLables.join(',')
  }
  @computed get selectedLablesConfig() {
    return _.map(this.selectedLables, (label) => {
      return {
        label,
        remove: () => {
          console.log('close', this.value, this.labelsToValues(label))
          this.onChange(_.pullAll([...Utils.castArray(this.value)], this.labelsToValues(label)), 'options delete')
        }
      }
    })
  }
  @computed get hasSelectedTag(){
    return this.selectedLablesConfig.length > 0
  }
  /**
   * 格式化Label
   * @param { string } str 
   * @return { {prefix: string, label: string, suffix: string} } {prefix, label, suffix}
   */
  static getConvertLabel(str: string): { prefix: string; label: string; suffix: string; } {
    const [ prefix, label, suffix ] = Utils.isStringFilter(str, ',,').replace(/^(\[(.*?)\]|)(.*?)(\[(.*?)\]|)$/, '$2,$3,$5').split(',')
    return { prefix, label, suffix }
  }
  /**
   * @type {{ prefix: string, label: string, suffix: string }}
   */
  @computed get selectedLabelConveration() {
    return SelectAndSearchStore.getConvertLabel(this.selectedLablesStr)
  }
  /**
   * @type {{ prefix: string, label: string, suffix: string }}
   */
  @computed get shadowLabelConveration() {
    return SelectAndSearchStore.getConvertLabel(this.shadowOption.label)
  }

  @autobind labelsToValues(label: any) {
    return Utils.labelsToValues(this.isSearch ? this.selectedOptions : this.itemConfig.options as any, label)
  }

  @autobind valuesToLabels(value: any, joinKey?: string) {
    return Utils.valuesToLabels(this.isSearch ? this.selectedOptions : this.itemConfig.options as any, value, joinKey)
  }
}
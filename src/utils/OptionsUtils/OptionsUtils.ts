/* eslint-disable */
import { castArray, filter, find, isArray, isEqual, isFunction, isNil, isRegExp, join, map, some } from 'lodash';
import { ArrayIterator } from 'lodash';
import { isNotEmptyArray, isNotEmptyArrayStrict, isNotEmptyValue, typeFilterUtils } from '../TypeLib';
import { Utils } from '../Utils';
import { IKeyValueMap } from 'mobx';

export type SearchKey<T = any> = keyMatcher | RegExp | T[] | T
export type keyMatcher = (key?: string, arg1?: any, arg2?: any) => boolean;
export type Option = { 
  value?: string, 
  label?: string, 
  children?: Option[],
  disabled?: boolean,
  isLeaf?: boolean,
  [key: string]: any 
}
export type OptionBase = Option | string

/**
 * 提供匹配方法/正则/匹配项数组/其它，返回通用匹配方法
 * @param searchKey 
 */
export function createEqualsMatcher<K = any>(searchKey: SearchKey<K>): keyMatcher {
  if (isFunction(searchKey)) {
    return searchKey;
  } else if (isRegExp(searchKey)) {
    return function (key: string) {
      return searchKey.test(key)
    };
  } else if (isArray(searchKey)) {
    const searchMatcher = map(searchKey, key => createEqualsMatcher(key));
    return function (key) {
      return some(searchMatcher, match => match(key));
    }
  } else {
    return function (key) {
      return isEqual(searchKey, key)
    }
  }
}
/**
 * 
 * @param labelSearcher 
 * @param item 
 */
export function isLabelMatchedItem(labelSearcher: SearchKey<string>, item: Option): boolean {
  if (isNotEmptyValue(item)) {
    const { label, value } = item;
    const name = typeFilterUtils.isNotEmptyValueFilter(label, value, item);
    return createEqualsMatcher(labelSearcher)(name, value, item)
  }
  return false
}
/**
 * 
 * @param valueSearcher 
 * @param item 
 */
export function isValueMatchedItem(valueSearcher: SearchKey<string>, item: Option): boolean {
  if (isNotEmptyValue(item)) {
    const { label } = item;
    const value = typeFilterUtils.isNotEmptyValueFilter(item.value, item);
    return createEqualsMatcher(valueSearcher)(value, label, item)
  }
  return false
}

export type KeyMatcherFunc = (keyMatcher: keyMatcher, item: Option) => boolean
/**
 * @type { KeyMatcherFunc }
 * @param keyMatcher 
 * @param item 
 */
export function isValueMatchedItemByMatcher(keyMatcher: keyMatcher, item: Option): boolean {
  if (isNotEmptyValue(item)) {
    const { label } = item;
    const value = typeFilterUtils.isNotEmptyValueFilter(item.value, item);
    return keyMatcher(value, label, item)
  }
  return false
}

/**
 * @type { KeyMatcherFunc }
 * @param keyMatcher 
 * @param item 
 */
export function isLabelMatchedItemByMatcher(keyMatcher: keyMatcher, item: Option): boolean {
  if (isNotEmptyValue(item)) {
    const { label, value } = item;
    const name = typeFilterUtils.isNotEmptyValueFilter(label, value, item);
    return keyMatcher(name, value, item)
  }
  return false
}


export function safeGetOptions<T = Option, K = string>(
  optionList: T[],
  searchKey: SearchKey<K>,
  keyMatcherFunc: KeyMatcherFunc,
  single: boolean = false
): T | T[] | undefined {
  if (isNotEmptyArray(optionList)) {
    const keyMatcher = createEqualsMatcher(searchKey)
    return ((single ? find : filter)(
      optionList,
      item => keyMatcherFunc(keyMatcher, item))
    ) || (single ? undefined : []);
  }
  return (single ? undefined : []);
}


export function getOptionsByLabel<T = Option, K = string>(optionList: T[], searchName: SearchKey<K>): T[] | undefined
export function getOptionsByLabel<T = Option, K = string>(optionList: T[], searchName: SearchKey<K>, single: false | undefined): T[] | undefined
export function getOptionsByLabel<T = Option, K = string>(optionList: T[], searchName: SearchKey<K>, single: true): T | undefined
/**
 * 通过Label从optionList中获取匹配的option
 * @param optionList 
 * @param searchName 
 * @param single 
 */
export function getOptionsByLabel<T = Option, K = string>(optionList: T[], searchName: SearchKey<K>, single: boolean = false): T | T[] | undefined {
  return safeGetOptions<T, K>(optionList, searchName, isLabelMatchedItemByMatcher, single)
}

export function getOptionsByValue<T = Option, K = string>(optionList: T[], searchValue: SearchKey<K>): T[] | undefined
export function getOptionsByValue<T = Option, K = string>(optionList: T[], searchValue: SearchKey<K>, single: false | undefined): T[] | undefined
export function getOptionsByValue<T = Option, K = string>(optionList: T[], searchValue: SearchKey<K>, single: true): T | undefined
/**
 * 通过Value从optionList中获取匹配的option
 * @param optionList 
 * @param searchValue 
 * @param single 
 */
export function getOptionsByValue<T = Option, K = string>(optionList: T[], searchValue: SearchKey<K>, single?: boolean): T | T[] | undefined {
  return safeGetOptions(optionList, searchValue, isValueMatchedItemByMatcher, single)
}

/**
 * 
 * 通过Label或Value从optionList中获取匹配的option
 * @param optionList 
 * @param searchValue 
 * @param single 
 */
export function getOptionsByKey<T = Option, K = string>(optionList: T[], searchKey: SearchKey<K>, single: boolean = false): T | T[] | undefined {
  return safeGetOptions(optionList, searchKey, function (keyMatcher, item) {
    return isLabelMatchedItemByMatcher(keyMatcher, item) || isValueMatchedItemByMatcher(keyMatcher, item)
  }, single)
}

/**
 * 判断是否选择项
 * @param option 选项
 * @param searchLabel 选项显示名称
 * @param selectedValue 当前选择值
 */
export function isOptionsItemSelected<T, K>(option: T[], searchName: SearchKey<K>, selectedValue: SearchKey<K>): boolean {
  if (isNotEmptyArray(option)) {
    const items = getOptionsByValue(option, selectedValue, false);
    return !isNil(getOptionsByLabel(castArray(items), searchName, true))
  }
  return false;
}
/**
 * 
 * @param option 
 * @param searchName 
 */
export function optionsSelectedMatch<T, K>(option: T[], searchName: SearchKey<K>): keyMatcher {
  const itemList = getOptionsByLabel(option, searchName, false);
  if (isNotEmptyArrayStrict(itemList)) {
    return function (selectedValue) {
      return !isNil(getOptionsByValue(castArray(itemList), selectedValue, true))
    };
  }
  return function () { return false; };
}


export type RemoteSearcher = (key: string, isOnlySearch?: boolean) => Promise<Option[]>
export type OptionSearcher = (key?: string, isOnlySearch?: boolean) => Promise<Option[]>


/**
 * 
 * @param optionList 
 * @param label 
 */
export function labelToValue(optionList: Option[], label: SearchKey<string>): string | undefined {
  const i: Option | undefined = getOptionsByLabel<Option, string>(optionList, label, true)
  return ((i instanceof Object) && !Utils.isArray(i)) ? i.value : undefined
}

/**
 * 
 * @param optionList 
 * @param value 
 */
export function valueToLabel(optionList: Option[], value: SearchKey<string>): string | undefined {
  const i: Option | undefined = getOptionsByValue<Option, string>(optionList, value, true)
  return ((i instanceof Object) && !Utils.isArray(i)) ? i.label : undefined
}


export function valuesToLabels(options: Option[], value: SearchKey<string>): string[];
export function valuesToLabels(options: Option[], value: SearchKey<string>, joinKey: string): string;
/**
 * 批量转换value到label
 * @param options 
 * @param value 
 * @param joinKey 
 */
export function valuesToLabels(options: Option[], value: SearchKey<string>, joinKey?: string): string | string[] {
  const result: string[] = Utils.isArrayFilter(typeFilterUtils.isArrayFilter(
    Utils.arrayMapToKeysDive(
      getOptionsByValue(options, value) || [],
      'label'
    ), []
  )) || []
  return !isNil(joinKey) ? join(result, joinKey) : result
}

export function labelsToValues(options: Option[], label: SearchKey<string>): string[];
export function labelsToValues(options: Option[], label: SearchKey<string>, joinKey: string): string
/**
 * 批量转换label到value
 * @param options 
 * @param label 
 * @param joinKey 
 */
export function labelsToValues(options: Option[], label: SearchKey<string>, joinKey?: string): string | string[] {
  const result: string[] = Utils.castArray(typeFilterUtils.isArrayFilter(
    Utils.arrayMapToKeysDive(
      getOptionsByLabel(options, label) || [],
      'value'
    ), []
  ))
  return !isNil(joinKey) ? join(result, joinKey) : result
}



export function getCodeListByKey(codeType: Option[]): RemoteSearcher
export function getCodeListByKey(codeType: OptionSearcher, optionFactory?: ArrayIterator<IKeyValueMap, Option>): RemoteSearcher
/**
 * 
 * @param codeType 
 * @param valueLabel 
 * @param valueKey 
 */
export function getCodeListByKey(codeType: Option[] | OptionSearcher, optionFactory?: ArrayIterator<IKeyValueMap, Option>): RemoteSearcher {
  // debugger
  const { isArrayFilter } = typeFilterUtils
  if (isArray(codeType)) {
    return async function (keyWord: string, isOnlySearch?: boolean): Promise<Option[]> {
      if (isOnlySearch && !Utils.isNotEmptyString(keyWord)) {
        return codeType
      }
      return castArray(getOptionsByKey(codeType, new RegExp(Utils.escapeRegExp(keyWord))))
    }
  } else if (isFunction(codeType)) {
    return async function (keyWord: string, isOnlySearch?: boolean): Promise<Option[]> {
      const res = isArrayFilter(await codeType(keyWord, isOnlySearch)) || [];
      return optionFactory ? map(res, optionFactory): res
    }
  }
  return async function () { return [] }
}

export function convertValueOption(valueList: string[], isFull: boolean = false): Option[] {
  return map(valueList, value => Object.assign({value}, isFull?{label: value}: {}))
}

export default {
  getCodeListByKey,
  getOptionsByLabel,
  getOptionsByValue,
  isOptionsItemSelected,
  createEqualsMatcher,
  isLabelMatchedItem,
  valueToLabel,
  labelToValue,
  valuesToLabels,
  labelsToValues,
  isValueMatchedItem,
  isLabelMatchedItemByMatcher,
  isValueMatchedItemByMatcher,
  optionsSelectedMatch,
  convertValueOption
}

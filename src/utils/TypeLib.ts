/* eslint-disable */
import { EventEmitter } from './EventEmitter';
import { filter, isArray, isBoolean, isArrayLike, isEmpty, isFunction, isNaN, isNil,isDate, 
  isNumber as isNumberLodash, isObject, isString, map, values, trim } from 'lodash';
import { toJS, IKeyValueMap } from 'mobx';
import { Utils } from '.'
// Array.prototype.map = ()
/**
 * 是否为空或异常值，不包括0
 * 空值: null/undefined/''
 * 不包括空对象/空数组
 * @param {*} value
 */
export function isEmptyValue(value: any): value is '' | null | undefined {
  return (Utils.isString(value) && trim(value) === '') || isNil(value) || isNaN(value);
}
/**
 * 是否非空且非异常值，不包括0
 * 空值: null/undefined/''
 * 不包括空对象/空数组
 * @param {*} value
 */
export function isNotEmptyValue(value: any): boolean {
  return !isEmptyValue(value);
}

export function isNumber(value: any): value is number {
  return isNumberLodash(value) && !isNaN(value);
}
export function isBooleanOrNumber(value: any): value is (boolean | number) {
  return isBoolean(value) || isNumber(value);
}
export function isEmptyArray(value: any): value is boolean {
  return isArray(value) && isEmpty(value);
}
export function isNotEmptyArray(value: any): value is any[] {
  return isArray(value) && !isEmpty(value);
}
export function isNotEmptyArrayStrict(value: any): value is any[] {
  return isArray(value) && filter(value, i => isNotEmptyValue(i)).length > 0;
}
export function isEmptyArrayStrict(value: any): value is any[] {
  return isArray(value) && filter(value, i => isNotEmptyValue(i)).length === 0;
}
export function isEmptyData(value: any): value is any[] {
  return !isBoolean(value) && !isNumberLodash(value) && (isEmptyArrayStrict(value) || isEmpty(value));
}
export function isNotEmptyData(value: any): boolean {
  return isBoolean(value) || isNumberLodash(value) || !(isEmptyArrayStrict(value) || isEmpty(value));
}
export function isEmptyObject(value: any, checkValue: boolean = false): value is {} {
  return isObject(value) && !isArray(value) && (checkValue ? filter(values(value), v => isNotEmptyData(v)).length === 0 : isEmpty(value));
}
export function isNotEmptyObject(value: any): value is object {
  return isObject(value) && !isArray(value) && !isEmpty(value);
}
export function isEventEmitter(emitter: any): boolean {
  return emitter instanceof EventEmitter;
}
export const typeUtils = {
  isArrayLike,
  isArray,
  isBoolean,
  isObject,
  // isObject<T extends object>(value?: any): value is T {
  //   return isObject(value); // && !isArray(value)
  // },
  isNumber,
  isString,
  isEmptyData,
  isNotEmptyData,
  isEventEmitter,
  /**
   * 判断非空字符串
   * @param {*} str
   */
  isNotEmptyString(str: any): str is string {
    return isString(str) && str.length > 0;
  },
  isFunction,
  isNotFunction(func: any) {
    return !isFunction(func);
  },
  isNil,
  isDate,
  isNaN,
  isNotNaN(v: any): boolean {
    return !isNaN(v);
  },
  isNilAll(...valueArr: any[]): boolean {
    return filter(map(valueArr, value => isNil(value)), is => is).length === valueArr.length;
  },
  isBooleanOrNumber,
  isEmptyValue,
  isNotEmptyValue,
  isEmptyArray,
  isNotEmptyArray,
  isEmptyArrayStrict,
  isNotEmptyArrayStrict,
  isEmptyObject,
  isNotEmptyObject,
  toJS
};

import { assign, reduce } from 'lodash';
export type FilterFunction<T = any> = <ST = T>(...key: (any | ST | T )[]) => ST | T | undefined
export type FilterArrayFunction = <T = any>(...key: any[]) => Array<T> | undefined
export type FilterFunctionGroup = IKeyValueMap<FilterFunction>
export function todoFilter(handler: (v: any) => boolean): FilterFunction {
  function Filter<T>(...values: any[]): T | undefined {
    for (const v of values) {
      if (handler(v)) {
        return v;
      }
    }
    return undefined;
  };
  return Filter
}

export interface ITypeFilterUtils {
  isNumberFilter: FilterFunction<number>;
  isBooleanFilter: FilterFunction<boolean>;
  isStringFilter: FilterFunction<string>;
  isNotEmptyStringFilter: FilterFunction<string>;
  isArrayFilter: FilterArrayFunction; 
  isObjectFilter: FilterFunction; 
  isNotEmptyArrayFilter: FilterArrayFunction;  
  isNotEmptyValueFilter: FilterFunction<boolean | string | number | any>;
  isFunctionFilter: FilterFunction<(...arg: any[]) => any>
}
/**
 * 
 */
export const typeFilterUtils: ITypeFilterUtils = reduce<IKeyValueMap<(v: any) => boolean>, any>(
  typeUtils, 
  function (group, func: (v: any) => boolean, key) {
    return assign(group, { 
      [key + "Filter"]: todoFilter(func) 
    });
  }, 
  {}
);
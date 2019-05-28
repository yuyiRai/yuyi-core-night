/* eslint-disable */
import { assign, concat, differenceWith, find, filter, isArray, isEqual, join, keys, reduce, values } from 'lodash';
import Utils from './';
import CommonDto from "./CommonDto";
import { IKeyValueMap } from 'mobx';

export function zipEmptyData<T = any>(object: (T | undefined | null)[], isRemoveRepeat?: boolean): T[];
export function zipEmptyData<T = any>(object: IKeyValueMap<T | undefined | null>, isRemoveRepeat?: boolean): IKeyValueMap<T>;
export function zipEmptyData<T = any>(object: IKeyValueMap<T | undefined | null> | (T | undefined | null)[], isRemoveRepeat = true): IKeyValueMap<T> | T[] {
  return isArray(object)
    ? Utils.pipe(filter(object, v => Utils.isNotEmptyValue(v)), (list: any[]) => Utils.jsxIf(isRemoveRepeat, Array.from(new Set(list)), list))
    : reduce<any, any>(filter(keys(object), (k) => Utils.isNotEmptyValue(object[k])), (o, key) => assign(o, { [key]: object[key] }), {});
}

export const CustomUtils = {
  uuid() {
    const s: any[] = [];
    const hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    return s.join("");
  },
  createObjectKey(obj: any) {
    return join(concat(keys(obj), values(obj)));
  },
  pipe(data: any, ...funcArr: any[]) {
    return reduce(funcArr, (value, func) => (Utils.isFunctionFilter(func) || Utils.stubFunction)(value), data);
  },
  zipEmptyData,
  zipEmptyDataNative(object: any) {
    return isArray(object)
      ? object.filter(v => Utils.isNotEmptyValue(v))
      : Object.keys(object)
        .filter(k => Utils.isNotEmptyValue(object[k]))
        .reduce((o, k) => Object.assign(o, {
          [k]: object[k]
        }), {});
  },
  downloadFile(fileId: string, fileName: string) {
    const a = document.createElement('a');
    a.href = `/api/file/get?id=${fileId}`;
    a.download = fileName || fileId;
    a.click();
    a.remove();
  },
  // 判断两个数组是否无序相等
  likeArray(arr: any[], array: any[]) {
    // if the other array is a falsy value, return
    if (!Utils.isArray(array) || !Utils.isArray(arr))
      return false;
    // compare lengths - can save a lot of time 
    if (arr.length != array.length)
      return false;
    for (const v of arr) {
      if (Utils.isNil(find(array, (item: any) => Utils.isEqual(item, v)))) {
        return false;
      }
    }
    return true;
  },
  getDtoOrFormValue(key: string, formOrDto: any) {
    if (formOrDto instanceof CommonDto) {
      return formOrDto.get(key);
    }
    else if (Utils.isObject(formOrDto)) {
      return formOrDto[key];
    }
    else {
      return undefined;
    }
  },
  jsGetAge(strBirthday: string) {
    var returnAge;
    var strBirthdayArr = strBirthday.split("-");
    var birthYear = strBirthdayArr[0];
    var birthMonth = strBirthdayArr[1];
    var birthDay = strBirthdayArr[2];
    var d = new Date();
    var nowYear = d.getFullYear();
    var nowMonth = d.getMonth() + 1;
    var nowDay = d.getDate();
    if (nowYear+'' == birthYear) {
      returnAge = 0; //同年 则为0岁
    }
    else {
      var ageDiff = nowYear - parseInt(birthYear); //年之差
      if (ageDiff > 0) {
        if (nowMonth+'' == birthMonth) {
          var dayDiff = nowDay - parseInt(birthDay); //日之差
          if (dayDiff < 0) {
            returnAge = ageDiff - 1;
          }
          else {
            returnAge = ageDiff;
          }
        }
        else {
          var monthDiff = nowMonth - parseInt(birthMonth); //月之差
          if (monthDiff < 0) {
            returnAge = ageDiff - 1;
          }
          else {
            returnAge = ageDiff;
          }
        }
      }
      else {
        returnAge = -1; //返回-1 表示出生日期输入错误 晚于今天
      }
    }
    return returnAge; //返回周岁年龄
  },
  connectTo(target: any, source: any, ...keyNames: any[]) {
    if (Utils.isNil(target) || Utils.isNil(source)) {
      return false;
    }
    if (keyNames.length == 0) {
      keyNames = Object.keys(source);
    }
    for (const keyName of keyNames) {
      if (!Object.getOwnPropertyDescriptor(target, keyName))
        Object.defineProperty(target, keyName, {
          get() {
            return source[keyName];
          },
          set(value) {
            source[keyName] = value;
          }
        });
    }
    return true
  },
  getListDifferent(listA: any[], listB: any[], deep = false) {
    return {
      push: differenceWith(listB, listA, deep ? ((a, b) => isEqual(a, b)) : []),
      pull: differenceWith(listA, listB, deep ? ((a, b) => isEqual(a, b)) : [])
    };
  },
  createCommonDto(model: any) { return new CommonDto(model); },
  /**
   * 代码解释器，返回getInnerWarpField解释数组
   * @param { string } keyStr
   * @param { any } defaultValue
   * @return { [][] } 二维数组
   */
  getExpressByStr(keyStr: string, defaultValue: any) {
    const paramList: string[][] = [
      ...((keyStr.match as any)(/(.*?)\.|(.*?)\[(.*)\]|(.+?)$/ig, ''))
    ].map((i: string) => i.split(/\[|\]|\[\]|\./ig).filter((i: string) => !['', '.'].includes(i)));
    return reduce<any[], any[]>(paramList, (list, [prototeryName, ...indexList], reduceIndex, reduceList) => {
      return list.concat([
        [prototeryName, indexList.length > 0 ? [] : (reduceIndex < reduceList.length - 1 ? {} : defaultValue)],
        ...indexList.map((i, index) => {
          return [parseInt(i), (index < indexList.length - 1 ? [] : ((index === indexList.length - 1 && reduceIndex === reduceList.length - 1) ? defaultValue : {}))];
        })
      ]);
    }, []);
  },
  /**
   * 从对象中提取成员，不存在则新建一个成员（默认为一个空对象）
   * 初始值可用[成员名|初始值]的形式来自定义
   * 提取对象逐渐深入，一个对象一次只能提取一个成员（或他的子成员的子成员）
   * @param { {} } main
   * @param  {...(string | [string, string | [] | {}])} proteryNames
   */
  getPropertyFieldByCreate(main: any, ...proteryNames: any[]) {
    const { isObject, isEmptyValue, isNotEmptyArray, isString } = Utils;
    return reduce(proteryNames, function (final, next, index, list) {
      if (!isObject(next)) {
        return undefined;
      }
      else if (isNotEmptyArray(next)) {
        const [keyName, defaultValue] = next;
        if (isEmptyValue(final[keyName])) {
          final[keyName] = (defaultValue === undefined ? (index < list.length - 2 ? {} : undefined) : defaultValue);
        }
        return final[keyName];
      }
      else if (isString(next)) {
        if (isEmptyValue(final[next])) {
          final[next] = {};
        }
        return final[next];
      }
      else {
        return undefined;
      }
    }, main);
  },
  getPropByPath(obj: any, path: any, strict = false) {
    var tempObj = obj;
    path = path.replace(/\[(\w+)\]/g, '.$1');
    path = path.replace(/^\./, '');
    var keyArr = path.split('.');
    var i = 0;
    for (var len = keyArr.length; i < len - 1; ++i) {
      if (!tempObj && !strict)
        break;
      var key = keyArr[i];
      if (key in tempObj) {
        tempObj = tempObj[key];
      }
      else {
        if (strict) {
          throw new Error('please transfer a valid prop path to form item!');
        }
        break;
      }
    }
    return {
      o: tempObj,
      k: keyArr[i],
      v: tempObj ? tempObj[keyArr[i]] : null
    };
  }
};
export default CustomUtils
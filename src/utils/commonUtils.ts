/* eslint-disable */
import {
  castArray, cloneDeep, forEach, isEqual, isFunction,
  isRegExp, concat, isString, keys, last, property, reduce, escapeRegExp,
  stubArray, takeRight, toArray, toString, values
} from 'lodash';
import { EventEmitter } from './EventEmitter';
import { HttpBox } from './HttpBox';
import Utils from '.';
import { typeFilterUtils } from './TypeLib';
import { IKeyValueMap } from 'mobx';

// const _ = {
//   filter,map,forEach
// }

if (!Object.keys) {
  Object.keys = keys
}
declare global {
  export interface Object {
    values: typeof values;
  }
}
if (!Object.values) {
  Object.values = values
}

export function jsxIf(bool: any, when: any, elseValue?: any) {
  if ((Utils.isFunctionFilter(bool) || (() => bool))()) {
    return when;
  } else {
    return elseValue
  }
}

export default {
  jsxIf,
  stubArray: stubArray,
  stubFunction(...args: any[]) { },
  stubObject() {
    return {};
  },
  /**
   * cast computed
   * @param {*} functionOrValue 
   * @param  {...any} computedArgs 计算用参数 
   */
  castComputed<T>(functionOrValue: T extends Function ? T : any, ...computedArgs: any[]) {
    return isFunction(functionOrValue) ? functionOrValue(...computedArgs) : functionOrValue
  },
  castFunction(value: any) {
    return isFunction(value) ? value : function () { return value; };
  },
  castString(value: any) {
    return isString(value) ? value : toString(value)
  },
  argShifter(todoFunc: any, startIndex = 1) {
    return function (...args: any[]) {
      return todoFunc(...takeRight(args, args.length - startIndex))
    }
  },
  modelValidator<T>(fieldName: any, validator: any) {
    const fieldSearcher = property<any, string>(fieldName)
    if (isRegExp(validator)) {
      return (model: T) => validator.test(fieldSearcher(model));
    } else if (isFunction(validator)) {
      return (model: T) => validator(fieldSearcher(model), model, fieldName, validator);
    } else {
      return (model: T) => isEqual(fieldSearcher(model), validator)
    }
  },
  getTestArray(length: number) {
    const arr = []
    for (let i = length; i > 0; i--) {
      arr[i - 1] = i
    }
    return arr
  },
  arrayMap(array: any[], iteratee: any) {
    var length = array.length;
    var result = Array(length);
    while (length--) {
      result[length] = iteratee(array[length], length);
    }
    return result;
  },
  arrayMap2(array: any[], iteratee: any) {
    var rLength = array.length % 8, length = rLength, pLength = array.length - rLength, result = Array(array.length);
    while (length--) {
      result[length] = iteratee(array[length], length);
    }
    while (pLength--) {
      var index = rLength + pLength
      result[index] = iteratee(array[index], index);
    }
    return result;
  },
  arrayMap3(array: any[], iteratee: any) {
    var index = -1, length = array.length, result = Array(length);
    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  },
  arrayMapDive(array: any[], iteratee: any) {
    let rLength = array.length % 8, length = rLength, pLength = (array.length - rLength), result = Array(array.length);
    while (length--) {
      if (array[length])
        result[length] = iteratee(array[length], length, array);
    }
    while (pLength) {
      let wlength = 8
      const tmp = rLength + pLength;
      while (wlength) {
        const index = tmp - wlength--
        if (array[index])
          result[index] = iteratee(array[index], index, array);
      }
      pLength -= 8
    }
    return result;
  },
  arrayMapToKeysDive(array: any[], key: any) {
    let rLength = array.length % 8, length = rLength, pLength = (array.length - rLength), result = Array(array.length);
    while (length--) {
      result[length] = Utils.isObject(array[length]) ? array[length][key] : undefined;
    }
    while (pLength) {
      let wlength = 8
      const tmp = rLength + pLength;
      while (wlength) {
        const index = tmp - wlength--
        result[index] = Utils.isObject(array[index]) ? array[index][key] : undefined;
      }
      pLength -= 8
    }
    return result;
  },
  arrayForEachDive(array: any[], iteratee: any) {
    let rLength = array.length % 8, length = rLength, pLength = (array.length - rLength);
    while (length--) {
      iteratee(array[length], length, array);
    }
    while (pLength) {
      let wlength = 8
      const tmp = rLength + pLength;
      while (wlength) {
        const index = tmp - wlength--
        iteratee(array[index], index, array);
      }
      pLength -= 8
    }
  },
  arrayPush(array: any[], values: any[]) {
    const values2 = values
    let index = 0,
      length = values2.length,
      offset = array.length;

    while (index < length) {
      // debugger
      array[offset + index] = values2[index++];
    }
    return array;
  },
  arrayPushDive(arrayTarget: any[], array: any[]) {
    const rLength = array.length % 8, tLength = values.length
    let length = rLength, pLength = array.length - rLength, offset = 0
    while (length--) {
      arrayTarget[tLength + offset++] = array[rLength - length - 1]
    }
    const maxPlangth = rLength + pLength + 8
    while (pLength) {
      const tmp = maxPlangth - pLength;
      let length = 8
      while (length) {
        arrayTarget[tLength + offset++] = array[tmp - length--]
      }
      pLength -= 8
    }
  },
  // test(length: number, pi = 8) {
  //   var test = Utils.getTestArray(length)
  //   var test2 = (item: any, index: any) => item > length / 2
  //   var test3 = (item: any, index: any) => Utils.arrayMapDive(test, test2)
  //   setTimeout(() => {
  //     console.time('arrayMap')
  //     Utils.arrayMap(test, test3)
  //     console.timeEnd('arrayMap')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('arrayMap2')
  //     Utils.arrayMap2(test, test3)
  //     console.timeEnd('arrayMap2')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('arrayMap3')
  //     Utils.arrayMap3(test, test3)
  //     console.timeEnd('arrayMap3')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('arrayMapDive')
  //     Utils.arrayMapDive(test, test3)
  //     console.timeEnd('arrayMapDive')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('_.map')
  //     _.map(test, test3)
  //     console.timeEnd('_.map')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('arrayFilter')
  //     Utils.arrayFilter(test, test3)
  //     console.timeEnd('arrayFilter')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('arrayFilterDive')
  //     Utils.arrayFilterDive(test, test3)
  //     console.timeEnd('arrayFilterDive')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('_.filter')
  //     _.filter(test, test3)
  //     console.timeEnd('_.filter')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('arrayForEachDive')
  //     var r8 = []
  //     Utils.arrayForEachDive(test, (item: any, index: any) => {
  //       r8.push(test3(item, index))
  //     })
  //     console.timeEnd('arrayForEachDive')
  //   }, 0)
  //   setTimeout(() => {
  //     console.time('_.forEach')
  //     var r8 = []
  //     _.forEach(test, (item, index) => {
  //       r8.push(test3(item, index))
  //     })
  //     console.timeEnd('_.forEach')
  //   }, 0)
  // },
  arrayFilter(array: any[], predicate: any) {
    let length = array.length
    const result = [];
    while (length--) {
      const value = array[length]
      predicate(value, length, array) && result.push(value);
    }
    return result;
  },
  arrayFilterDive(array: any[], iteratee: any) {
    let rLength = array.length % 8, length = rLength, pLength = (array.length - rLength), result = [];
    while (length--) {
      const index = rLength - length - 1
      iteratee(array[index], index, array) && result.push(array[index]);
    }
    let maxPlangth = rLength + pLength + 8
    while (pLength) {
      let wlength = 8
      const tmp = maxPlangth - pLength
      while (wlength) {
        const index = (tmp - wlength--)
        iteratee(array[index], index, array) && result.push(array[index]);
      }
      pLength -= 8
    }
    return result;
  },
  validateModelField(model: any, fieldName: any, validator: any) {
    return Utils.modelValidator(fieldName, validator)(model)
  },
  castArray(value: any, allowEmpty = true) {
    return allowEmpty ? castArray(value) : (Utils.isNotEmptyValue(value) ? castArray(value) : [])
  },
  castObjectArray(objOrArr: any[], allowEmpty = true): any[] {
    return typeFilterUtils.isArrayFilter(
      objOrArr,
      allowEmpty
        ? Utils.isObject(objOrArr) && [objOrArr]
        : Utils.isNotEmptyObject(objOrArr) && [objOrArr],
    ) || []
  },
  createGroupWith<T = any>(list: T[], keyOrWith: string | ((item: T) => string)): IKeyValueMap<T[]> {
    return reduce(Utils.isArrayFilter(list, []), function (map, item) {
      const mapKey = isString(keyOrWith) ? item[keyOrWith] : (isFunction(keyOrWith) ? keyOrWith(item) : "default")
      map[mapKey] = typeFilterUtils.isArrayFilter(map[mapKey], [])
      map[mapKey].push(item)
      return map;
    }, {})
  },
  getEventEmitter() {
    return new EventEmitter()
  },
  waitingPromise<V = any>(time: number, emitValue?: any, isError = false): Promise<V> {
    return new Promise((resolve, reject) => {
      setTimeout(isError ? reject : resolve, time, emitValue);
    })
  },
  /**
   * 组件返回
   * @param { { $router: any, $route: any } } instance 
   * @param {*} params 
   * @param { boolean } isConfirm 是否是经过确认的离开
   */
  pathReturn(instance: any, params: any, isConfirm: any, useBack: any) {
    if (useBack) {
      return instance.$router.back()
    }
    const { query = {}, path: pathSet = undefined, ...other } = Utils.isObjectFilter(params) || {}
    const path = instance.$route.path.split('\/');
    path.pop() // 吐出当前页
    instance.$router.push({
      ...other,
      path: path.join('\/'),
      query: {
        ...typeFilterUtils.isObjectFilter(query, {}),
        force: isConfirm === false || isConfirm === true
        // cb: instance.$route.query.cb || new Date().getTime(),
        // tpp: instance.$route.query.tpp,
      }
    })
  },
  HttpBox,
  testEmitter: new EventEmitter(),
  last,
  cloneDeep,
  toArray,
  toString,
  isEqual<A = any, B = any>(valueA: A | any, valueB: B | any, noStrict: boolean = false): boolean {
    const ia = Utils.isNotEmptyValueFilter
    if (noStrict) {
      return ia(valueA) === ia(valueB) || isEqual(ia(valueA), ia(valueB))
    } else if(valueA === valueB) {
      return true
    }
    return isEqual(valueA, valueB)
  },
  reduce,
  forEach,
  concat,
  escapeRegExp
}
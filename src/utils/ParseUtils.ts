import { isDate } from "lodash";
import moment from "moment";
import { typeUtils } from "./TypeLib";

/**
* Created by jiachenpan on 16/11/18.
*/

export function parseTime(time: any, cFormat?: string) {
 if (arguments.length === 0) {
   return null
 }
 const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
 let date: any
 if (typeof time === 'object') {
   date = time
 } else {
   if (('' + time).length === 10) time = parseInt(time) * 1000
   date = new Date(time)
 }
 const formatObj = {
   y: date.getFullYear(),
   m: date.getMonth() + 1,
   d: date.getDate(),
   h: date.getHours(),
   i: date.getMinutes(),
   s: date.getSeconds(),
   a: date.getDay()
 }
 const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
   let value = formatObj[key]
   if (key === 'a') return ['一', '二', '三', '四', '五', '六', '日'][value - 1]
   if (result.length > 0 && value < 10) {
     value = '0' + value
   }
   return value || 0
 })
 return time_str
}

export enum EDateFormatter {
  date = 'YYYY-MM-DD',
  dateTime = 'YYYY-MM-DD HH:mm:ss'
}
export type DateFormatter = EDateFormatter | string
export function toDateString(value: any, formatter: DateFormatter = EDateFormatter.dateTime): Date | string {
  if (isDate(value)) {
    return moment(value).format(formatter)
  } else if (typeUtils.isNotEmptyString(value)) {
    const date = moment(value)
    if (date.isValid()) {
      return date.format(formatter)
    }
  }
  return moment().format(formatter)
}

/**
 * 获得字符串实际长度，中文占2，英文占1
 * @param str 字符串
 */
export function getRealLength(str: string) {
  var realLength = 0, len = str.length, charCode = -1;
  for (var i = 0; i < len; i++) {
    charCode = str.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128)
      realLength += 1;
    else
      realLength += 2;
  }
  return realLength;
}
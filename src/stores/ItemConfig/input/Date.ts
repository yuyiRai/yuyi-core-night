import { map } from 'lodash';
import Utils from '../../../utils';
import { IItemConfig, RuleConfigMap } from '../interface';

export const checkDateToDate = <V, FM>(date: any, itemConfig: IItemConfig<FM, V>) => ((rule: any, value: any, callback: any) => {
  console.log('testt, check', value, itemConfig)
  const [start, end] = Utils.isArrayFilter(value, map(itemConfig.code.split('|'), code => itemConfig.formSource[code]))
  if (!Utils.isNil(start) && !Utils.isNil(end) && itemConfig.type === 'dateToDate') {
    console.log('testt, check', [start, end], itemConfig)
    // console.log(start,end,value)
    if(Utils.isNotEmptyValue(end) && Utils.isNotEmptyValue(start)){
      const endTime = new Date(end).getTime()
      const startTime = new Date(start).getTime()
      if ((endTime - startTime) > 30 * 1000 * 60 * 60 * 24) {
        console.error(`${itemConfig.label}时长超出${date}天`)
        return callback(new Error(`${itemConfig.label}时长超出${date}天！`));
      } else if(endTime < startTime){
        return callback(new Error(`${itemConfig.label}截止时间不能早于起始时间！`));
      }
    }
  }
  // console.log('回调3', value)
  return callback();
})

export const checkFutureDate = <V, FM>(itemConfig: IItemConfig<FM, V>) => ((rule: any, value: any, callback: any) => {
  if (Utils.isNotEmptyValue(value) && new Date().getTime() > new Date(value).getTime()) {
    return callback(new Error(`${itemConfig.label}不能早于当前时间`));
  }
  return callback();
})

export const getDefaultRules = function<V, FM>(itemConfig: IItemConfig<FM, V>): RuleConfigMap<V, FM> {
  return {
    dateToDate30: [{
      validator: checkDateToDate(30, itemConfig),
      trigger: ['change'],
    }],
    futureDate: [{
      validator: checkFutureDate(itemConfig),
      trigger: 'change'
    }]
  }
}

export const DateUtils = {
  getDateRange(days: number) {
    const end = new Date();
    const start = new Date();
    start.setTime(start.getTime() - 3600 * 1000 * 24 * days);
    return [start, end]
  }
}
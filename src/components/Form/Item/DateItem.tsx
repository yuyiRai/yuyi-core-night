import Utils from '@/utils';
// import DatePicker from 'antd/lib/date-picker';
import { DatePicker } from 'antd';
import { DatePickerProps, RangePickerProps } from 'antd/lib/date-picker/interface';
import zh_CN from 'antd/lib/date-picker/locale/zh_CN';
// import 'antd/lib/date-picker/style/css';
import moment from 'moment';
import 'moment/locale/zh-cn';
import * as React from 'react';
import { VueWrapper } from 'vuera';
import { ItemConfig } from '../../../stores';
import { useFormItemConfig } from '../hooks/useItemConfig';
import { OFormItemCommon } from '../Interface/FormItem';
import { ElDatePickerItem } from './VueItem/DateItem';
import { useObserver } from '@/hooks';

moment.locale('zh-cn');

const { RangePicker } = DatePicker


export const useDatePickerItem = ({ code, ...other }: IDatePickerProps, ref: any) => {
  return useObserver(() => {
    const { itemConfig } = useFormItemConfig()
    // console.log(other)
    return <VueWrapper ref={ref} component={ElDatePickerItem} {...other} itemConfig={itemConfig.export()}></VueWrapper>
  })
  // return <DatePicker {...other}/>
}

export type IDatePickerProps = OFormItemCommon & DatePickerProps


export const useDateRangePickerItem = ({ code, ...other }: IDateRangePickerProps, ref: any) => {
  return useObserver(() => {
    const { itemConfig } = useFormItemConfig()
    // console.log(other, itemConfig)
    return <VueWrapper ref={ref} component={ElDatePickerItem} {...other} itemConfig={itemConfig.export()}></VueWrapper>
  })
  // return <RangePicker showTime format="YYYY-MM-DD HH:mm:ss" locale={zh_CN} {...other} defaultPickerValue={itemConfig.defaultValue} ranges={defaultDateRangeList}/>
}
export type IDateRangePickerProps = OFormItemCommon & RangePickerProps

export interface IDatePickerSwitchProps extends IDateRangePickerProps {
}

export default class DatePickerSwitch extends React.Component<IDatePickerSwitchProps, any> {
  get itemConfig(): ItemConfig | any {
    return this.props.itemConfig || {}
  }
  get placeholder() {
    const { placeholder, label } = this.itemConfig
    return placeholder ? placeholder : ('请选择' + label)
  }
  get useTime() {
    const { time, type } = this.itemConfig
    return Utils.isEqual(type, 'dateTime') || Utils.isBooleanFilter(time, false)
  }
  get dateFormatStr() {
    return Utils.isNotEmptyValueFilter(
      this.itemConfig.format,
      `yyyy-MM-dd${this.useTime ? ' HH:mm:ss' : ''}`
    )
  }
  public render() {
    return (
      <RangePicker locale={zh_CN}></RangePicker>
    );
  }
}


export const MomentUtils = {
  getDateRangeMoment(days: number) {
    const end = new Date();
    const start = new Date();
    start.setTime(start.getTime() - 3600 * 1000 * 24 * days);
    return [start, end].map(v => moment(v))
  }
}
export const defaultDateRangeList = {
  '最近一周': MomentUtils.getDateRangeMoment(7),
  '最近一个月': MomentUtils.getDateRangeMoment(30),
}
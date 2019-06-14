/* eslint-disable */
import { set } from 'lodash';
import Utils, { computed, observable } from '@/utils';
import { DateFormatter, EDateFormatter, parseTime } from '@/utils';
import { FormModel } from '../interface';

export type FilterTypeKey<K = string> = 'group' | 'path' | 'dateTime' | 'date' | 'dateToDate' | K
export type FilterType<FM, FV = any, CV = any> = FilterTypeKey | IFormValueTransform<FM, FV, CV>
export enum TransformerType {
  NONE, 
  /**
   * form值转换为组件值(component-value, form-field-value)
   */
  F2V, 
  /**
   * 组件值(component-value, form-field-value)转换为form值
   */
  V2F
}
export interface IFormValueTransformHandler<FM, PS = any, PT = any> {
  <S = any, T = any>(value: PS | S, form?: FM): PT | T
}
export interface IFormTransformHandler<FM, PV = any> {
  <V = any>(value: PV | V, form: FM): FM
}

export interface IFormValueTransform<FM, FV = any, CV = any> {
  F2V: IFormValueTransformHandler<FM, FV, CV>;
  V2F: IFormValueTransformHandler<FM, CV, FV>;
  Form2ComponentModel?: IFormTransformHandler<FM, FV>;
  Component2FormModel?: IFormTransformHandler<FM, CV>;
}

export class FormValueTransform<FM extends FormModel, FV = any, CV = any> implements IFormValueTransform<FM, FV, CV> {
  @observable.ref private type: FilterType<FM>;
  @observable.ref private code: string
  constructor(type: FilterType<FM>, code: string) {
    this.type = type
    this.code = code;
  }
  @computed get F2V() {
    const { type } = this;
    if (Utils.isObject(type) && type.F2V) {
      return type.F2V
    }
    switch (this.type) {
      case 'group':
        return this.getGroupF2V()
      case 'path':
        return this.getGroupF2V(false)
      case 'dateTime': 
        return this.dateFormatter(EDateFormatter.dateTime);
      case 'date': 
        return this.dateFormatter(EDateFormatter.date);
      case 'dateToDate':
        return (v: any) => Utils.isArrayFilter(v, []).filter((i) => Utils.isNotEmptyValue(i))
    }
    return this.normalCommon
  }
  @computed get V2F() {
    const { type } = this;
    if (Utils.isObject(type) && type.V2F) {
      return type.V2F
    }
    switch (this.type) {
      case 'group':
        return this.getGroupV2F()
      case 'path':
        return this.getGroupV2F(false)
      case 'dateTime': 
        return this.dateFormatter(EDateFormatter.dateTime)
      case 'date': 
        return this.dateFormatter(EDateFormatter.date);
      case 'dateToDate':
        return (v: any) => {
          const [s,e] = Utils.isArrayFilter<string>(v, []).filter((i) => Utils.isNotEmptyValue(i))
          if(Utils.isNotEmptyValue(s) && Utils.isNotEmptyValue(e)){
            return [`${s}${s.length<11?' 00:00:00':''}`, `${s.length<11?parseTime(new Date(new Date(e).setTime(new Date(e+' 00:00:00').getTime()-1))):''}`]
          }
          return [s,e]
        }
    }
    return this.normalCommon
  }

  @computed get Component2FormModel(): IFormTransformHandler<FM, CV> {
    const { type } = this;
    if (Utils.isObject(type) && type.V2F) {
      return type.Component2FormModel
    }
    return (value: CV, form: FM) => set(form, this.code, this.V2F(value))
  }
  @computed get Form2ComponentModel(): IFormTransformHandler<FM, FV> {
    const { type } = this;
    if (Utils.isObject(type) && type.V2F) {
      return type.Form2ComponentModel
    }
    return (value: FV, form: FM) => set(form, this.code, this.F2V(value))
  }

  private normalCommon(value: any) {
    return Utils.isNotEmptyValueFilter(value)
  }

  private dateFormatter(formatter?: DateFormatter) {
    return (value: any) => Utils.toDateString(value, formatter)
  }

  private getGroupF2V(isRemoveRepeat = true) {
    return (value: any) => this.groupF2V(value, isRemoveRepeat)
  }
  private getGroupV2F(isRemoveRepeat = true) {
    return (array: any[]) => this.groupV2F(array, isRemoveRepeat)
  }
  
  private groupF2V(value: any, isRemoveRepeat = true) {
    let next: string[];
    if (Utils.isNotEmptyString(value)) {
      next = value.split(',')
    } else {
      next = Utils.castArray(value)
    }
    return Utils.zipEmptyData(next, isRemoveRepeat)
  }
  private groupV2F(array: any[], isRemoveRepeat = true) {
    return Utils.toString(Utils.zipEmptyData(Utils.isArrayFilter(Utils.toJS(array), []), isRemoveRepeat))
  }
}

export default function getTransform<FM extends FormModel, FV = any, CV = any>(code: string, type: FilterType<FM>): IFormValueTransform<FM, FV, CV> {
  return new FormValueTransform(type, code);
}
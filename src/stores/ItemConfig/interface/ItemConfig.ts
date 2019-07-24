/**
 * @module ItemConfig
 */

import { FormStore } from "@/stores/FormStore";
import { OptionBase } from "@/utils";
import { IKeyValueMap } from "mobx";
import { ITransformer } from "mobx-utils";
import { CommonStore } from "../../CommonStore";
import { FilterType, FilterTypeKey, IFormValueTransform, IFormValueTransformHandler } from "../input";
import { IDisplayConfig, IDisplayConfigCreater } from "../ItemDisplayConfig";
import { IRuleStore, IRuleStoreCreater } from "../RuleConfigStore";
import { ISearchConfig, ISearchConfigBase, ISearchConfigCreater } from "../SearchStore";
import { IRuleConfig } from "./RuleConfig";

export interface FormItemTypeDescription {
  "text": "文本录入域",
  "textArea": "文本域",
  "textarea": "文本域",
  "number": "数值录入域",
  "date": "日期选择器",
  "dateTime": "日期与时间选择器",
  "dateToDate": "日期区间选择器",
  "select": "选择器",
  "search": "查询选择器/自动完成录入域",
  "selectTree": "树选择",
  "check": "多选框",
  "radio": "单选框",
  "radioOne": "是/否简易单选框",
  "checkOne": "简易勾选框",
  "switch": "开关",
  "cascader": "级联选择器",
  "group": "复合录入域，通过children键值对组合多个录入域",
  "custom": "自定义录入域"
}

export type FormItemTypeKeys = keyof FormItemTypeDescription

export type FormItemType = "" | FormItemTypeKeys | undefined | null | never

/**
 * 表单model
 */
export type FormModel<M extends IKeyValueMap = IKeyValueMap> = M

export type ValueType<T = object> = T

/**
 * 属性构造器
 * @external
 */
export type ComputedProperty<FM = FormModel, T = any> = ComputedPropertyCreater<T, FM> | ValueType<T>
/**
 * 计算属性计算函数
 * @external
 */
export interface ComputedPropertyCreater<T, FM = FormModel> {
  (form: FM, itemConfig?: IItemConfig<FM>): T
}

export interface ItemConfigEventHandler<VALUE, FM, R = void> {
  (e: VALUE, formSource?: FM, config?: IItemConfig<FM, VALUE>): R
};
export type ValueAny = any;

export type ConstructorPick<P> = {
  [K in keyof P]?: P[K] extends ComputedPropertyCreater<infer T, infer FM> ? (ComputedProperty<FM, T>) : P[K]
}
export type ComputedPick<P, FM> = {
  [K in keyof P]?: P[K] extends ComputedPropertyCreater<infer T, FM> ? T : P[K]
}
/**
 * 将类型成员变成计算属性
 */
export type WithComputedPick<T, FM> = {
  [K in keyof T]?: ComputedProperty<T[K], FM>
}
/**
 * 表单成员基本配置，固定类型
 */
export interface IItemConfigStatic<FM, VALUE, CVALUE> {
  type?: FormItemType;
  code: string | '_';
  nameCode?: string;
  label?: string;
  computed?: ComputedPropertyCreater<VALUE | false, FM>;
  onChange?: ItemConfigEventHandler<VALUE, FM>;
  autorunMethod?: (value: VALUE, formStore?: FormStore<FM>, itemConfig?: IItemConfig<FM, VALUE, CVALUE>) => void;
  filter?: FilterTypeKey | IFormValueTransformHandler<FM, VALUE, CVALUE>;
  filterToValue?: FilterTypeKey | IFormValueTransformHandler<FM, CVALUE, VALUE>;
  transformer?: IFormValueTransform<FM, VALUE, CVALUE> | FilterType<FM, VALUE, CVALUE>;
  refConfig?: (store: FormStore) => void;
  slot?: string;
  useSlot?: boolean | string
}

interface IItemConfigCreater<FM = any, VALUE = any> {
  /**
   * a
   */
  disabled?: ComputedPropertyCreater<boolean, FM>
  hidden?: ComputedPropertyCreater<boolean, FM>
  value?: ComputedPropertyCreater<VALUE, FM>;
  defaultValue?: ComputedPropertyCreater<VALUE, FM>;
  required?: ComputedPropertyCreater<boolean | IRuleConfig<VALUE>, FM>
  viewOnly?: ComputedPropertyCreater<boolean, FM>
  options?: ComputedPropertyCreater<OptionBase[], FM>;
  loading?: ComputedPropertyCreater<boolean, FM>;
}
export interface IItemConfigCreaterStatic<FM, VALUE> extends ConstructorPick<IItemConfigCreater<FM, VALUE>>{}

/**
 * typeof i
 * @inheritDoc 
 */
export interface IFormItemConstructor<FM = any, VALUE = any, CVALUE = VALUE> extends
  IItemConfigStatic<FM, VALUE, CVALUE>,
  IItemConfigCreaterStatic<FM, VALUE>,
  ISearchConfigBase<FM>,
  ConstructorPick<ISearchConfigCreater<VALUE, FM>>,
  ConstructorPick<IDisplayConfigCreater<FM>>,
  ConstructorPick<IRuleStoreCreater<VALUE, FM>> 
{ 
  children?: IKeyValueMap<IFormItemConstructor<FM, VALUE, CVALUE>> | false
  [key: string]: any
}

export interface IItemConfig<FM = FormModel, VALUE = any, CVALUE = VALUE> extends 
  IItemConfigStatic<FM, VALUE, CVALUE>, 
  ComputedPick<IItemConfigCreater<FM, VALUE>, FM>, 
  ISearchConfig<VALUE, FM>, 
  IDisplayConfig<FM>, 
  IRuleStore<VALUE, FM>, 
  CommonStore 
{
  i: IFormItemConstructor<FM, VALUE>;
  formStore: FormStore<FM>;
  formSource: FM;
  currentValue?: any;
  currentComponentValue?: any;
  setOptions(options: ComputedProperty<FM, OptionBase[]>, source?: string): void;
  setLoading(loading: boolean, source?: string): void;
  useSlot: boolean;
  slot: string;
  [key: string]: any;
}
export type Typed<T> = { [K in keyof T]: T[K] } 
export type ItemConfigType = Typed<IItemConfig>
export type BaseItemConfigTransformer<FM = FormModel, VALUE = any> = ITransformer<IItemConfig<FM, VALUE>, FilterType<FM, VALUE>>
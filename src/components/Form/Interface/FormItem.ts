import { FormStore } from '@/stores/FormStore';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import { FormItemType } from '@/stores/ItemConfig/interface';
import { ItemConfig } from '@/stores';
export interface OFormItemCommon {
  code: string;
  formStore?: FormStore;
  antdForm?: WrappedFormUtils;
  itemConfig?: ItemConfig;
  [key: string]: any;
}
declare global {
  export type FormItemTypeGroup<T = any> = Record<FormItemType, T>;
  export interface IFormItemComponentType extends Partial<FormItemTypeGroup<OFormItemCommon>> {
    
  }
}
export type IItemTypeComponent = {
  [K in FormItemType]?: React.FunctionComponent<IFormItemComponentType[K]>
}
export * from '@/stores/ItemConfig/interface'
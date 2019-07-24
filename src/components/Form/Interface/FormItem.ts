import { FormItemType } from '@/stores/ItemConfig/interface';
export interface OFormItemCommon {
  code: string;
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
export * from '@/stores/ItemConfig/interface';

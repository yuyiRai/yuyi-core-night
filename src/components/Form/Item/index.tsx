import * as React from 'react';
import Loadable from 'react-loadable';
import Utils from 'yuyi-core-utils';
import { FormItemType, IItemTypeComponent, OFormItemCommon } from '../Interface/FormItem';
import { useCascaderItem } from './CascaderItem';
// import { IInputItemProps, ITextAreaItemProps } from './InputItem';
import { useCheckItem, useSwitchItem } from './CheckItem';
import { useCustomItem } from './CustomItem';
import { useDatePickerItem, useDateRangePickerItem } from './DateItem';
import { useGroupItem } from './GroupItem';
import { useInputItem, useTextAreaItem } from './InputItem';
import { useNumberInputItem } from './NumberInputItem';
import { useRadioItem, useRadioOneItem } from './RadioItem';
import { useSearchItem } from './Search';
import { useSelectTreeItem } from './SelectTreeItem';


export const Loader = (loader: Loadable.Options<any, any>['loader']) => {
  return Loadable({
    loader,
    delay: 200,
    loading: () => <span>loading</span>
  });
}

// export function ItemSwitchType(type?: 'text' | string): React.FunctionComponent<IInputItemProps>;
// export function ItemSwitchType(type: 'textArea' | 'textarea'): React.FunctionComponent<ITextAreaItemProps>;
// export function ItemSwitchType(type: 'date' | 'dateTime'): React.FunctionComponent<IDatePickerItemProps>;
// export function ItemSwitchType(type: 'dateToDate'): React.FunctionComponent<IDateRangePickerItemmProps>;
export const itemType: IItemTypeComponent = {
  'text': useInputItem,
  'textArea': useTextAreaItem,
  'textarea': useTextAreaItem,
  'date': useDatePickerItem,
  'dateTime': useDatePickerItem,
  'dateToDate': useDateRangePickerItem,
  'check': useCheckItem,
  'checkOne': useSwitchItem,
  'switch': useSwitchItem,
  'radio': useRadioItem,
  'radioOne': useRadioOneItem,
  'number': useNumberInputItem,
  'search': useSearchItem,
  'select': useSearchItem,
  'cascader': useCascaderItem,
  'selectTree': useSelectTreeItem,
  'group': useGroupItem,
  'custom': useCustomItem
}

window.Utils = Utils

export function ItemSwitchType<T extends FormItemType>(type: T): IItemTypeComponent[T]
export function ItemSwitchType<T extends FormItemType>(type?: never | ""): IItemTypeComponent['text']
export function ItemSwitchType(type?: string) {
  return itemType[type] || itemType['text']
}
export interface IItemSwitchProps extends OFormItemCommon {
  type: FormItemType;
  [k: string]: any;
}

export function checkItemSwitch(type: FormItemType) {
  const Component = ItemSwitchType(type)
  return Component
}

export const isUseHooks = Utils.reduceMap(itemType, (value, key) => ({ [key]: checkItemSwitch(key) }) )

export function useItemSwitch(type: FormItemType, props: OFormItemCommon, ref: React.Ref<any>) {
  const Component = React.useMemo(() => isUseHooks[type] || checkItemSwitch(type), [type]);
  React.useDebugValue(type, type => 'FormItemSwitch:' + type)
  // useLog('component', type)
  return Component(props, ref)
}

export const ItemSwitch = React.forwardRef(({ type, itemConfig, ...props }: IItemSwitchProps, ref) => {
  return useItemSwitch(type, props, ref)
})

// export const ItemComponent = () => {

//   return <ItemSwitch type={itemConfig.type} code={code} disabled={itemConfig.displayProps.isDisabled} placeholder={itemConfig.placeholder} />
// }

export * from './DateItem';
export * from './InputItem';


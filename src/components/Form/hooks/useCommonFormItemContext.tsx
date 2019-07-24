import { Utils } from '@/utils';
import { Observer } from "@/hooks";
import * as React from 'react';
import { CommonFormContext } from "../CommonForm";
import { FormItemConfigContext } from './useItemConfig';
import { FormStoreContext } from './useCommonForm';


export interface ICommonFormContext {
  itemConfig: React.ContextType<typeof FormItemConfigContext>;
  form: React.ContextType<typeof CommonFormContext>;
  formStore: React.ContextType<typeof FormStoreContext>;
  Observer: typeof Observer;
}
export function useCommonFormItemContext(): ICommonFormContext;
export function useCommonFormItemContext(force: true): ICommonFormContext;
export function useCommonFormItemContext(force: (data: ICommonFormContext) => React.ReactElement): React.ReactElement;
export function useCommonFormItemContext(force: boolean | ((data: ICommonFormContext) => React.ReactElement) = true) {
  const form = React.useContext(CommonFormContext)
  const formStore = React.useContext(FormStoreContext)
  const itemConfig = React.useContext(FormItemConfigContext)
  const store = { itemConfig, formStore, form, Observer }
  if (force) {
    if (force === true) {
      return store;
    } else if (Utils.isFunction(force)) {
      return <Observer>{() => force(store)}</Observer>
    }
  }
  return store
}
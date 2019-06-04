import { Utils } from '@/utils';
import LocaleProvider from 'antd/lib/locale-provider';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import { IKeyValueMap } from 'mobx';
import * as React from 'react';
import { FormStore, onItemChangeCallback } from '../../stores/FormStore';


export const NativeStore = React.createContext({formStore: FormStore.prototype});


export interface ICommonFormProps<FM = object> extends IKeyValueMap {
  /**
   * 表单2
   */
  model: FM;
  formStore?: FormStore<FM>;
  storeRef?: (store: FormStore<FM>) => void;
  onItemChange?: onItemChangeCallback;
}
export interface ICommonFormState extends IKeyValueMap {
  formStore: FormStore;
}

export const CommonFormContext = React.createContext<{
  formProps: ICommonFormProps;
  formInstance: CommonForm;
}>({ formProps: null, formInstance: null  })

export class CommonForm extends React.Component<ICommonFormProps, ICommonFormState> {
  constructor(props: ICommonFormProps) {
    super(props)
    this.state = {
      formStore: FormStore.registerForm(props.model, this)
    }
  }
  static getDerivedStateFromProps(nextProps: ICommonFormProps, prevState: ICommonFormState) {
    const { formStore: last } = prevState
    if (!Utils.isEqual(Utils.zipEmptyData(last.formSource), Utils.zipEmptyData(nextProps.model))) {
      // console.log('getDerivedStateFromProps', nextProps, prevState)
      FormStore.disposedForm(last.formSource)
      // debugger
      FormStore.registerForm(nextProps.model, this, last)
      // prevState.formStore.formItemMap.delete(prevState.formStore.formSource)
    }
    if (!Utils.isNil(nextProps.model)){
      const formStore = FormStore.registerForm(nextProps.model, null, prevState.formStore)
      if (Utils.isFunction(nextProps.storeRef)) {
        nextProps.storeRef(formStore)
      }
      if (Utils.isFunction(nextProps.onItemChange)) {
        formStore.onItemChange(nextProps.onItemChange)
      }
      // console.log('formStore diff', nextProps.storeRef, formStore, prevState.formStore, formStore !== prevState.formStore)
      if (formStore !== prevState.formStore) {
        return { ...prevState, formStore }
      }
    }
    return prevState
  }

  public render() {
    const { children } = this.props
    // const { Inter } = this
    return (
      <LocaleProvider locale={zh_CN}>
        <CommonFormContext.Provider value={{formProps: this.props, formInstance: this}}>
          <NativeStore.Provider value={{formStore: this.state.formStore}} >
            <> 
              {/* <Inter /> */}
              {children}
            </>
          </NativeStore.Provider>
        </CommonFormContext.Provider>
      </LocaleProvider>
    );
  }
}
export default CommonForm;
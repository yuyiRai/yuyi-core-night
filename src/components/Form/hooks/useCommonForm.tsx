import { usePropsRecive, useSafeStoreProvider, UseSafeStoreProviderReturns } from "@/hooks";
import { CommonStore } from "@/stores/CommonStore";
import { FormStore } from "@/stores/FormStore";
import { FormItemStoreCore, IFormItemStoreConstructor, IFormItemStoreCore } from "@/stores/FormStore/FormItemStoreBase";
import { WrappedFormUtils } from "antd/lib/form/Form";
import { map } from "lodash";
import { action, computed, IReactionDisposer, observable } from "mobx";
import * as React from 'react';
import { useContext } from "react";
import { set } from "yuyi-core-utils";
import { ICommonFormProps } from "../CommonForm";
import { ItemSwitch } from "../Item";



export type CommonFormStoreContextRef<FM> = UseSafeStoreProviderReturns<CommonFormStore<FM>>
export function createFormStoreContext<FM = any>(init: CommonFormStoreContextRef<FM> = {} as any) {
  return React.createContext<CommonFormStoreContextRef<FM>>(init)
}

export const FormStoreContext = createFormStoreContext()

export const CommonFormCoreContext = React.createContext<React.Context<CommonFormStore<any>>>(null)

export function factory<FM extends any>(props: ICommonFormProps<FM>) {
  return new CommonFormStore<FM>().init({ props });
}

export function useFormStoreContextProvider<FM>(props: ICommonFormProps<FM>) {
  const Provider = useSafeStoreProvider(factory, props, {
    storeRef(store) {
      // const disposer = props.storeRef(store) as any
      return () => {
        // if (disposer) {
        //   disposer()
        // }
        console.error('commonform destory');
        store.destory()
        store = null
      }
    }
  })
  const [{ useCallback }, ref] = Provider
  const onItemChange = useCallback((store, onItemChange) => {
    if (Utils.isFunction(onItemChange)) {
      store.formStore.onItemChange(onItemChange)
    }
  }, [props.onItemChange])
  usePropsRecive(model => {
    console.error(model);
    ref.current.value.nextModel(model)
  }, [props.model, ref])
  usePropsRecive(onItemChange, [onItemChange])
  // useUnmount(useCallback((store) => {
  //   console.error('commonform destory');
  //   store.destory()
  // }))
  return React.useCallback((props: React.PropsWithChildren<{}>) => (
    <FormStoreContext.Provider value={Provider}>{props.children}</FormStoreContext.Provider>
  ), [Provider])
}

export function useFormCoreContext<FM>(init: CommonFormStore<FM> = {} as any): {
  core: CommonFormStore<FM>,
  Provider: React.ProviderExoticComponent<Partial<React.ProviderProps<CommonFormStore<FM>>>>
} {
  const prev = useContext(CommonFormCoreContext)
  const Context: any = prev || createFormStoreContext<FM>(init as any)
  const core = useContext(Context)
  return {
    core,
    Provider: (
      { value, children }: Partial<React.ProviderProps<CommonFormStore<FM>>>
    ) => React.useMemo(() => (
      <Choose>
        <When condition={prev !== null}>
          <Context.Provider value={value || core}>{children}</Context.Provider>
        </When>
        <Otherwise>
          <CommonFormCoreContext.Provider value={Context}>
            <Context.Provider value={value || core}>{children}</Context.Provider>
          </CommonFormCoreContext.Provider>
        </Otherwise>
      </Choose>
    ), [])
  } as any;
}

export type CommonFormStoreInitParam<FM> = { props: ICommonFormProps<FM>, ref?: React.MutableRefObject<CommonFormStore> }
export class CommonFormStore<FM = any> extends CommonStore {
  @observable formStore: FormStore<FM>;
  @observable formProps: ICommonFormProps<FM>;

  lastModel: FM;

  @action.bound init({ props, ref }: CommonFormStoreInitParam<FM>) {

    this.formStore = FormStore.registerForm(props.model, this)
    this.formProps = props;
    this.lastModel = props.model
    this.registerDisposer(() => {
      this.disposedLastForm()
      this.formStore.destory()
      this.formStore = null
      this.lastModel = null
    })
    console.error('new Store', this.formStore.uuid);
    return this;
  }

  @action.bound nextModel(model: FM) {
    if (this.lastModel !== (Utils.isNotEmptyValueFilter(model) || {})) {
      this.disposedLastForm()
      console.error('storeRef get update', this.formStore.uuid);
      const formStore = FormStore.registerForm(model, this, this.formStore)
      console.error('storeRef get update', formStore.uuid, model, this.lastModel);
      this.setFormStore(formStore)
      this.lastModel = model
    }
  }

  @action disposedLastForm() {
    FormStore.disposedForm(this.lastModel);
    (this.formStore as FormStore<any, any>).setAntdForm(null)
    // this.formStore.formItemMap.delete(this.formStore.formSource)
  }

  @action setFormStore(formStore: FormStore) {
    this.formStore = formStore
  }

  @action useItemStore(code: string): FormItemStore<FM> {
    return this.formStore.registerItemStore(code, FormItemStore)
  }

  @computed get itemStores() {
    return map(this.formStore.configStore.configList, ({ code }) => {
      // const baseStore = new ExportStore()
      // baseStore.init(this.formStore, code)
      // // debugger

      return this.formStore.registerItemStore(code, FormItemStore) as any
    })
  }
}


export class FormItemStore<FM = any, V = any> extends FormItemStoreCore<FM, V> implements IFormItemStoreCore<FM, V> {

  public formStore: FormStore<FM, IFormItemStoreConstructor<FM>>;
  ruleWatcher: IReactionDisposer;
  validateReset: IReactionDisposer;

  constructor(formStore: FormStore<FM, any>, code: string) {
    super(formStore, code)
    this.setFormStore(formStore)
    this.setAntdForm(formStore.antdForm)

    this.ruleWatcher = this.reaction(() => this.itemConfig && this.itemConfig.rules, () => {
      // console.log('ruleWatcher', rule)
      if (this.itemConfig) {
        // console.error(this, this.itemConfig);

        this.itemConfig.updateVersion()
        this.formStore.updateError(code)
        const value = Utils.cloneDeep(this.itemConfig.currentValue)
        // this.antdForm.resetFields([this.code])
        if (this.antdForm.getFieldError(this.code)) {
          this.antdForm.setFields(set({}, this.code, { value }))
          // this.antdForm.validateFields([this.code])
        }
      }
    })
    this.registerDisposer(() => {
      console.error('destory');
      this.ruleWatcher()
      this.validateReset && this.validateReset()
      this.formStore.unregisterItemStore(this.code)
      this.formStore = null
    })
  }

  @computed.struct get antdForm(): WrappedFormUtils {
    return this.formStore.antdFormMap.get(this.code)
  }
  @action setAntdForm(antdForm: WrappedFormUtils) {
    this.formStore.setAntdForm(antdForm, this.code)
  }

  @action.bound init() {
    // reaction(() => this.fieldDecorator, () => {
    //   console.log('fieldDecorator change', code)
    // })
    this.validateReset = this.autorun(() => {
      if (!this.hasError || !this.itemConfig.rules) {
        this.formStore.reactionAntdForm(antdForm => {
          // console.log('updateVersion', code, this.antdForm.getFieldError(code))
          this.itemConfig.updateVersion()
          this.setAntdForm(antdForm)
        })
      }
      // this.antdForm.validateFields([code])
    })
  }

  @computed get fieldDecorator() {
    // trace()
    // console.log('get fieldDecorator2', this.code)
    return this.antdForm.getFieldDecorator(this.code, this.decoratorOptions);
  }

  @computed get decoratorOptions() {
    // console.log('get fieldDecorator', this.code)
    // console.log('update fieldDecorator options', itemConfig.rule)
    // console.log('get fieldDecorator', this.code, this.hasError, this.currentError)
    const { itemConfig } = this
    const { rules, value: initialValue } = itemConfig
    const valueProps = Utils.isNotEmptyValueFilter(
      itemConfig.computed !== false ? itemConfig.computed : undefined,
      itemConfig.currentComponentValue,
      itemConfig.currentValue
    )
    return {
      validateTrigger: ['onBlur', 'onChange'].concat(this.hasError ? ['onInput'] : []),
      rules, initialValue,
      getValueProps: (value: any) => {
        // console.log('value filter', itemConfig.code, value, itemConfig);
        const result = {
          value: valueProps
        }
        return result;
      }
    }
  }


  @computed get render() {
    // trace()
    // console.log('get render', this.code);
    return this.fieldDecorator(this.Component)
  }

  @computed get Component() {
    const { code, itemConfig } = this
    // trace()
    // console.log('getComponent', this.code);
    return (
      <ItemSwitch type={itemConfig.type} code={code} disabled={itemConfig.displayProps.isDisabled} placeholder={itemConfig.placeholder} />
    );
  }
}


export class ExportStore extends CommonStore {
  @observable.ref
  public store: FormItemStore;
  constructor() {
    super()
  }
  @action.bound init2(list: any) {
    console.error(list);
  }
  @action.bound init(formStore: any, code: any) {
    this.store = new FormItemStore(formStore, code)
  }
}

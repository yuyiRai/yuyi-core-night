import { useMountHooks, usePropsRecive } from '@/hooks';
import { get, set } from '@/utils';
import { Row } from 'antd';
import Form from 'antd/lib/form';
import { GetFieldDecoratorOptions, WrappedFormUtils } from 'antd/lib/form/Form';
import { RowProps } from 'antd/lib/row';
import { observer } from 'mobx-react-lite';
import { TweenOneGroup } from 'rc-tween-one';
import * as React from 'react';
import { useMemo } from 'react';
import { FormContainer, IFormContainerProps } from './FormContainer';
import FormItem from './FormItem';
import { FormStoreContext } from './hooks';
import { IFormItemConstructor, IItemConfig } from './Interface';
import { useDeepMemo } from './useDeepMemo';
import { form } from './util';
// import { Utils } from '../../build';

const defaultFormItemLayout = { labelCol: { span: 1, offset: 0 }, wrapperCol: { span: 1, offset: 0 } }
export interface IFormProps<FM = object> extends IFormContainerProps {
  model?: FM;
  mapPropsToFields?: () => any,
  onFieldsChange?: (changedFields: any) => any;
  // formInstance?: ICommonFormState;
  // formStore?: FormStore;
  config: IFormItemConstructor<any, FM>[];
  form?: WrappedFormUtils<any>;
  formContainerRow?: RowProps;
  formItemLayout?: typeof defaultFormItemLayout;
  [key: string]: any;
}
export interface IFormState {
  fieldDecorator: GetFieldDecoratorOptions[]
}

export function useWaitingFormItem<P = {}>(Component: React.FunctionComponent<P>) {
  const Render = React.useMemo(() => React.forwardRef<React.FunctionComponent<P>, P>((props: P, ref) => <Component ref={ref} {...props}></Component>), [Component])
  return React.forwardRef(({ delay, itemKey, ...props }: P & { delay: number, itemKey: string }, ref) => {
    const Renderer = React.useMemo(() => React.lazy(() =>
      Utils.waitingPromise(delay, {
        default: Render
      })
    ), []);
    return <Renderer ref={ref} key={itemKey} {...props} />
  })
}

declare const config: IItemConfig<any, any>;
declare const i: number;
export const FormItemGroup = observer((props: IFormProps) => {
  const [{ useObserver }] = React.useContext(FormStoreContext)
  const { formItemLayout = defaultFormItemLayout } = props
  // console.log('FormItemGroup update');
  const WaitableFormItem = useWaitingFormItem(FormItem)
  const content = useObserver((context) => (
    <For index='i' each="config" of={context.formStore.configStore.configList}>
      <React.Suspense key={config.code} fallback={<span>waiting</span>}>
        <WaitableFormItem key={config.code} itemKey={config.code} delay={100 + i * 10}  {...formItemLayout} code={config.code} />
      </React.Suspense>
    </For>
  ), [], 'FormItemGroup')
  return (
    <TweenOneGroup enter={{
      scale: 1.5, opacity: 0, type: 'from', duration: 500, delay: 0
    }} leave={{
      opacity: 0, scale: 1.5, duration: 500
    }} appear={true}
    >{content}</TweenOneGroup>
  )
})

// export const FormStoreContext = React.createContext<FormStore>({} as any)

export const InjectedForm = form(function InjectedForm({ form, ...props }: IFormProps) {
  const [{ useCallback }, ref] = React.useContext(FormStoreContext)
  const { formStore } = ref.current.value
  usePropsRecive(useCallback((store) => {
    store.formStore.setAntdForm(form)
    // props.formStore.receiveAntdForm(form)
    // console.log('InjectedForm antd', 'form store change', form, props.formStore.uuid);
  }), [form, formStore && formStore.uuid])

  const content = useDeepMemo(
    <Row className={props.className} {...props.formContainerRow}>
      <FormItemGroup {...props} />
    </Row>
  )
  const children = React.useContext(ChildrenContext)
  const render = useMemo(() => {
    // console.log('InjectedForm', formStore);
    return (
      <>
        {content}
        {children}
      </>
    )
  }, [content, children])
  return (<FormContainer labelWidth={props.labelWidth}>{render}</FormContainer>);
})

export const ChildrenContext = React.createContext(null)

export function filterToValue(v: any, defaultValue?: any) {
  const v2 = Utils.isNotEmptyValueFilter(Utils.isArray(v) ? Utils.zipEmptyData(v) : v, defaultValue)
  return v2 === null ? undefined : v2
}
export const ConfigrationalForm: React.FunctionComponent<IFormProps> = ({ config, children, ...other }: IFormProps) => {
  useMountHooks(() => {
    console.error('mount');
    return () => {
      console.error('unmount');
    }
  })
  const [{ useComputedChild, useCallback }, storeRef] = React.useContext(FormStoreContext)
  // console.error('will change config', config);
  usePropsRecive((config) => {
    console.error('change config');
    storeRef.current.value.formStore.setConfig(config)
  }, [config, storeRef])
  // return <span>123</span>
  // console.error('receive');
  const onFieldsChange = React.useCallback((changedFields) => {
    storeRef.current.value.formStore.patchFieldsChange(changedFields)
  }, [storeRef])
  const mapPropsToFields = useCallback((context) => {
    const { formProps: { model }, formStore: store } = context;
    let target = {}
    // let form = {}
    // console.error(store.uuid);

    for (const config of store.configStore.configList) {
      const v = Utils.toJS(get(model, config.code))
      const value = store.getF2VValue(config.code, filterToValue(v, config.value))
      // console.log('formValueTransform', config.code, value, v, store)
      const field = { name: config.code, value }
      set(target, config.code, Form.createFormField(field))
      // set(form, config.code, value)
      // console.log('initvalue', config.code, v, value, config.value);
      if (!Utils.isEqual(v, value, true)) {
        // store.setFormValue(config.code, value)
        store.patchFieldsChange(set({}, config.code, field))
      }
    }
    // store.setForm(form)
    // store.patchFieldsChange(target)
    // store.setForm(model)
    // console.log('form init', model, target, store.configStore.configList, other);
    return target
  })
  const warp = useComputedChild((store) => {
    const { formStore } = store
    // console.error('receive2');
    // console.error(context);
    // console.log('InjectedForm', 'model change', formProps.model);
    return (
      (formStore.configStore.configList.length > 0) ? <InjectedForm {...other} mapPropsToFields={mapPropsToFields} onFieldsChange={onFieldsChange} /> : null
    )
  }, [mapPropsToFields, onFieldsChange])
  return (
    <ChildrenContext.Provider value={children}>
      {warp}
    </ChildrenContext.Provider>
  )
}
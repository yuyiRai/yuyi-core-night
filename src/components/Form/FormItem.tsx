import { useActionObject } from '@/hooks';
import { ItemConfig } from '@/stores';
import { Col } from 'antd';
import AntFormItem, { FormItemProps } from 'antd/lib/form/FormItem';
import 'antd/lib/form/style/css';
import classnames from 'classnames';
import { action } from 'mobx';
import * as React from 'react';
import { FormStore } from '../../stores/FormStore';
import { FormItemStore, FormStoreContext } from './hooks';
import { FormItemConfigContext } from './hooks/useItemConfig';
import { useLoading } from './hooks/useLoading';
import { OFormItemCommon } from './Interface/FormItem';
export interface IFormItemProps extends FormItemProps, OFormItemCommon {
}

// export interface IFormItemState {
//   instance: FormItem;
//   init: boolean;
// }

export function withFormItem([code, formStore]: [string, FormStore]) {
  const r = useActionObject({
    formStore,
    get store() {
      return formStore.registerItemStore<FormItemStore>(code, FormItemStore)
    },
    dispose: action(function () {
      // this.store.destroy()
      this.formStore = null
    }),
    get itemConfig() {
      return this.store.itemConfig
    },
    get configProps() {
      return { code, itemConfig: this.itemConfig }
    },
    get props() {
      const { itemConfig, store } = this;
      return {
        help: itemConfig.displayProps.isShowMessage ? undefined : <span style={{ display: 'none' }} />,
        style: itemConfig.displayProps.formItemStyle as any,
        validateStatus: store.hasError ? 'error' : 'success',
        hasFeedback: itemConfig.useFeedback && !['check', 'checkOne', 'radio', 'radioOne', 'group', 'textArea', 'textarea'].includes(itemConfig.type)
      }
    }
  })
  return r;
}

export function useAntFormItem(props: FormItemProps) {
  return (
    <AntFormItem {...props as any} />
    // <span></span>
  )
}


export const FormItemStoreContext = React.createContext<FormItemStoreContextType>({} as any)
export type FormItemStoreContextType = React.MutableRefObject<ReturnType<typeof withFormItem>>


export const FormItem: React.SFC<IFormItemProps> = (props) => {
  const { code, className, ...other } = props
  const [{ useComputedChild }] = React.useContext(FormStoreContext)
  const children = useComputedChild(store => {
    const { itemConfig: { isViewOnly: colon, displayProps: { label, useLabel } }, render: children } = store.useItemStore(code)
    const props = { ...other, children, colon, label, className: classnames([className, { 'unuse-label': !useLabel }])  }
    return <AntFormItem {...props} />
  }, [props])
  const loading = useComputedChild(store => {
    const { loading } = store.useItemStore(code).itemConfig
    return useLoading(children, { loading })
  }, [children])
  const render = useComputedChild(store => useFormItemContainer(loading, store.useItemStore(code).itemConfig), [loading])
  return (
    <FormItemConfigContext.Provider value={{ code: code }}>
      {render}
    </FormItemConfigContext.Provider>
  )
  // return useObserver((context) => {
  //   // useLog('code', code, props.ref)
  //   const children = useAntFormItem({ props: other }) //useAntFormItem(other, obs)
  //   const render = useFormItemContainer(useFormItemLoading(children, {}, itemStore), itemStore) 
  //   return (
  //     <FormItemConfigContext.Provider value={itemStore}>
  //       {render}
  //     </FormItemConfigContext.Provider>
  //   )
  // }, [], 'yuyiFormItem')
}

export default FormItem


export const FormItemContainer: React.SFC<{ itemConfig: ItemConfig }> = ((props) => {
  return useFormItemContainer(props.children, props.itemConfig) as any
})

export function useFormItemContainer(children: any, itemConfig: ItemConfig) {
  // trace()
  // return useObserver(() => {
  // React.useEffect(() => () => console.log('renderer destroy', localStore.itemConfig.code), [])
  // console.log('renderer', localStore.itemConfig.code)
  const { type, displayProps: { colSpan, useColumn }, lg, sm, xs, offset } = itemConfig
  if (useColumn === false) {
    return <>{children}</>;
  }
  const style = {
    display: itemConfig.hidden ? 'none' : undefined,
    maxHeight: type !== 'textarea' && colSpan <= 12 && '34px'
  }
  return (
    <Col className='use-item-col' lg={lg || colSpan} sm={sm || 12} xs={xs || 24} offset={offset} style={style}>
      {children}
    </Col>
  )
  // }, 'FormItemContainer')
}
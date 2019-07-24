import { useActionObject, useLocalStore, useObserver } from '@/hooks';
import { Utils } from '@/utils';
import Input, { InputProps, TextAreaProps } from 'antd/lib/input';
import TextArea from 'antd/lib/input/TextArea';
import React from 'react';
import { useFormItemConfig } from '../hooks/useItemConfig';
import { OFormItemCommon } from '../Interface/FormItem';
import { ValueHintContainer } from './OptionsUtil/ToolTipContainer';
// import { SlotContext } from '../../../utils/SlotUtils';

const inev = Utils.isNotEmptyValueFilter

export type IHasShadowValueProps<C, V = any> = OFormItemCommon & {
  value?: V;
} & Partial<C extends React.Component<infer P> ? P : any>

function shadowValueFactory<V>({ value }: { value: V }) {
  return useActionObject({
    currentValue: Utils.isNotEmptyValueFilter(value) || '',
    shadowValue: Utils.isNotEmptyValueFilter(value) || '',
    setShadowValue(value: V) {
      this.shadowValue = value
    },
    setValue(value: V) {
      this.currentValue = value
    }
  })
}


export function useShadowValue<C extends Input | TextArea, V extends string = any>(
  initValue: V,
  props: IHasShadowValueProps<C, V>,
  ref: React.Ref<C>
): {
  onBlur: React.FocusEventHandler<any>,
  onChange: React.ChangeEventHandler<any>,
  value: any
} {
  const { onChange, value: currentValue } = props
  const itemConfig = useFormItemConfig().itemConfig
  const store = useLocalStore(shadowValueFactory, { value: initValue })
  React.useEffect(() => {
    if (inev(store.currentValue) !== inev(currentValue)) {
      store.setShadowValue(currentValue as any)
      store.setValue(currentValue as any)
    }
  }, [currentValue, store.currentValue])

  // React.useImperativeHandle<Input>(ref, () => {
  //   return {
  //     onChange() {

  //     },
  //     onBlur() {

  //     }
  //   }
  // })
  if (itemConfig.watchInput) {
    return {
      get value() {
        return store.shadowValue
      },
      onChange(e: any) {
        const nextValue = e.target.value
        store.setShadowValue(nextValue)
        onChange(e)
        if (store.currentValue !== nextValue) {// 记录最后变更的值
          store.setValue(nextValue)
        }
      },
      onBlur(e: any) {

      }
    }
  } else {
    return {
      get value() {
        return store.shadowValue
      },
      onChange(e: any) {
        store.setShadowValue(e.target.value)
        // console.log(store.shadowValue);
      },
      onBlur(e) {
        if (inev(e.target.value) !== inev(currentValue)) {
          onChange(e)
          if (store.currentValue !== e.target.value) // 记录最后变更的值
            store.setValue(e.target.value as V)
          // Input类焦点移除时不需要额外事件
          // Utils.isFunction(onBlur) && onBlur(e)
        }
      }
    }
  }
}

declare global {
  export interface IFormItemComponentType {
    'text': IInputItemProps;
    'textArea': ITextAreaItemProps;
    'textarea': ITextAreaItemProps;
  }
}

export type IInputItemProps = InputProps & OFormItemCommon

export const useInputItem = (props: IInputItemProps, ref: any) => {
  return useObserver(() => {
    const itemConfig = useFormItemConfig().itemConfig
    const { code, ...other } = props
    // useLog('fieldDecoratorOption', code, itemConfig.label, other.value, other);
    const shadowValueStore = useShadowValue<Input>(itemConfig.defaultValue, props, ref)
    // useLog('fieldDecoratorOption2', code, itemConfig.label, shadowValueStore.value, other);
    return (
      <ValueHintContainer value={shadowValueStore.value}>
        <Input ref={ref} allowClear={false}
          {...other}
          onChange={shadowValueStore.onChange}
          value={shadowValueStore.value}
          onBlur={shadowValueStore.onBlur}
          suffix={itemConfig.suffix}
          maxLength={itemConfig.maxLength}
        />
      </ValueHintContainer>
    )
  }, 'useInputItem')
  // return <Input {...other}/>
}

export type ITextAreaItemProps = TextAreaProps & OFormItemCommon
export const useTextAreaItem: React.FunctionComponent<ITextAreaItemProps> = React.forwardRef<TextArea, ITextAreaItemProps>(
  (props, ref) => {
    const itemConfig = useFormItemConfig().itemConfig
    const store = useShadowValue<TextArea>(props.value, props, ref)
    const { code, ...other } = props
    return useObserver(() => (
      <Input.TextArea ref={ref}
        {...other} rows={!itemConfig.autoSize && 4}
        value={store.value}
        onChange={store.onChange}
        onBlur={store.onBlur} autosize={itemConfig.autoSize} />
    ), 'useTextAreaItem')
  }
)
export default useInputItem;
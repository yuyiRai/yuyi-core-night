import Input, { InputProps, TextAreaProps } from 'antd/lib/input';
import 'antd/lib/input/style/css';
import React, { FocusEventHandler, ChangeEventHandler } from 'react';
import { OFormItemCommon } from '../Interface/FormItem';
import { commonInjectItem } from "./commonInjectItem";
import { Utils } from '../../../utils';
import { isFunction } from 'util';
import { ValueHintContainer } from './OptionsUtil/ToolTipContainer';
// import { SlotContext } from '../../../utils/SlotUtils';

const inev = Utils.isNotEmptyValueFilter

export interface IHasShadowValueProps<V = any> extends OFormItemCommon {
  onChange?: ChangeEventHandler<V>;
  onBlur?: FocusEventHandler<V>;
  value?: V;
}

export function useShadowValue<P = any>(initValue: any, props: IHasShadowValueProps) {
  const { itemConfig, onChange, onBlur, value: currentValue } = props
  const state = React.useState(initValue)
  const [lastV, setLastV] = React.useState(initValue) // 记录最后变更的值
  const shadowValue = state[0]
  const setShadowValue = state[1]

  React.useEffect(() => {
    if (inev(lastV) !== inev(currentValue)) {
      // console.log('input: change props value', inev(lastV), inev(currentValue))
      setShadowValue(currentValue)
      setLastV(currentValue)
    }
  }, [currentValue, lastV, setShadowValue, setLastV])

  if (itemConfig.watchInput) {
    return {
      value: shadowValue,
      onChange(e: any) {
        const nextValue = e.target.value
        setShadowValue(nextValue)
        onChange(e)
        if (lastV !== nextValue) {// 记录最后变更的值
          setLastV(nextValue)
        }
      },
      onBlur
    }
  } else {
    return {
      value: shadowValue,
      onChange(e: any) {
        setShadowValue(e.target.value)
      },
      onBlur(e: React.FocusEvent<HTMLInputElement>) {
        if (inev(e.target.value) !== inev(currentValue)) {
          onChange(e)
          if (lastV !== e.target.value) // 记录最后变更的值
            setLastV(e.target.value)
        }
        isFunction(onBlur) && onBlur(e)
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

export const InputItem: React.FunctionComponent<IInputItemProps> = commonInjectItem(
  props => <Text {...props} />
)
export type ITextAreaItemProps = TextAreaProps & OFormItemCommon
export const TextAreaItem: React.FunctionComponent<ITextAreaItemProps> = commonInjectItem(
  props => <Area {...props} />
)

const Text: React.FunctionComponent<IInputItemProps> = (props) => {
  const { antdForm, formStore, code, itemConfig, ...other } = props
  const { value, onChange, onBlur } = useShadowValue<IInputItemProps>(itemConfig.currentValue, props)
  // console.log('fieldDecoratorOption', itemConfig.label, value, other.value, other);
  // const { slots } = React.useContext(SlotContext)
  // const Inter = slots.inter
  // console.log(slots)
  return <>{(
    <ValueHintContainer value={value}>
      <Input allowClear={false}
        {...other}
        onChange={onChange}
        value={value}
        onBlur={onBlur}
        suffix={itemConfig.suffix}
        maxLength={itemConfig.maxLength}
      />
    </ValueHintContainer>
    )}
  </>
  // return <Input {...other}/>
}

const Area: React.FunctionComponent<ITextAreaItemProps> = (props) => {
  const { antdForm, formStore, code, itemConfig, ...other } = props
  const { value, onChange, onBlur } = useShadowValue<ITextAreaItemProps>(other.value, props)
  return (
    <Input.TextArea
      {...other} rows={!itemConfig.autoSize && 4}
      value={value}
      onChange={onChange}
      onBlur={onBlur} autosize={itemConfig.autoSize} />
  )
}
export default Text;
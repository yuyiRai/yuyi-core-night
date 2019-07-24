import { Observer, useObserver } from "@/hooks";
import { ItemConfig } from '@/stores';
import { Option } from '@/utils';
import Checkbox, { CheckboxGroupProps } from 'antd/lib/checkbox';
// import Switch, { SwitchProps } from 'antd/lib/switch';
// import 'antd/lib/switch/style/css';
import 'element-ui/lib/theme-chalk/switch.css';
import { pullAll } from 'lodash';
import * as React from 'react';
// import { SlotContext } from '@/utils/SlotUtils';
import { ScopedSlot } from '../../../utils/SlotUtils';
import { useFormItemConfig } from '../hooks/useItemConfig';
import { OFormItemCommon } from '../Interface/FormItem';

export interface ICheckItemProps extends CheckboxGroupProps, OFormItemCommon {

}
export type CheckScopedSlot<FM = object, VALUE = any> = (props: {
  col: {
    data: VALUE,
    item: Option,
    index: number,
    props: FM
  },
  onChange: any,
  value: boolean,
  config: ItemConfig
}) => React.ReactElement

declare const option: Option;
declare const i: number;
const checkSlots = (itemConfig: ItemConfig, onChange: any, other: any) => {
  const store = itemConfig.useOptionsStore()
  const slotFactory = (options: Option, index: number) => ({
    col: {
      data: other.value,
      item: options,
      index,
      props: itemConfig.formStore.formSource
    },
    value: other.value && other.value.includes(options.value),
    onChange(checked: boolean) {
      if (checked) {
        const nextV = Utils.isArrayFilter(other.value) || []
        nextV.push(options.value)
        onChange(nextV)
      } else {
        onChange(pullAll([...Utils.castArray(other.value)], [options.value]))
      }
    },
    config: itemConfig
  })
  return (
    <div className='el-checkbox-group'>
      <For index='i' each='option' of={store.displayOptions}>
        <ScopedSlot key={option.value} name={itemConfig.slot} {...slotFactory(option, i)} />
      </For>
    </div>
  )
}
export const useCheckItem = ({ code, onChange, onBlur, ...other }: ICheckItemProps, ref: any) => {
  return useObserver(() => {
    const itemConfig = useFormItemConfig().itemConfig
    // const { scopedSlots } = React.useContext(SlotContext)
    if (itemConfig.useSlot) {
      return checkSlots(itemConfig, onChange, other)
    }
    const store = itemConfig.useOptionsStore()
    const { displayOptions } = store
    return (
      <Observer>{() => (
        <Checkbox.Group ref={ref} {...other} style={{ width: '100%' }} onChange={onChange} options={displayOptions as any}>
          {/* <Observer>{
            () => displayOptions.map(option => {
              return <Observer key={option.value}>{() => <Checkbox value={option.value}>{option.label}</Checkbox>}</Observer>
            }) as any
          }</Observer> */}
          {/* <Row>
            <Col span={8}><Checkbox value="A">A</Checkbox></Col>
            <Col span={8}><Checkbox value="B">B</Checkbox></Col>
            <Col span={8}><Checkbox value="C">C</Checkbox></Col>
            <Col span={8}><Checkbox value="D">D</Checkbox></Col>
            <Col span={8}><Checkbox value="E">E</Checkbox></Col>
          </Row> */}
        </Checkbox.Group>
      )}</Observer>
    )
  }, 'useCheckItem')
}
interface SwitchProps {
  value?: number | string | boolean
  disabled?: boolean
  width?: number
  onIconClass?: string
  offIconClass?: string
  onText?: string
  offText?: string
  onColor?: string
  offColor?: string
  onValue?: number | string | boolean
  offValue?: number | string | boolean
  name?: string
  onChange?(value: number | string | boolean): void
}
export interface ISwitchItemProps extends SwitchProps, OFormItemCommon {

}

export const useSwitchItem: React.FunctionComponent<ISwitchItemProps> = ({ code, ...other }: ISwitchItemProps) => {
  // const itemConfig = useFormItemConfig()
  // console.log(other, itemConfig)
  return <span></span>//<Switch onText='' offText='' {...other} />
}

import { Row, Col } from 'antd';
import Checkbox, { CheckboxGroupProps } from 'antd/lib/checkbox';
import 'antd/lib/checkbox/style/css';
// import Switch, { SwitchProps } from 'antd/lib/switch';
// import 'antd/lib/switch/style/css';
import 'element-theme-default/lib/switch.css';
import { Switch } from 'element-react'
import * as React from 'react';
import { OFormItemCommon } from '../Interface/FormItem';
import { commonInjectItem } from "./commonInjectItem";
import { useOptionsStore } from './OptionsUtil';
import { Observer } from "mobx-react-lite";
// import { SlotContext } from 'src/utils/SlotUtils';
import { ScopedSlot } from 'src/utils/SlotUtils';
import { Option } from 'src/utils';
import { pullAll } from 'lodash';
import { ItemConfig } from 'src/stores';

export interface IAppProps extends CheckboxGroupProps, OFormItemCommon {

}
export const CheckItem: React.FunctionComponent<IAppProps> = commonInjectItem(
  props => <Check {...props} />
)
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
const Check: React.FunctionComponent<IAppProps> = ({ antdForm, formStore, code, itemConfig, onChange, onBlur, ...other }) => {
  const store = useOptionsStore(itemConfig)
  // const { scopedSlots } = React.useContext(SlotContext)
  if (itemConfig.useSlot) {
    // const slot: CheckScopedSlot = scopedSlots[itemConfig.slot]
    // const slotFactory = (options: Option, index: number) => slot({
    //   col: {
    //     data: other.value,
    //     item: options,
    //     index,
    //     props: formStore.formSource
    //   },
    //   value: other.value && other.value.includes(options.value),
    //   onChange: (checked: boolean) => {
    //     if (checked) {
    //       const nextV = Utils.isArrayFilter(other.value) || []
    //       nextV.push(options.value)
    //       onChange(nextV)
    //     } else {
    //       onChange(pullAll([...Utils.castArray(other.value)], [options.value]))
    //     }
    //   },
    //   config: itemConfig
    // })
    // return (
    //   <div className='el-checkbox-group'>
    //     <For index='i' each='option' of={store.displayOptions}>
    //       <span key={i}>{ slotFactory(option, i) }</span>
    //     </For>
    //   </div>
    // )
    const slotFactory = (options: Option, index: number) => ({
      col: {
        data: other.value,
        item: options,
        index,
        props: formStore.formSource
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
  return (
    <Observer>{() =>
      <Checkbox.Group {...other} style={{ width: '100%' }} onChange={(e) => {
        console.log(itemConfig.slot, e)
        onChange(e)
      }} options={store.displayOptions as any}>
        <Row>
          <Col span={8}><Checkbox value="A">A</Checkbox></Col>
          <Col span={8}><Checkbox value="B">B</Checkbox></Col>
          <Col span={8}><Checkbox value="C">C</Checkbox></Col>
          <Col span={8}><Checkbox value="D">D</Checkbox></Col>
          <Col span={8}><Checkbox value="E">E</Checkbox></Col>
        </Row>
      </Checkbox.Group>
    }</Observer>
  );
}
interface SwitchProps extends ElementReactLibs.ComponentProps<{}> {
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
const OSwitch = ({ antdForm, formStore, code, itemConfig, ...other }: ISwitchItemProps) => {
  console.log(other)
  return <Switch {...other} />
}
export const SwitchItem: React.FunctionComponent<ISwitchItemProps> = commonInjectItem(
  (props) => <OSwitch {...props} onText='' offText='' />
)
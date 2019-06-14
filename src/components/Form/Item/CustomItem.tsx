import { ItemConfig } from '@/stores';
import { Option } from '@/utils';
import { CheckboxGroupProps } from 'antd/lib/checkbox';
import 'antd/lib/checkbox/style/css';
// import Switch, { SwitchProps } from 'antd/lib/switch';
// import 'antd/lib/switch/style/css';
import 'element-ui/lib/theme-chalk/switch.css';
import * as React from 'react';
// import { SlotContext } from '@/utils/SlotUtils';
import { useVueRender } from '../../../utils/SlotUtils';
import { OFormItemCommon } from '../Interface/FormItem';
import { commonInjectItem } from "./commonInjectItem";

export interface IAppProps extends CheckboxGroupProps, OFormItemCommon {

}
export const CustomItem: React.FunctionComponent<IAppProps> = commonInjectItem(
  props => <Custom {...props} />
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

const Custom: React.FunctionComponent<IAppProps> = ({ antdForm, formStore, code, itemConfig, onChange, onBlur, ...other }) => {
  const Component = useVueRender(itemConfig.i.component, itemConfig)
  return <Component value={other.value} onChange={onChange}/>
}
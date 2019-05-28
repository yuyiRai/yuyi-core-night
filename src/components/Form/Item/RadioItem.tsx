import * as React from 'react';
import Radio, {RadioGroupProps} from 'antd/lib/radio'
import 'antd/lib/radio/style/css'
import { OFormItemCommon } from '../Interface/FormItem';
import { commonInjectItem } from "./commonInjectItem";
// import Utils from '../../../utils';
// import classnames from 'classnames'
// import { VueInReact } from 'vuera'
import styled from 'styled-components';
import { useOptionsStoreProps } from './OptionsUtil';

interface IAppProps extends OFormItemCommon, RadioGroupProps {
}

const App: React.FunctionComponent<IAppProps> = ({ antdForm, formStore, code, itemConfig, ...other }) => {
  const RadioGroup = useOptionsStoreProps(itemConfig, Radio.Group)
  return (
    <RadioGroup {...other} ></RadioGroup>
  );
};
const StyledItem = styled(App)`

`


export const RadioItem = commonInjectItem(StyledItem) as any;
export const RadioOneItem: React.FunctionComponent<IAppProps> = commonInjectItem(({ antdForm, formStore, code, itemConfig, ...other }) => {
  return ( <Radio.Group {...other} options={[
    { label: itemConfig.YLabel || '是', value: '1'},
    { label: itemConfig.NLabel || '否', value: '0'},
  ]}/> );
}) as any;

export default App;
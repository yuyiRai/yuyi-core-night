import { useObserver } from '@/hooks';
import Radio, { RadioGroupProps } from 'antd/lib/radio';
import 'antd/lib/radio/style/css';
import * as React from 'react';
import { useFormItemConfig } from '../hooks/useItemConfig';
import { OFormItemCommon } from '../Interface/FormItem';

interface IAppProps extends OFormItemCommon, RadioGroupProps {
}

export const useRadioItem = ({ code, ...other }) => {
  return useObserver(() => {
    const { itemConfig } = useFormItemConfig()
    return (
      <Radio.Group options={itemConfig.useOptionsStore().displayOptions as any} {...other}></Radio.Group>
    )
  });
};

export const useRadioOneItem: React.FunctionComponent<IAppProps> = ({ code, ...other }) => {
  return useObserver(() => {
    const itemConfig = useFormItemConfig().itemConfig
    return (<Radio.Group {...other} options={[
      { label: itemConfig.YLabel || '是', value: '1' },
      { label: itemConfig.NLabel || '否', value: '0' },
    ]} />)
  });
};

export default useRadioItem;
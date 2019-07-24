import * as React from 'react';
import MuiCheckbox, { CheckboxProps as MuiCheckBoxProps } from '@material-ui/core/Checkbox'
import AntdCheckBox, { CheckboxProps as AntCheckBoxProps, CheckboxGroupProps as AntCheckBoxGroupProps } from 'antd/lib/checkbox'
import { useAsObservableSource, useObserver } from '@/hooks';

interface ICheckBoxProps extends AntCheckBoxProps {
  muiProps: MuiCheckBoxProps;
}

export function useCheckBox(props: ICheckBoxProps) {
  const mutlProps = useAsObservableSource(props)

  return useObserver(() => <MuiCheckbox { ...mutlProps.muiProps }/>);
}
export const OAntdCheckBox = AntdCheckBox

const CheckBox: React.FunctionComponent<ICheckBoxProps> = (props) => {
  return useCheckBox(props)
};

interface ICheckBoxGroupProps extends AntCheckBoxGroupProps {
  muiProps: MuiCheckBoxProps;
}

export function useCheckBoxGroup(props: ICheckBoxGroupProps) {
  const mutlProps = useAsObservableSource(props)

  return useObserver(() => <MuiCheckbox { ...mutlProps.muiProps }/>);
}

declare global {
  interface useCheckBox {
    group: typeof useCheckBoxGroup
  }
}
useCheckBox.group = useCheckBoxGroup

export default CheckBox;
import { AutoComplete } from 'antd'
import * as React from 'react';
import { AutoCompleteProps } from 'antd/lib/auto-complete';
import { OFormItemCommon } from '../../Interface';

interface IAutoCompleteItemProps extends AutoCompleteProps, OFormItemCommon{
}

const AutoCompleteItem: React.FunctionComponent<IAutoCompleteItemProps> = (props) => {
  const { antdForm, formStore, code, itemConfig, ...other } = props
  return <AutoComplete {...other}/>;
};

export default AutoCompleteItem;
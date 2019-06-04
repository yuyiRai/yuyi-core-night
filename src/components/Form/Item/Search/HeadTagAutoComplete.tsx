import { AutoComplete } from 'antd';
import { AutoCompleteProps } from 'antd/lib/auto-complete';
import { HeadTagInput } from './HeadTagInput';
import { Utils } from '@/utils';
import React from 'react'
import styled from 'styled-components';


const App: React.FunctionComponent<AutoCompleteProps & {
  tag?: string;
}> = ({ tag, children, ...props }) => {
  return (
    <AutoComplete {...props}>
      <HeadTagInput tag={tag} />
    </AutoComplete>
  );
};
export const HeadTagAutoComplete = styled(App)`
  & .ant-select-selection__placeholder {
    margin-left: ${ (props: AutoCompleteProps & {tag: string;}) => props.tag && Utils.getRealLength(props.tag)*5.5 + 30 }px !important;
  }
`
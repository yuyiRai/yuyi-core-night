import { Input, Tag } from 'antd';
import { InputProps } from 'antd/lib/input';
import { Utils } from 'src/utils';
import React from 'react'

import styled from 'styled-components';
export interface IHeadTagProps {
  tag: string;
}

const App = React.forwardRef(({ tag, ...other }: IHeadTagProps & InputProps, ref: React.LegacyRef<Input>) => {
  return <Input ref={ref} prefix={tag && <Tag color='blue'>{tag}</Tag>} {...other} />;
});

export const HeadTagInput = styled(App)`
  & .ant-input-prefix > .ant-tag {
    margin-left: -5px;
  }
  &.ant-input-affix-wrapper {
    & .ant-input:not(:first-child) {
      padding-left: ${ (props: IHeadTagProps) => props.tag && Utils.getRealLength(props.tag) * 5 + 30}px;
    }
  }
`;
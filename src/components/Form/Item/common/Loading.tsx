import { observer } from '@/hooks';
import * as React from 'react';
import { IUseLoading, useLoading } from '../../hooks/useLoading';

interface ILoadingProps extends IUseLoading {
  children?: React.ReactElement | React.ReactElement[]
}

export const Loading: React.SFC<ILoadingProps> = observer((props) => {
  return useLoading(props.children, props)
});


export default Loading;
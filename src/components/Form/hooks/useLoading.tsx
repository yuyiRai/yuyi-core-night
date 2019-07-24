import { observer, useAsObservableSource, useObserver } from '@/hooks';
import { Utils } from '@/utils';
import { Icon, Spin } from 'antd';
import { SpinProps } from 'antd/lib/spin/index';
import * as React from 'react';
import { useFormItemConfig } from './useItemConfig';

const antIcon = <Icon type="loading" style={{ fontSize: 24 }} spin />;

export interface IUseLoading extends SpinProps {
  loading: boolean;
}

export interface IFormItemLoadingProps extends SpinProps {
  code: string;
}

export function useLoadingProps(props: IUseLoading) {
  const { spinning, loading, indicator, delay, ...other } = props;
  return useAsObservableSource({
    ...other,
    delay: Utils.isNumberFilter(delay, 100),
    indicator: Utils.isNotEmptyValueFilter(indicator, antIcon),
    spinning: Utils.isBooleanFilter(loading, spinning)
  })
}

export function useLoading(children: any, props: IUseLoading) {
  const spinProps = useLoadingProps(props)
  // useLog('loading inner');
  return useObserver(() => <Spin {...spinProps}>{children}</Spin>)
}

export const FormItemLoading: React.FunctionComponent<IFormItemLoadingProps> = observer(
  ({ code, children, ...other }) => {
    return useObserver(() => {
      const itemConfig = useFormItemConfig().itemConfig
      // useLog('loading update', code);
      // useLog('loading obs');
      return useLoading(children, { ...other, loading: itemConfig.loading })
      // return <Loading loading={itemConfig.loading} {...other}>{children}</Loading>
    })
  });

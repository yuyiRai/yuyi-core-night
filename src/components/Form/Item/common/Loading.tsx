import * as React from 'react';
import { Spin, Icon } from 'antd';
import { SpinProps } from 'antd/lib/spin/index';
import { OFormItemCommon } from '../../Interface';
import { commonInjectItem } from '../commonInjectItem';
import { Utils } from 'src/utils';
const antIcon = <Icon type="loading" style={{ fontSize: 24 }} spin />;
interface ILoadingProps extends SpinProps {
  loading?: boolean;
}

interface IFormItemLoadingProps extends ILoadingProps, OFormItemCommon {
  context?: React.ReactElement
}

export const Loading: React.FunctionComponent<ILoadingProps> = ({spinning, loading, children, ...props}) => {
  return <Spin {...props} delay={100} indicator={antIcon} spinning={Utils.isBooleanFilter(loading, spinning)}>{children}</Spin>;
};

export const FormItemLoading: React.FunctionComponent<IFormItemLoadingProps> = commonInjectItem(
  ({ itemConfig, formStore, antdForm, code, ...other }) => {
    return <Loading loading={itemConfig.loading} {...other}>{other.children}</Loading>
  }
);

export default Loading;
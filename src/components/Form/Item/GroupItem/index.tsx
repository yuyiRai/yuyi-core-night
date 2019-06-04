import { Row } from 'antd';
import { set } from 'lodash';
import * as React from 'react';
import { ItemSwitchType } from '..';
import { FormItemContainer } from '../../FormItem';
import { OFormItemCommon } from '../../Interface';
import { commonInjectItem } from '../commonInjectItem';
import { Utils } from '@/utils';
import styled from 'styled-components';

interface IGroupItemProps extends OFormItemCommon, React.HTMLAttributes<any>, React.PropsWithChildren<any> {
}

const InnerRow = styled(Row)`
  width: 100% !important;
  & ${props => '.use-item-col'} {
    margin-bottom: 0 !important;
  }
`

const GroupItem: React.FunctionComponent<IGroupItemProps> = commonInjectItem((props) => {
  const { antdForm, formStore, code, itemConfig, value, ...other } = props
  const itemType = Utils.reduce(itemConfig.childrenConfig, (obj, config, key) => {
    const Component = ItemSwitchType(config.type);
    const children = (
      <Component code={config.code} itemConfig={config} onChange={(v: any, ...args: any[]) => {
        const changeV = set(Utils.cloneDeep(value), config.keyInnerCode, v)
        // console.log('GroupItem', 'change', value, ...args)
        other.onChange(changeV)
      }} value={config.currentComponentValue} placeholder={config.placeholder} {...{ antdForm, formStore }} />
    )
    return [...obj, (
      <FormItemContainer key={key} itemConfig={config} >{children}</FormItemContainer>
    )]
  }, [])
  // console.log('GroupItem', value, itemConfig.childrenConfig, itemConfig, antdForm, formStore, code, { ...other })
  return <InnerRow>{itemType}</InnerRow>
});

// export class OGroupItem extends React.Component<IGroupItemProps> {
//   render() {
//   }
// }

export default GroupItem;
import { useObserver } from '@/hooks';
import { Utils } from '@/utils';
import { makeStyles } from '@material-ui/styles';
import { Row } from 'antd';
import { map, set } from 'lodash';
import * as React from 'react';
import { useCallback } from 'react';
import styled from 'styled-components';
import { ItemSwitchType } from '..';
import { useFormItemContainer } from '../../FormItem';
import { FormItemConfigContext, useFormItemConfig } from '../../hooks/useItemConfig';
import { useUnmount } from '../../hooks/useLivehooks';
import { OFormItemCommon } from '../../Interface';

interface IGroupItemProps extends OFormItemCommon, React.HTMLAttributes<any>, React.PropsWithChildren<any> {
}

export const InnerRow = styled(Row)`
  width: 100% !important;
  & ${props => '.use-item-col'} {
    margin-bottom: 0 !important;
  }
`

const useStyle = makeStyles(() => ({
  innerRow: ({
    width: '100% !important',
    '& .use-item-col': {
      marginBottom: '0 !important'
    }
  })
}))

const GroupItemChild: React.SFC<any> = (props, ref) => {
  return useObserver(() => {
    const config = useFormItemConfig()
    const onChange = useCallback(function (v: any, ...args: any[]) {
      const changeV = set(Utils.cloneDeep(props.value), config.itemConfig.keyInnerCode, v)
      // console.error('GroupItem', 'change', config, v, changeV, props.value, ...args)
      props.onChange(changeV)
    }, [props, config])
    // console.error('GroupItem', config)
    const childProps = ({
      code: config.itemConfig.code,
      onChange,
      value: config.itemConfig.currentComponentValue,
      placeholder: config.itemConfig.placeholder
    })
    const useItem = ItemSwitchType(config.itemConfig.type);
    return useItem(childProps, ref)
  })
}

export const useGroupItem = (props: IGroupItemProps, ref: React.Ref<any>) => {
  return useObserver(() => {
    const { code, value, ...other } = props
    const childRef = React.useRef<any>({})
    useUnmount(() => {
      for (const key in childRef.current) {
        childRef.current[key] = null
      }
      childRef.current = null
    }, [childRef.current])
    const context = useFormItemConfig()
    const itemType = map(context.itemConfig.childrenConfig, (a, key) => {
      // const children = 
      return useObserver(() => {
        const config = context.itemConfig.childrenConfig[key]
        childRef.current = { ...childRef.current, [key]: { current: { itemConfig: config } } }
        const child = useFormItemContainer(
          <GroupItemChild value={config.currentComponentValue} onChange={other.onChange} />,
          config
        )
        return (
          <FormItemConfigContext.Provider key={key} value={{ code: context.itemConfig.code, pipe: itemConfig => itemConfig.childrenConfig[key] }}>
            {child}
          </FormItemConfigContext.Provider>
        )
      })
    })
    const classes = useStyle(props)
    return <Row className={classes.innerRow} ref={ref}>{itemType}</Row>
  }, 'useGroupItem')
};

export default useGroupItem;
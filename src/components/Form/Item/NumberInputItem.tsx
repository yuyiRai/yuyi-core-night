import Utils, { zipEmptyData } from '@/utils';
import { InputNumberProps } from 'antd/lib/input-number';
import 'antd/lib/input-number/style/css';
import classnames from 'classnames';
import { InputNumber } from 'element-ui';
import * as React from 'react';
import styled from 'styled-components';
import { VueInReact } from 'vuera';
import { OFormItemCommon } from '../Interface/FormItem';
import { useFormItemConfig } from '../hooks/useItemConfig';
import { useObserver } from '@/hooks';

const ElInputNumber = VueInReact({
  functional: true,
  render(h, { data, props }) {
    return h(InputNumber, {
      ...data,
      on: zipEmptyData({
        ...data.on,
        'change': props.onChange,
        'blur': props.onBlur
      }),
      class: props.className,
      attrs: {
        ...data.attrs,
        style: classnames(props.style)
      }
    })
  }
})

export interface IInputNumberProps extends InputNumberProps, OFormItemCommon {
}

const NumberInputBase = styled(ElInputNumber)`
&.increase-only.el-input-number.is-controls-right {
  & .el-input-number__decrease {
    display: none;
  }
  & .el-input-number__increase {
    height: calc(100% - 2px) !important;
    border-bottom: 0;
    border-bottom-right-radius: 10px;
    i {    
      top: 6px;
      position: relative;
      /* &:before {
        content: '\\E62B';
      } */
    }
  }
}
`
const defaultPrecision = 0

export const useNumberInputItem: React.FunctionComponent<IInputNumberProps> = ({ code, className, ...other }) => {
  return useObserver(() => {
    const { itemConfig } = useFormItemConfig()
    const { suffix } = itemConfig;
    return (
      <span>
        <NumberInputBase defaultValue={0} size='small'
          className={classnames({ 'increase-only': itemConfig.increaseOnly }, className)}
          style={suffix ? 'width: calc(80% - 20px);' : 'width: 100%;'}
          precision={Utils.isNumberFilter(parseInt(itemConfig.numberControl), defaultPrecision)}
          step={Utils.isNumberFilter(itemConfig.step, 1 / Math.pow(10, itemConfig.numberControl || defaultPrecision))}
          controls={itemConfig.useControl}
          controls-position='right'
          min={0}
          {...other}
        >
        </NumberInputBase>
        {Utils.jsxIf(suffix, <span slot='suffix' style={{
          display: 'inline-block;', position: 'relative', marginLeft: '5px'
        }}>{suffix}</span>)}
      </span>
    )
  });
};

export default useNumberInputItem;
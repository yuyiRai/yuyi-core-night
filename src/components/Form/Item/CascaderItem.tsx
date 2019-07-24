import { useObserver } from '@/hooks';
import { Option, Utils } from '@/utils';
import { Cascader } from 'antd';
import { CascaderProps } from 'antd/lib/cascader';
import * as React from 'react';
import { useSearchStore } from '../hooks/useItemConfig';
import { OFormItemCommon } from '../Interface/FormItem';

interface ICascaderItemProps extends OFormItemCommon, CascaderProps {
}

export const useCascaderItem = ({ code, ...other }: ICascaderItemProps, ref: any) => {
  return useObserver(() => {
    const store = useSearchStore(() => ({
      computedMap: {
        loadData() {
          return (dataPath: Option[]) => this.searchStore.loadData(dataPath)
        }
      },
      transformer: (optionsStore) => {
        return optionsStore.displayOptions.map(i =>
          Utils.isNil(i.isLeaf) ? Object.assign(i, {
            isLeaf: false //(Utils.isArrayFilter(other.value) || []).length > Utils.isNumberFilter(itemConfig.loadDataDeep, 3)
          }) : i
        )
      }
    }))
    const forwardRef = React.useRef(ref)
    const { itemConfig, loadData, optionsStore } = store
    // console.log(itemConfig, other, optionsStore.transformOption)
    return (
      <Cascader ref={forwardRef} displayRender={(labels, selectedOptions) =>
        labels.map((label, i) => {
          return <span key={i}>{label}{i < labels.length - 1 && ` / `}</span>;
        })
      } style={{ width: '100%' }} {...other} placeholder={itemConfig.loading ? 'loading..' : other.placeholder} options={optionsStore.transformOption} loadData={loadData}></Cascader>
    )
  }, 'useCascaderItem');
};


export default useCascaderItem;
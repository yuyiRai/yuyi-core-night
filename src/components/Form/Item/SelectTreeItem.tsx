import { useObserver } from '@/hooks';
import { Utils } from '@/utils';
import { TreeSelect } from 'antd';
import { TreeNodeValue, TreeSelectProps } from 'antd/lib/tree-select/interface';
import * as React from 'react';
import { useSearchStore } from '../hooks/useItemConfig';
import { OFormItemCommon } from '../Interface/FormItem';

interface IAppProps extends OFormItemCommon, TreeSelectProps<TreeNodeValue> {
}

export const useSelectTreeItem: React.FunctionComponent<IAppProps> = ({ code, onBlur, ...other }, ref) => {
  // console.log(itemConfig, other, optionsStore.transformOption)
  return useObserver(() => {
    const { optionsStore, loadData } = useSearchStore(() => ({
      computedMap: {
        loadData() {
          return this.searchStore.loadData
            ? (treeNode: any) => this.searchStore.loadData(convertTreeNodeToLoadData(treeNode.props))
            : undefined
        }
      },
      transformer(optionsStore) {
        return optionsStore.displayOptions.map(i =>
          Utils.isNil(i.isLeaf) ? Object.assign(i, {
            isLeaf: false //(Utils.isArrayFilter(other.value) || []).length > Utils.isNumberFilter(itemConfig.loadDataDeep, 3)
          }) : i
        )
      }
    }))
    return (
      <TreeSelect
        ref={ref}
        allowClear
        autoClearSearchValue={false}
        treeData={optionsStore.nativeTransformOption}
        loadData={loadData}
        treeDefaultExpandedKeys={Utils.castArray(other.value)}
        treeNodeFilterProp='title'
        showCheckedStrategy={TreeSelect.SHOW_ALL}
        treeNodeLabelProp='label'
        // onDropdownVisibleChange={visible => {
        //   !visible && other.onBlur()
        // }}
        showSearch
        {...other}
      />
    )
  }, 'SelectTreeItem');
};

export function convertTreeNodeToLoadData(treeNode: any) {
  const path: any[] = [treeNode]
  let current = treeNode.parentOption;
  while (!Utils.isNil(current)) {
    // debugger
    path.unshift(current)
    current = current.parentOption
  }
  return path
  // treeNode.props
}

export default useSelectTreeItem;
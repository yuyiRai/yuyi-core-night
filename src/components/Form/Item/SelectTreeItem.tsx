import * as React from 'react';
import TreeSelect, { TreeSelectProps } from 'antd/lib/tree-select'
import 'antd/lib/tree-select/style/css'
import { OFormItemCommon } from '../Interface/FormItem';
import { Utils } from 'src/utils';
import { commonInjectItem } from "./commonInjectItem";
// import Utils from '../../../utils';
// import classnames from 'classnames'
// import { VueInReact } from 'vuera'
import styled from 'styled-components';
import { useSearchStore, useItemConfig } from './OptionsUtil';
import { Observer } from 'mobx-react-lite';

interface IAppProps extends OFormItemCommon, TreeSelectProps {
}
const App: React.FunctionComponent<IAppProps> = ({ antdForm, formStore, code, itemConfig, onBlur, ...other }) => {
  itemConfig = useItemConfig(itemConfig)
  const searchStore = useSearchStore(itemConfig, (optionsStore) => {
    return optionsStore.displayOptions.map(i =>
      Utils.isNil(i.isLeaf) ? Object.assign(i, {
        isLeaf: false //(Utils.isArrayFilter(other.value) || []).length > Utils.isNumberFilter(itemConfig.loadDataDeep, 3)
      }) : i
    )
  })
  const { optionsStore } = itemConfig;
  const loadData = searchStore.loadData ? (treeNode: any) => searchStore.loadData(convertTreeNodeToLoadData(treeNode.props)) : undefined
  console.log(itemConfig, other, optionsStore.transformOption)
  return (
    <Observer>{() => {
      return (
        <TreeSelect 
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
    }}</Observer>
  );
};
const StyledItem = styled(App)`

`
export const SelectTreeItem = commonInjectItem(StyledItem) as any;

export function convertTreeNodeToLoadData(treeNode: any) {
  const path: any[] = [treeNode]
  let current = treeNode.parentOption;
  while(!Utils.isNil(current)) {
    debugger
    path.unshift(current)
    current = current.parentOption
  }
  return path
  // treeNode.props
}

export default App;
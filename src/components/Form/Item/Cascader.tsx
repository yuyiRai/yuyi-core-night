import * as React from 'react';
import Cascader, { CascaderProps } from 'antd/lib/cascader'
import 'antd/lib/cascader/style/css'
import { OFormItemCommon } from '../Interface/FormItem';
import { commonInjectItem } from "./commonInjectItem";
import { Utils } from 'src/utils';
// import Utils from '../../../utils';
// import classnames from 'classnames'
// import { VueInReact } from 'vuera'
import styled from 'styled-components';
import { useSearchStore, useItemConfig } from './OptionsUtil';
import { Observer } from 'mobx-react-lite';

interface IAppProps extends OFormItemCommon, CascaderProps {
}
const App: React.FunctionComponent<IAppProps> = ({ antdForm, formStore, code, itemConfig, ...other }) => {
  itemConfig = useItemConfig(itemConfig)
  const searchStore = useSearchStore(itemConfig, (optionsStore) => {
    return optionsStore.displayOptions.map(i =>
      Utils.isNil(i.isLeaf) ? Object.assign(i, {
        isLeaf: false //(Utils.isArrayFilter(other.value) || []).length > Utils.isNumberFilter(itemConfig.loadDataDeep, 3)
      }) : i
    )
  })
  const { optionsStore } = itemConfig;
  return (
    <Observer>{() => {
      // console.log(itemConfig, other, optionsStore.transformOption)
      return (
        <Cascader displayRender={(labels, selectedOptions) =>
          labels.map((label, i) => {
            return <span key={i}>{label}{i < labels.length - 1 && ` / `}</span>;
          })
        } style={{ width: '100%' }} {...other} placeholder={itemConfig.loading ? 'loading..' : other.placeholder} options={optionsStore.transformOption} loadData={searchStore.loadData}></Cascader>
      )
    }}</Observer>
  );
};
const StyledItem = styled(App)`

`
export const CascaderItem = commonInjectItem(StyledItem) as any;


export default App;
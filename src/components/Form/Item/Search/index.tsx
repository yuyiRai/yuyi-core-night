import { useObserver } from '@/hooks';
import { Utils } from '@/utils';
import { AutoComplete, Select, Spin, Tag } from 'antd';
import { OptGroupProps, SelectProps } from 'antd/lib/select/index';
import * as React from 'react';
import styled from 'styled-components';
import { OptionsStore } from '../../../../stores/ItemConfig/OptionsStore';
import { useSearchStore } from '../../hooks/useItemConfig';
import { IItemConfig, OFormItemCommon } from '../../Interface';
import { ValueHintContainer } from '../OptionsUtil/ToolTipContainer';
import { HeadTagAutoComplete } from './HeadTagAutoComplete';
import { TagGroup } from './TagGroup';
export interface ISelectItemProps extends OFormItemCommon, SelectProps {
  center?: boolean;
}
export const useSearchItem: React.SFC<ISelectItemProps> = (props: any) => {
  const { code, ...other } = props
  const [isVisible, changeVisible] = React.useState(undefined)
  return useObserver(() => {
    // const itemConfig = useFormItemConfig()
    // const isAutoComplete = (itemConfig.allowInput === true && !itemConfig.multiple)
    // const OptionItem = isAutoComplete ? AutoComplete.Option : Select.Option
    // const OptGroupItem = isAutoComplete ? AutoComplete.OptGroup : Select.OptGroup
    // const mode = getSelectModel(itemConfig)
    // const local = useLocalStore((itemConfig) => ({
    //   itemConfig,
    //   get searchStore() {
    //     return this.itemConfig.useSearchStore((store: OptionsStore<JSX.Element>) => {
    //       return store.displayOptions.map(d => {
    //         const tag = store.getTagByOption(d)
    //         return <OptionItem title={d.label} key={d.key} value={d.value}>{tag && <Tag>{tag}</Tag>}{store.getOptionsLabel(d)}</OptionItem>
    //       });
    //     })
    //   }
    // }), itemConfig)
    // const { searchStore } = local
    // const onDropdownVisibleChange = React.useCallback(open => {
    //   changeVisible(open ? open : undefined);
    //   !open && local.searchStore.resetKeyword()
    // }, [local])
    // const { optionsStore } = itemConfig as ItemConfig
    // const { transformOption } = optionsStore;
    // // console.log(isAutoComplete, itemConfig)
    // // console.log(isAutoComplete, props, optionsStore.displayOptions, transformOption, itemConfig.options)
    // const [isVisible, changeVisible] = React.useState(undefined)
    const local = useSearchStore(() => ({
      computedMap: {
        mode() {
          if (this.itemConfig.multiple) {
            if (this.itemConfig.allowCreate) {
              return 'tags'
            }
            return 'multiple'
          }
          return undefined;
        },
        isAutoComplete() {
          return this.itemConfig.allowInput === true && !this.itemConfig.multiple
        },
        onDropdownVisibleChange() {
          return (open: boolean) => {
            // console.error(open, this, this);
            changeVisible(open ? open : undefined);
            !open && this.searchStore.resetKeyword()
          }
        }
      },
      transformer(store: OptionsStore<JSX.Element>) {
        const { itemConfig } = store
        const isAutoComplete = itemConfig.allowInput === true && !itemConfig.multiple
        const OptionItem = isAutoComplete ? AutoComplete.Option : Select.Option
        return store.displayOptions.map(d => {
          const tag = store.getTagByOption(d)
          return <OptionItem title={d.label} key={d.key} value={d.value}>{tag && <Tag>{tag}</Tag>}{store.getOptionsLabel(d)}</OptionItem>
        });
      }
    }))
    // const onDropdownVisibleChange = React.useCallback(open => {
    //   changeVisible(open ? open : undefined);
    //   !open && local.searchStore.resetKeyword()
    // }, [local])
    const { mode, itemConfig, optionsStore, onDropdownVisibleChange, searchStore, isAutoComplete } = local
    const OptGroupItem = isAutoComplete ? AutoComplete.OptGroup : Select.OptGroup
    const { transformOption } = optionsStore;
    const optionsList = switchContainer(
      <OptGroupItem key={searchStore.searchHintText} label={searchStore.searchHintText} />,
      transformOption,
      itemConfig.type === 'search' && Utils.isNotEmptyString(searchStore.searchHintText)
    )
    const hint = (
      <TagGroup labelsConfig={optionsStore.selectedLablesConfig} onClose={v => {
        other.onChange(v, transformOption)
      }} />
    )
    if (isAutoComplete) {
      return (
        <HeadTagAutoComplete
          optionLabelProp="title"
          tag={optionsStore.getTagByOption()}
          {...other}
          onSearch={searchStore.onSearch}
          dataSource={transformOption}
          allowClear
        />
      )
    }
    const selectElement = (
      <StyledSelect mode={mode} style={{ textAlign: itemConfig.center ? 'center' : 'left' }}
        allowClear
        autoClearSearchValue={false}
        showSearch={itemConfig.type === 'search'}
        showArrow={true}
        defaultActiveFirstOption={false}
        optionFilterProp="title"
        filterOption={itemConfig.type === 'search' && !itemConfig.i.remoteMethod}
        onSearch={itemConfig.type === 'search' ? searchStore.onSearch : undefined}
        notFoundContent={getNotFoundContent(itemConfig)}
        loading={itemConfig.loading}
        {...other}
        onDropdownVisibleChange={onDropdownVisibleChange}
      >{optionsList}</StyledSelect>
    )
    return <>{
      switchContainer(
        <ValueHintContainer value={hint} visible={optionsStore.hasSelectedTag ? isVisible : false} ><></></ValueHintContainer>,
        selectElement,
        itemConfig.multiple
      )
    }</>
  }, 'useSearchItem')
}

export interface ISearchResultGroupProps extends OptGroupProps {
  disabled?: boolean;
}

export function preSwitchContainer(container: JSX.Element) {
  return (children: JSX.Element | JSX.Element[], switchValue: boolean) => switchContainer(container, children, switchValue)
}
export function switchContainer(container: JSX.Element, children: JSX.Element | JSX.Element[], switchValue: boolean) {
  if (switchValue) {
    return React.cloneElement(container, container.props, children)
  }
  return children
}


export const getNotFoundContent = (itemConfig: IItemConfig) => {
  return itemConfig.loading ? <div style={{ textAlign: 'center' }}><Spin size="small" /></div> : undefined
}

export const StyledSelect = styled(Select).attrs(
  props => ({
    dropdownMenuStyle: { textAlign: props.style.textAlign }
  })
)`
  min-height: 32px;
  & .ant-select-selection__rendered > * { 
    text-align: ${props => props.style.textAlign};
  }
  & .ant-select-selection-selected-value {
    width: 100%;
  }
  & .ant-select-selection--multiple {
    max-height: 32px !important;
    overflow: hidden;    
    margin-bottom: -11px;
  }
`
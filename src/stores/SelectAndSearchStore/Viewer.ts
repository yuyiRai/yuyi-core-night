/* eslint-disable */
import { computed, extendObservable, IKeyValueMap } from 'mobx';
import { SelectAndSearchStore } from './Store';
import { Utils } from '@/utils';
import { map, concat } from 'lodash'

export interface OptionComplier {
  (props: {
    key: string,
    label: string,
    value: string
    data?: any;
  }): any;
}

export interface TagComplier {
  (props: {
    prefix: string,
    label: string,
    suffix: string
  }): any;
}

export class SelectAndSearchViewStore extends SelectAndSearchStore {
  tagComplier: TagComplier;
  optionComplier: OptionComplier;
  @computed get classNames() {
    const { prefix } = this.selectedLabelConveration
    return {
      [`input-prefix-tag-text-${prefix.length}`]: prefix.length > 0,
      'line-height-36': this.itemConfig.multiple,
    }
  }

  @computed get style() {
    return {
      "width": this.itemConfig.width === 'auto' ? `${15 + Utils.isStringFilter(this.shadowOption.value, '').length / 3}vw` : this.itemConfig.width
    }
  }

  extendFromVueComponent = (properties: IKeyValueMap) => {
    return extendObservable(this, properties, {}, {})
  }

  @computed get prefixDom() {
    const { prefix } = this.selectedLabelConveration
    // console.log(this.itemConfig.label, this.selectedLabelConveration)
    return Utils.isNotEmptyString(prefix) && this.tagComplier(this.selectedLabelConveration)
  }
  @computed get emptyOptionsDom() {
    const {
      displayOptions, useEmpty,
      itemConfig: { multiple },
      placeholder, type
    } = this;
    return Utils.jsxIf(
      useEmpty(displayOptions) && !multiple,
      this.optionComplier({ key: 'unselect', label: type == 'select' ? placeholder : '', value: null })
    )
  }
  @computed get displayOptionsDom() {
    return map(this.displayOptions, item => {
      const { label } = SelectAndSearchStore.getConvertLabel(item.label)
      return this.optionComplier({ key: item.key, label, value: item.value, data: item })
    })
  }
  @computed get popperOptionsDom() {
    return concat([
      this.prefixDom,
      this.emptyOptionsDom,
    ],
      this.displayOptionsDom
    )
  }
}


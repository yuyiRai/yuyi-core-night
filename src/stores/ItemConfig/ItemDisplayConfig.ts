/* eslint-disable */
import { action, computed, IKeyValueMap, observable } from 'mobx';
import Utils from '@/utils';
import { ComputedPick, ComputedPropertyCreater, IItemConfig } from './interface';
import { FormStore } from '@/components';
export interface IDisplayConfigCreater<FM> {
  inline?: ComputedPropertyCreater<boolean, FM>;
  isViewOnly?: ComputedPropertyCreater<boolean, FM>;
  showMessage?: ComputedPropertyCreater<boolean, FM>;
  textAlign?: ComputedPropertyCreater<'center' | 'left' | 'right', FM>;
  size?: ComputedPropertyCreater<boolean, FM>;
  col?: ComputedPropertyCreater<number, FM>;
  offset?: ComputedPropertyCreater<number, FM>;
  offectRight?: ComputedPropertyCreater<number, FM>;
  prefix?: ComputedPropertyCreater<any, FM>;
  suffix?: ComputedPropertyCreater<any, FM>;
  height?: ComputedPropertyCreater<string, FM>;
  useLabel?: ComputedPropertyCreater<boolean, FM>;
}
export interface IDisplayConfig<FM> extends ComputedPick<IDisplayConfigCreater<FM>, FM> {
}

export class DisplayConfig<FM> {
  @observable itemConfig: IItemConfig<FM>
  @observable.ref staticProps: IKeyValueMap

  @computed.struct get props(): Partial<FormStore> & IKeyValueMap {
    return { ...this.staticProps, ...this.itemConfig.formStore }
  }


  constructor(itemConfig?: IItemConfig<FM>, staticProps?: IKeyValueMap){
    this.itemConfig = itemConfig;
    this.staticProps = staticProps;
  }
  
  @action init(itemConfig: IItemConfig<FM>, staticProps: IKeyValueMap){
    this.itemConfig = itemConfig;
    this.staticProps = staticProps;
    return this;
  }
  @computed get isInlineMessage() {
    return this.itemConfig.inline || this.itemConfig.name === this.itemConfig.code
  }
  @computed get isShowMessage() {
    return !this.itemConfig.isViewOnly && ![this.itemConfig.showMessage, this.props.showMessage].some(i => i === false)
  }
  @computed get textAlign() {
    return Utils.isStringFilter(this.itemConfig.textAlign, this.props.textAlign)
  }
  @computed get isDisabled() {
    return this.props.disabled || this.itemConfig.disabled
  }
  @computed.struct get showSize() {
    return this.props.size || this.itemConfig.size
  }
  @computed get label() {
    const { useLabel, label } = this.itemConfig
    if (useLabel == false || label == undefined)
      return undefined
    return label + (this.itemConfig.isViewOnly ? ":" : "")
  }
  @computed get coltal() {
    return 24 / (this.props.columnCount || 3)
  }
  @computed get colSpan() {
    return Math.round(((this.itemConfig.col || 1) + (this.itemConfig.offectRight || 0) / 8) * this.coltal)
  }
  @computed.struct get formItemStyle() {
    const { colSpan, itemConfig, showSize: viewSize, textAlign } = this;
    return {
      width: `${(colSpan-(itemConfig.offectRight))/colSpan*100}%`,
      height: `${itemConfig.height}`,
      marginBottom: viewSize == "mini" ? 0 : undefined,
      textAlign
    }
  }
  @computed get prefix() {
    return this.itemConfig.prefix
  }
  @computed get suffix() {
    return this.itemConfig.suffix
  }
  @computed get useColumn() {
    return this.props.useColumn
  }
}
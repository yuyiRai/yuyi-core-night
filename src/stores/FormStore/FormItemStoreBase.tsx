import { ItemConfig } from '../ItemConfig';
import { computed, observable } from 'mobx';
import { CommonStore } from '../CommonStore';
import { FormStoreCore } from './FormStoreCore';
import { autobind } from 'core-decorators';

export interface IFormItemStoreCore<FM = any, V = any> {
  code: string;
  formStore: VMFormStore<FM, V>;
  itemConfig: ItemConfig<V, FM>
}
export interface IFormItemStoreConstructor<FM = any, V = any> {
  new (formStore: VMFormStore<FM, V>, code: string): IFormItemStoreCore<FM, V>
}

export type VMFormStore<FM, V> = FormStoreCore<FM, IFormItemStoreCore<FM, V>>;

export class FormItemStoreCore<FM, V> extends CommonStore implements IFormItemStoreCore<FM, V> {
  @observable.ref
  public code: string;
  @observable.ref
  public formStore: VMFormStore<FM, V>;

  constructor(formStore: VMFormStore<FM, V>, code: string) {
    super();
    this.code = code;
    this.setFormStore(formStore)
  }

  @computed.struct
  public get itemConfig(): ItemConfig<V, FM> {
    return this.formStore.configStore.getItemConfig(this.code);
  }
  @computed
  public get hasError(): boolean {
    return this.formStore.hasErrors(this.code);
  }
  @autobind
  public setFormStore(formStore: VMFormStore<FM, V>) {
    this.formStore = formStore
  }
}
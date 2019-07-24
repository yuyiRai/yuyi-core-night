import { action, computed, observable, runInAction } from 'mobx';
import { Utils } from 'yuyi-core-utils';
import { CommonStore } from '../CommonStore';
import { ItemConfig } from '../ItemConfig';
import { FormStoreCore } from './FormStoreCore';

export interface IFormItemStoreCore<FM = any, V = any> {
  code: string;
  formStore: VMFormStore<FM, V>;
  itemConfig: ItemConfig<V, FM>
}
export interface IFormItemStoreConstructor<FM = any, V = any, VM extends IFormItemStoreCore<FM, V> = IFormItemStoreCore<FM, V>> {
  new (formStore: VMFormStore<FM, V>, code: string): VM
}
export type VMFormStore<FM, V> = FormStoreCore<FM, IFormItemStoreConstructor<FM, V>>;


export class FormItemStoreCore<FM, V> extends CommonStore implements IFormItemStoreCore<FM, V> {
  @observable.ref
  public code: string;
  @observable.ref
  public type: string;
  @observable.ref
  public formStore: VMFormStore<FM, V>;

  constructor(formStore: VMFormStore<FM, V>, code: string) {
    super();
    this.setFormStore(formStore)
    runInAction(() => {
      this.code = code;
      this.type = this.itemConfig.type;
    })
  }

  @computed
  public get itemConfig(): ItemConfig<V, FM> {
    return this.formStore && this.formStore.configStore && this.formStore.configStore.getItemConfig(this.code);
  }
  @computed
  public get hasError(): boolean {
    return Utils.isNotEmptyArray(this.currentError);
  }

  @computed
  public get currentError(): Error[] | undefined {
    return this.formStore && this.formStore.getErrors(this.code);
  }

  @action.bound
  public setFormStore(formStore: VMFormStore<FM, V>) {
    this.formStore = formStore;
  }
}
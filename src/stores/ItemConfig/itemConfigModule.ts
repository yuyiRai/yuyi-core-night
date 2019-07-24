import { CommonStore } from "../CommonStore";
import { IItemConfig } from "./interface";
import { observable, action } from "mobx";


export class ItemConfigModule<FM, V> extends CommonStore {
  @observable.ref
  public itemConfig: IItemConfig<FM, V>;
  public code: string = 'unknow'

  constructor(itemConfig: IItemConfig<FM, V>) {
    super()
    this.moduleInit(itemConfig)
  }

  @action.bound
  protected moduleInit(itemConfig: IItemConfig<FM, V>) {
    this.itemConfig = itemConfig
    this.code = itemConfig.code
    this.registerDisposer(() => {
      this.itemConfig = null
      // console.error(getDepend)
    })
  }
}
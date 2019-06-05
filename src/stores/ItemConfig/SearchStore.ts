import { autobind } from "core-decorators";
import produce from "immer";
import { get, toString } from 'lodash';
// import { Debounce } from 'lodash-decorators';
import { action, computed, IArraySplice, IObservableArray, IReactionDisposer, observable, reaction } from "mobx";
import { Option, OptionBase, Utils } from "@/utils";
import { IItemConfig, ItemConfigEventHandler } from "./interface";
import { CommonStore } from "../CommonStore";

export type KeyString = string;
export interface ISearchConfigBase<FM> {
  remoteMethod?: ItemConfigEventHandler<KeyString, FM, Promise<OptionBase[]>>;
  allowCreate?: boolean | ItemConfigEventHandler<KeyString, FM, Option>
  multiple?: boolean;
  loadDataDeep?: number;
}
export interface ISearchConfigCreater<V, FM> {
  strictSearch?: boolean;
  loadData?: undefined | ((key: Option, keyList: Option[], form?: FM, itemConfig?: IItemConfig<FM, V>) => Promise<Option[]> | Option[]);
  getPathValueWithLeafValue?(leafValue: string): Option[] | Promise<Option[]>;
}
export interface ISearchConfig<V, FM> extends ISearchConfigBase<FM> {
  strictSearch?: boolean;
  loadData?: undefined | ((key: Option, keyList: Option[], form?: FM, itemConfig?: IItemConfig<FM, V>) => Promise<Option[]> | Option[]);
  getPathValueWithLeafValue?(leafValue: string): Option[] | Promise<Option[]>;
}

export class SearchStore<V, FM> extends CommonStore {
  [k: string]: any;
  @observable mode: 'filter' | 'search' = 'search'
  @observable itemConfig: IItemConfig<FM, V>;
  @observable searchKeyHistory: IObservableArray<string> = observable.array([])
  @computed get keyWord(): string | undefined {
    const { searchKeyHistory: history } = this
    const lastIndex = history.length - 1
    const key = history.length === 0 ? undefined : Utils.toString(history[lastIndex])
    return key === '*' ? '' : key
  }

  @observable inited: boolean = false
  @observable initedListener: IReactionDisposer;

  constructor(itemConfig: IItemConfig<FM, V>) {
    super()
    this.itemConfig = itemConfig
    this.reaction(() => this.inited, isInited => {
      if (isInited === false) {
        if (this.initedListener) {
          this.initedListener()
        }
        this.initedListener = this.initAction()
      } else if (isInited && this.initedListener) {
        this.initedListener()
        this.initedListener = null;
      }
    }, { fireImmediately: true })
    console.log('useSearchStore', this.itemConfig.type === 'cascader', this, this.itemConfig.code)
  }

  @action initAction() {
    if (['selectTree', 'cascader'].includes(this.itemConfig.type)) {
      // this.itemConfig.formStore.onItemChange
      // this.initOption()
      return reaction(() => this.itemConfig.currentComponentValue, (value: string[]) => {
        this.initOption()
        if (!Utils.isEmptyData(value)) {
          // debugger
          // if (searchName!=='*')
          this.inited = true
          // this.resetKeyword()
          console.log('get value change', this.itemConfig.code, value, this.itemConfig);
        }
      }, { fireImmediately: true })
    } else if (this.itemConfig.type === 'search') {
      this.autorun(() => {
        if (this.searchKeyHistory.length > 10) {
          this.searchKeyHistory.shift()
        }
        this.toSearch(this.keyWord)
        // this.itemConfig.filterOptions = [this.keyWord]
      })
      this.intercept(this.searchKeyHistory, (change: IArraySplice<string>) => {
        if (change.added.length > 0 && change.added[0] !== change.object[change.object.length - 1]) {
          // console.log(change)
          change.added = Utils.zipEmptyData(change.added)
        } else {
          change.added = []
        }
        return change
      })
      // reaction
      this.resetKeyword()
      return reaction(() => this.searchName, (searchName: string) => {
        if (Utils.isNotEmptyString(searchName)) {
          // if (searchName!=='*')
          // debugger
          this.onSearch(searchName, 'data init')
          // this.resetKeyword()
          console.log('get searchName change', this.itemConfig.code, searchName, this.itemConfig);
          this.inited = true
        }
      }, { fireImmediately: true })
    }
    // console.log('SearchStore 尝试搜索')
  }

  @computed.struct get searchName() {
    return this.itemConfig.searchName
  }

  @computed get getPathValueWithLeafValue() {
    return this.itemConfig.getPathValueWithLeafValue || ((leafValue: string) => Utils.convertValueOption(Utils.castArray(leafValue, false)))
  }
  @action.bound async initOption() {
    this.initTopOptions()
    if (this.itemConfig.type === 'cascader') {
      return this.initOptionWithPathValue()
    } else {
      return this.initOptionWithLeafValue()
    }
  }
  // @Debounce(1000)
  @autobind async initOptionWithLeafValue(value: string = this.itemConfig.currentComponentValue) {
    this.itemConfig.setLoading(true, 'runInAction')
    return this.initOptionWithOptionList(Utils.castArray(await this.getPathValueWithLeafValue(value), false))
  }
  @autobind async initOptionWithPathValue(value: string[] = this.itemConfig.currentComponentValue) {
    return this.initOptionWithOptionList(Utils.convertValueOption(value))
  }

  @action.bound async initTopOptions() {
    if (this.loadData && this.itemConfig.options.length === 0) {
      const optionsList = await this.lazyLoadDataPromise([]);
      this.itemConfig.setOptions(optionsList)
      return optionsList
    }
    return this.itemConfig.options
  }
  // @Debounce(1000)
  @action.bound async initOptionWithOptionList(optionList: Option[] | Promise<Option[]>) {
    const selectedOptions = await optionList;
    // console.log('options searcher initOption')
    if (this.loadData) {
      this.itemConfig.setLoading(true, 'runInAction')
      if (Utils.isNotEmptyArray(selectedOptions)) {
        const list = []
        for (let index = 0; index < selectedOptions.length-1; index++) {
          // if (index < selectedOptions.length - 1) {
          // }
          list.push(selectedOptions[index])
          const nextOptions = await this.lazyLoadDataPromise(list, true)
          this.itemConfig.setOptions(nextOptions)
          // if (index === selectedOptions.length - 2) {
          // }
        }
      }
      this.itemConfig.setLoading(false, 'runInAction')
    }
    return;
  }

  loadDataBuffer = Utils.createSimpleTimeBufferInput(async (dataPathBuffer: Option[][]) => {
    // console.log(keyPathBuffer);
    console.log('loadData', dataPathBuffer)
    for (const keyPath of dataPathBuffer) {
      const optionsList = await this.lazyLoadDataPromise(keyPath);
      // debugger
      this.itemConfig.setOptions(Utils.cloneDeep(optionsList))
    }
    this.itemConfig.setLoading(false)
  }, this, 100, true)

  @computed get loadData() {
    return this.itemConfig.loadData ? this.loadDataHandler : undefined
  }

  @action.bound
  private async loadDataHandler(dataPath: Option[]) {
    if (!this.itemConfig.loading) {
      this.itemConfig.setLoading(true)
    }
    this.loadDataBuffer(dataPath)
    // lastItem.isLeaf = true
  }

  private async lazyLoadDataPromise(dataPath: Option[], strict?: boolean) {
    const lastItem = dataPath[dataPath.length - 1];
    let loadedData: Option[];
    const { path } = this.searchOptions(dataPath, this.itemConfig.options);
    // 是否需要查询children
    const needLoadData = this.itemConfig.loadData && (strict || !Utils.isNotEmptyArray(get(this.itemConfig.options, path + ".children")));
    // if (this.itemConfig.label==='机构'){
    //   debugger;
    //   // console.log('loadData', dataPath, path === '', this.itemConfig)
    // }
    // if (path !== '')
    // this.itemConfig.setOptions(produce(this.itemConfig.options || [], optionsList => set(optionsList, `${path}.disabled`, true)))
    if (needLoadData) {
      loadedData = await this.itemConfig.loadData(lastItem ? { ...lastItem } : null, dataPath, this.itemConfig.formSource, this.itemConfig);
    }
    if (path !== '') {
      const optionsList = produce(this.itemConfig.options, optionsList => {
        const result = get(optionsList, path)
        if (result) {
          if (Utils.isNotEmptyArray(loadedData)) {
            // if (this.itemConfig.label==='机构'){
            //   debugger
            // }
            result.children = Utils.cloneDeep(loadedData).map(i => Utils.isNil(i.isLeaf) ? Object.assign(i, {
              isLeaf: (Utils.isArrayFilter(dataPath) || []).length > this.itemConfig.loadDataDeep - 2
            }) : i);
          }
          if (Utils.isArray(result.children)) {
            result.isLeaf = false;
          } else {
            result.isLeaf = true;
          }
          result.disabled = false
        } else {
          // this.itemConfig.setOptions(produce(this.itemConfig.options, optionsList => set(optionsList, `${path}.disabled`, true)))
        }
      });
      // console.log('loadData leaf',  this.itemConfig.label, optionsList);
      return optionsList;
    } else {
      // if (this.itemConfig.label==='机构'){
      //   debugger
      // }
      this.itemConfig.setOptions(loadedData)
    }
    return loadedData
  }

  @autobind searchOptions(keyPath: Option[], optionsList = this.itemConfig.options): {
    path: string;
    result: Option;
  } {
    let path = ''
    const result = Utils.reduce(keyPath, (currentList: Option[], option: Option, index, list) => {
      if (Utils.isArray(currentList)) {
        const last = index === list.length - 1
        const i = currentList.findIndex((o: any) => o.value === option.value)
        const current = currentList[i]
        if (current) {
          path += `[${i}]${last ? '' : '.children'}`
          return last ? current : (current.children || [])
        }
      }
      return []
    }, optionsList) as Option;
    return { result, path: path.replace(/\.children$/, '') }
  }

  @computed get searchHintText() {
    return this.keyWord ? `关键字 ${this.keyWord} 的搜索结果` : ''
  }

  @observable searchResult = []

  @Utils.timebuffer(200)
  @action.bound onSearch(keyWord: string, trigger = 'onSearch'): void {
    console.log('want todo search', keyWord, trigger)
    this.searchKeyHistory.push(keyWord)
  }

  @action.bound toSearch(keyWord: string) {
    console.log('尝试搜索', this.itemConfig.code, keyWord)
    this.itemConfig.setLoading(true, 'toSearch')
    this.remoteSearch(keyWord).then(options => {
      this.itemConfig.setOptions(options)
      // this.itemConfig.formStore.setFormValueWithName(this.itemConfig.code)
      // console.log('搜索完毕', this.itemConfig.code, keyWord, options, this.itemConfig.optionsStore.selectedLablesStr)
    }).finally(() => {
      this.itemConfig.setLoading(false, 'toSearch')
    })
  }
  @action.bound resetKeyword() {
    this.onSearch('*', 'resetKeyword')
  }

  @computed get remoteMethod() {
    const { i, formSource } = this.itemConfig
    if (Utils.isFunction(i.remoteMethod)) {
      return async (keyWord: string) => {
        const r = await i.remoteMethod(keyWord, formSource, this.itemConfig)
        console.log('remoteSearch get', keyWord, r, this.keyWord)
        return r
      }
    } else {
      const { type, options } = this.itemConfig
      if (type === 'search') {
        return async (keyWord: string) => {
          return Utils.waitingPromise<Option[]>(0, options)
        }
      }
      return async (keyWord: string) => {
        return options
      }
    }
  }

  @autobind remoteSearch(keyWord: string) {
    if (this.itemConfig.multiple) {
      return this.multipleRemoteSearch(Utils.isString(keyWord) ? keyWord.split(',') : [])
    }
    console.log('remoteSearch get', this.itemConfig.code, keyWord, this.itemConfig)
    return this.remoteMethod(toString(keyWord) || this.itemConfig.currentValue)
  }

  @autobind async multipleRemoteSearch(keyWord: string[]) {
    const { remoteMethod } = this;
    let nextOptions: OptionBase[] = []
    if (Utils.isFunction(remoteMethod)) {
      const keyWordArr: string[] = Utils.zipEmptyData([...Utils.isStringFilter(this.searchName, '').split(','), ...keyWord]);
      if (keyWordArr.length === 0) {
        keyWordArr.push('')
      }
      for (const keyWord of keyWordArr) {
        nextOptions.push(...await remoteMethod(keyWord))
      }
      console.log('todo search', keyWordArr, this.itemConfig, nextOptions)
    }
    return nextOptions;
  }
}
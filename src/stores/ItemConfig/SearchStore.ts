import { Option, OptionBase, Utils } from "@/utils";
import produce from "immer";
import { get, toString } from 'lodash';
// import { Debounce } from 'lodash-decorators';
import { action, computed, IArraySplice, IObservableArray, IReactionDisposer, observable } from "mobx";
import { IItemConfig, ItemConfigEventHandler } from "./interface";
import { ItemConfigModule } from "./itemConfigModule";

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

export class SearchStore<V, FM> extends ItemConfigModule<FM, V> {
  [k: string]: any;
  @observable.ref mode: 'filter' | 'search'
  @observable searchKeyHistory: IObservableArray<string>

  @computed get keyWord(): string | undefined {
    const { searchKeyHistory: history } = this
    const lastIndex = history.length - 1
    const key = history.length === 0 ? undefined : Utils.toString(history[lastIndex])
    return key === '*' ? '' : key
  }

  @observable.ref inited: boolean
  @observable.ref initedListener: IReactionDisposer;
  @observable searchResult

  @action postConstructor() {
    this.mode = 'search'
    this.searchKeyHistory = observable.array([])
    this.inited = false
    this.searchResult = []
  }
  constructor(itemConfig: IItemConfig<FM, V>) {
    super(itemConfig)
    // console.error('useSearchStore', this.code);
    this.postConstructor()
    this.registerDisposer(() => {
      if (this.initedListener) {
        this.initedListener()
        this.initedListener = null;
      }
      // this.initAction = null
      // this.initOption = null
      // this.searchOptions = null
      // this.lazyLoadDataPromise = null
      // this.initTopOptions = null
      // this.initOptionWithOptionList
    })
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
    // console.log('useSearchStore', this.itemConfig.type === 'cascader', this, this.itemConfig.code)
  }

  @action.bound initAction() {
    if (['selectTree', 'cascader'].includes(this.itemConfig.type)) {
      // this.itemConfig.formStore.onItemChange
      // this.initOption()
      return this.reaction(() => this.itemConfig.currentComponentValue, (value: string[]) => {
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
        try {
          if (this.searchKeyHistory.length > 10) {
            this.searchKeyHistory.shift()
          }
          this.toSearch(this.keyWord)
        } catch (e) {
          // console.error(e);
        }
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
      return this.reaction(() => this.searchName, (searchName: string) => {
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
    try {
      await this.initTopOptions()
      if (this.itemConfig.type === 'cascader') {
        return await this.initOptionWithPathValue()
      } else {
        return await this.initOptionWithLeafValue()
      }
    } catch (e) {
      // console.error(e);
      return
    }
  }
  // @Debounce(1000)
  @action.bound async initOptionWithLeafValue(value: string = this.itemConfig.currentComponentValue) {
    this.loadingStart('runInAction')
    return this.initOptionWithOptionList(Utils.castArray(await this.getPathValueWithLeafValue(value), false))
  }
  @action.bound initOptionWithPathValue(value: string[] = this.itemConfig.currentComponentValue) {
    return this.initOptionWithOptionList(Utils.convertValueOption(value))
  }

  @action.bound async initTopOptions() {
    if (this.loadData && this.itemConfig.options.length === 0) {
      // console.error('initTopOptions start');
      const optionsList = await this.lazyLoadDataPromise([]);
      // console.error('initTopOptions end');
      this.setLoadedOptions(optionsList)
      return optionsList
    }
    return this.itemConfig.options
  }


  // @Debounce(1000)
  @action.bound async initOptionWithOptionList(optionList: Option[]) {
    // console.error('initOptionWithOptionList start');
    const selectedOptions = optionList;
    // console.log('options searcher initOption')
    if (this.loadData) {
      this.loadingStart('runInAction')
      if (Utils.isNotEmptyArray(selectedOptions)) {
        const list = []
        for (let index = 0; index < selectedOptions.length - 1; index++) {
          // if (index < selectedOptions.length - 1) {
          // }
          const index = 0;
          list.push(selectedOptions[index])
          const nextOptions = await this.lazyLoadDataPromise(list, true)
          this.setLoadedOptions(nextOptions)
          // if (index === selectedOptions.length - 2) {
          // }
        }
      }
      this.loadingEnd('runInAction')
    }
    // console.error('initOptionWithOptionList end');
    return;
  }

  @action.bound
  public setLoadedOptions(options: OptionBase[]) {
    if (this.itemConfig) {
      this.itemConfig.setOptions(options)
    }
  }

  @action.bound
  public loadingStart(sourceName?: string) {
    if (!this.destoryFlag && this.itemConfig) {
      this.itemConfig.setLoading(true, sourceName)
    }
  }

  @action.bound
  public loadingEnd(sourceName?: string) {
    if (!this.destoryFlag && this.itemConfig) {
      this.itemConfig.setLoading(false, sourceName)
    }
  }

  @computed get loadDataBuffer() {
    return Utils.createSimpleTimeBufferInput(async (dataPathBuffer: Option[][]) => {
      // console.log(keyPathBuffer);
      // console.log('loadData', dataPathBuffer)
      for (const keyPath of dataPathBuffer) {
        const optionsList = await this.lazyLoadDataPromise(keyPath);
        // debugger
        this.setLoadedOptions(Utils.cloneDeep(optionsList))
      }
      this.loadingEnd()
    }, this.uuid as any, 100, true)
  }

  @computed
  public get loadData(): typeof SearchStore['prototype']['loadDataHandler'] | undefined {
    return this.itemConfig.loadData ? this.loadDataHandler : undefined
  }

  @action.bound
  private async loadDataHandler(dataPath: Option[]) {
    if (!this.itemConfig.loading) {
      this.loadingStart()
    }
    this.loadDataBuffer(dataPath)
    // lastItem.isLeaf = true
  }

  @action.bound
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
    // this.setLoadedOptions(produce(this.itemConfig.options || [], optionsList => set(optionsList, `${path}.disabled`, true)))
    if (needLoadData) {
      loadedData = await this.itemConfig.loadData(lastItem ? { ...lastItem } : null, dataPath, this.itemConfig.formSource, this.itemConfig);
    }
    if (path !== '') {
      const loadDataDeep = this.itemConfig.loadDataDeep - 2
      const optionsList: OptionBase[] = produce(Utils.cloneDeep(this.itemConfig.options), optionsList => {
        const result = get(optionsList, path)
        if (result) {
          if (Utils.isNotEmptyArray(loadedData)) {
            // if (this.itemConfig.label==='机构'){
            //   debugger
            // }
            result.children = Utils.cloneDeep(loadedData).map(i => Utils.isNil(i.isLeaf) ? Object.assign(i, {
              isLeaf: (Utils.isArrayFilter(dataPath) || []).length > loadDataDeep
            }) : i);
          }
          if (Utils.isArray(result.children)) {
            result.isLeaf = false;
          } else {
            result.isLeaf = true;
          }
          result.disabled = false
        } else {
          // this.setLoadedOptions(produce(this.itemConfig.options, optionsList => set(optionsList, `${path}.disabled`, true)))
        }
      });
      // console.log('loadData leaf',  this.itemConfig.label, optionsList);
      return optionsList;
    } else {
      // if (this.itemConfig.label==='机构'){
      //   debugger
      // }
      this.setLoadedOptions(loadedData)
    }
    return loadedData
  }

  @action.bound searchOptions(keyPath: Option[], optionsList = [...this.itemConfig.options]): {
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


  // @Utils.timebuffer(200)
  @action onSearch(keyWord: string, trigger = 'onSearch'): void {
    console.log('want todo search', keyWord, trigger)
    this.searchKeyHistory.push(keyWord)
  }

  @action.bound async toSearch(keyWord: string) {
    const { itemConfig } = this
    console.log('尝试搜索', itemConfig.code, keyWord)
    this.loadingStart('toSearch')
    const options = await this.remoteSearch(keyWord)
    this.setLoadedOptions(options)
    this.loadingEnd('toSearch')
  }
  @action.bound resetKeyword() {
    this.onSearch('*', 'resetKeyword')
  }

  @computed get remoteMethod() {
    return this.itemConfig ? SearchStore.getRemoteMethod(this.itemConfig as any) : (async () => [])
  }

  public static getRemoteMethod = (itemConfig: IItemConfig) => {
    const { i } = itemConfig
    const { remoteMethod } = i
    if (Utils.isFunction(remoteMethod)) {
      return async (keyWord: string) => {
        const r = await remoteMethod(keyWord, itemConfig.formSource, itemConfig as any)
        return r
      }
    } else {
      const { type, options } = itemConfig
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

  @action.bound remoteSearch(keyWord: string) {
    if (this.itemConfig.multiple) {
      return this.multipleRemoteSearch(Utils.isString(keyWord) ? keyWord.split(',') : [])
    }
    console.log('remoteSearch get', this.itemConfig.code, keyWord, this.itemConfig)
    return this.remoteMethod(toString(keyWord) || this.itemConfig.currentValue)
  }

  @action.bound async multipleRemoteSearch(keyWord: string[]) {
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
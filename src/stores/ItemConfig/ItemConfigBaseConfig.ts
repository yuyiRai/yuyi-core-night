import { autobind } from 'core-decorators';
import { action, computed, IKeyValueMap, observable } from 'mobx';
import { OptionBase, Option } from '@/utils';
import { Utils } from '@/utils/Utils';
import { FormItemType, IItemConfig, RuleList } from './interface';
import { ItemConfigBaseConfigModel } from './ItemConfigBaseConfigModel';
import { RuleConfig } from './RuleConfigStore';

export class ItemConfigBaseConfig<V, FM> extends ItemConfigBaseConfigModel<V, FM> implements IItemConfig<FM, V> {
  @observable.ref
  public componentProps: IKeyValueMap = {};
  @observable
  public ruleConfig: RuleConfig<V, FM> = new RuleConfig<V, FM>(this);

  @computed.struct
  public get code(): string {
    return this.i.code;
  }
  @computed.struct
  public get label(): string {
    return this.i.label;
  }

  @computed.struct
  public get type(): FormItemType {
    return this.i.type;
  }

  @computed.struct
  public get placeholder(): string {
    return `请${['search', 'select', 'selectTree', 'cascader'].includes(this.type) && !this.allowInput ? '选择' : '输入'}${this.label}`
  }


  @computed get allowCreate(): boolean | ((data: any, form?: any) => Option) {
    return this.getComputedValue('allowCreate') || false
  }
  @computed get allowInput(): boolean {
    return this.getComputedValue('allowInput') || (this.type == 'search' && !this.multiple && this.allowCreate)
  }

  @computed.struct
  public get nameCode(): string {
    return this.i.nameCode;
  }

  @computed.struct
  public get viewOnly(): boolean {
    return this.getComputedValue('viewOnly') ? true : false;
  }

  @computed.struct
  public get required(): boolean {
    return this.getComputedValue('required') ? true : false;
  }

  @computed.struct
  public get hidden(): boolean {
    return this.getComputedValue('hidden') ? true : false;
  }

  @computed.struct
  public get disabled(): boolean {
    return this.getComputedValue('disabled') ? true : false;
  }

  @computed
  public get isViewOnly(): boolean {
    // console.log(this.props)
    return this.viewOnly! || (this.componentProps && (this.componentProps.viewOnly || this.componentProps.formStatus === 'view'));
  }
  @computed.struct get rules(): RuleList {
    return this.isViewOnly ? [] : this.ruleConfig.getRuleList(this.i)
  }
  @action.bound setRules(v: RuleList) {
    if (this.i.rule !== v)
      this.baseConfig.rule = v
  }

  @computed.struct
  public get options(): OptionBase[] {
    return this.getOptions();
  }
  @autobind
  public getOptions(): OptionBase[] {
    const a = Utils.isArrayFilter(this.i.options, this.getComputedValue('options')) || []
    // if(this.code==='info.trree3')
    //   debugger
    // this.label === '归属车辆' && console.log('伤者类型 get options', Utils.isArrayFilter(this.$version, this.getComputedValue('options'), []))
    return a
  }
  @action.bound
  public setOptions(v: any): void {
    if (!Utils.likeArray(this.options, v)) {
      // if(this.code==='search3')
      //   console.log('options resolve', this.i, v);
      this.baseConfig.options = v;
    }
  }

  @observable childrenConfig: IKeyValueMap<ItemConfigBaseConfig<V,FM>> = {}
  @computed get allConfig(): IKeyValueMap<ItemConfigBaseConfig<V,FM>> {
    return { default: this, ...this.childrenConfig }
  }
  @observable parentConfig: ItemConfigBaseConfig<V,FM>;
  @action.bound setParentConfig(parentConfig: ItemConfigBaseConfig<V,FM>) {
    this.parentConfig = parentConfig
  }

  @computed get _loading() {
    return !this.configInited || (this.getComputedValue('loading') ? true : false);
  }

  @computed
  public get loading() {
    return Utils.reduce(this.allConfig, (arr, config, key) => {
      return [...arr, config._loading]
    }, []).includes(true);
  }

  @action.bound
  public setLoading(v: boolean, source?: string) {
    // debugger
    // if(this.code==='info.trree3' && source==='toSearch') {
      // debugger
    // }
    // console.log('loading update', this.code, v, source, this);
    this.baseConfig.loading = v;
  }

  @computed 
  public get loadData() {
    return this.i.loadData
  }

  @computed 
  public get useSlot() {
    return (Utils.isNotEmptyString(this.i.useSlot) || this.i.useSlot) && Utils.isNotEmptyString(this.slot)
  }
  @computed 
  public get slot() {
    return Utils.isNotEmptyStringFilter(this.i.useSlot, this.i.slot)
  }
  
  @computed
  public get loadDataDeep() {
    return Math.max(Utils.isNumberFilter(this.i.loadDataDeep) || 3, 2)
  }
}
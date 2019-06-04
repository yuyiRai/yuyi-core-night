import { ItemConfig } from '@/stores';
import Utils from '@/utils';
import classnames from 'classnames'
import { Col } from 'antd';
import { GetFieldDecoratorOptions, WrappedFormUtils } from 'antd/lib/form/Form';
import AntFormItem, { FormItemProps } from 'antd/lib/form/FormItem';
import 'antd/lib/form/style/css';
import { autobind } from 'core-decorators';
import { set } from 'lodash';
import { action, autorun, computed, IReactionDisposer, reaction, runInAction } from 'mobx';
import { inject, observer, Provider } from 'mobx-react';
import { createTransformer, expr } from 'mobx-utils';
import * as React from 'react';
import { FormStore } from '../../stores/FormStore';
import { FormItemStoreCore, IFormItemStoreCore } from '../../stores/FormStore/FormItemStoreBase';
import { OFormItemCommon } from './Interface/FormItem';
import { ItemSwitch } from './Item';
import { FormItemLoading } from './Item/common/Loading';

export const ChildrenContext = React.createContext({
  children: null
})

export interface IFormItemProps extends FormItemProps, OFormItemCommon {
  store?: FormItemStore;
}

export interface IFormItemState {
  instance: FormItem;
  init: boolean;
}
export const OAntFormItem = observer((props: FormItemProps & OFormItemCommon) => {
  const { itemConfig, children, className, ...other } = props
  return (
    <AntFormItem 
      colon={itemConfig.isViewOnly} 
      label={itemConfig.displayProps.label} 
      className={classnames([className, { 'unuse-label': !itemConfig.displayProps.useLabel }])} 
      {...other}>{
      children
    }</AntFormItem>
  )
})

export class FormItemStore<FM = any, V = any> extends FormItemStoreCore<FM, V> implements IFormItemStoreCore<FM, V> {

  public formStore: FormStore<FM>;
  ruleWatcher: IReactionDisposer;
  validateReset: IReactionDisposer;
  constructor(formStore: FormStore<FM, any>, code: string) {
    super(formStore, code)
    this.setFormStore(formStore)
    this.setAntdForm(formStore.antdForm)

    this.ruleWatcher = reaction(() => this.itemConfig.rules, (rules) => {
      // console.log('ruleWatcher', rule)
      this.itemConfig.updateVersion()
      formStore.updateError(code)
      const value = Utils.cloneDeep(this.itemConfig.currentValue)
      // this.antdForm.resetFields([this.code])
      if (this.antdForm.getFieldError(this.code)) {
        this.antdForm.setFields(set({}, this.code, { value }))
        // this.antdForm.validateFields([this.code])
      }
    })
  }

  @computed.struct get antdForm(): WrappedFormUtils {
    return this.formStore.antdFormMap.get(this.code)
  }
  @action.bound setAntdForm(antdForm: WrappedFormUtils) {
    this.formStore.setAntdForm(antdForm, this.code)
  }

  @action.bound init() {
    const { formStore } = this;
    // reaction(() => this.fieldDecorator, () => {
    //   console.log('fieldDecorator change', code)
    // })
    this.validateReset = autorun(() => {
      if (!this.hasError || !this.itemConfig.rules) {
        formStore.reactionAntdForm(antdForm => {
          // console.log('updateVersion', code, this.antdForm.getFieldError(code))
          this.itemConfig.updateVersion()
          this.setAntdForm(antdForm)
        })
      }
      // this.antdForm.validateFields([code])
    })
  }

  @autobind dispose() {
    this.ruleWatcher()
    this.validateReset && this.validateReset()
  }

  @computed get fieldDecorator() {
    // console.log('get fieldDecorator')
    const { code, antdForm } = this;
    // trace()
    return this.itemConfig.$version > -1 && antdForm.getFieldDecorator(code, this.decoratorOptions);
  }

  @computed get decoratorOptions() {
    return this.getFieldDecoratorOptions(this.itemConfig)
  }
  getFieldDecoratorOptions = createTransformer<ItemConfig<V, FM>, GetFieldDecoratorOptions>((itemConfig: ItemConfig<V, FM>) => {
    // console.log('update fieldDecorator options', itemConfig.rule)
    console.log('get fieldDecorator', this.hasError)
    return {
      validateTrigger: ['onBlur', 'onChange'].concat(this.hasError ? ['onInput'] : []),
      rules: itemConfig.rules, initialValue: itemConfig.value, getValueProps(value: any) {
        // console.log('value filter', itemConfig.code, value, itemConfig);
        return {
          value: Utils.isNotEmptyValueFilter(
            itemConfig.computed !== false ? itemConfig.computed : undefined,
            itemConfig.currentComponentValue,
            itemConfig.currentValue,
            value
          )
        }
      }
    }
  }, { debugNameGenerator: () => 'getFieldDecoratorOptions' })


  @computed get Component() {
    const { code, antdForm, itemConfig } = this
    const { type, displayProps } = itemConfig
    // console.log('getComponent');
    return <ItemSwitch type={type} code={code} antdForm={antdForm} disabled={displayProps.isDisabled} placeholder={itemConfig.placeholder} />;
  }

  @computed get renderer() {
    const { itemConfig } = this;
    // const { label } = itemConfig
    // console.log('get renderer', itemConfig.$version)
    return (children: JSX.Element) => {
      return (
        <Provider itemConfig={itemConfig}>
          <FormItemContainer itemConfig={itemConfig}>{
            children
          }</FormItemContainer>
        </Provider>
      );
    }
  }
}

@inject((stores: { formStore: FormStore }, props: IFormItemProps, context) => {
  // console.log('fromitem get store', stores, props, context)
  const { formStore } = stores;
  const store = formStore.registerItemStore(props.code, () => new FormItemStore(formStore, props.code))
  return { store }
})
@observer
export default class FormItem extends React.Component<IFormItemProps, IFormItemState> {
  constructor(props: IFormItemProps) {
    super(props);
    // console.log('FormItem init', props);
    this.state = {
      instance: this,
      init: false
    }
  }
  componentDidMount() {
    this.props.store.init()
  }
  componentWillUnmount() {
    runInAction(() => this.props.store.dispose())
  }
  public render() {
    const { code, store, ...other } = this.props;
    const { itemConfig, hasError } = store;
    // console.log('remder', store.itemConfig.code, store.itemConfig.rule);
    // console.log(this.store.itemConfig.label)
    return store.renderer(
      <FormItemLoading code={code}>
        <OAntFormItem
          code={code}
          help={itemConfig.displayProps.isShowMessage ? undefined : <span style={{ display: 'none' }} />}
          itemConfig={itemConfig}
          {...other}
          style={itemConfig.displayProps.formItemStyle as any}
          validateStatus={hasError ? 'error' : 'success'}
          hasFeedback={itemConfig.useFeedback && !['check', 'checkOne', 'radio', 'radioOne', 'group', 'textArea', 'textarea'].includes(itemConfig.type)}
        >{
            store.fieldDecorator(React.cloneElement(store.Component))
          }</OAntFormItem>
      </FormItemLoading>
    )
  }
}

@observer
export class FormItemContainer<V, FM> extends React.Component<{
  itemConfig: ItemConfig<V, FM>
}, IFormItemState> {
  lastContainerProps = {}
  static contextType = ChildrenContext;
  styleTransform = createTransformer((itemConfig: ItemConfig<V, FM>) => {
    // console.log('FormItemContainer style change')
    return { display: itemConfig.hidden ? 'none' : undefined }
  })
  propsTransform = createTransformer((itemConfig: ItemConfig<V, FM>) => {
    // console.log('FormItemContainer props change')
    const { type, displayProps: { colSpan, useColumn }, lg, sm, xs, offset } = itemConfig
    return { type, displayProps: { colSpan, useColumn }, lg, sm, xs, offset }
  })
  @computed get style() {
    const { itemConfig } = this.props;
    return {
      display: expr(() => itemConfig.hidden ? 'none' : undefined),
      maxHeight: itemConfig.type !== 'textarea' && itemConfig.displayProps.colSpan <= 12 && '34px'
    }
  }
  @computed get containerProps() {
    const { itemConfig } = this.props;
    return this.propsTransform(itemConfig)
  }
  @computed get renderer() {
    // console.log('FormItemContainer container change')
    const { type, displayProps: { colSpan, useColumn }, lg, sm, xs, offset } = this.containerProps
    if (useColumn === false) {
      return this.props.children;
    }
    if (type === 'address') {
      return (
        <Col className='use-item-col' lg={lg || 16} sm={24} offset={offset} style={this.style}>
          {this.props.children}
        </Col>
      )
    }
    return (
      <Col className='use-item-col' lg={colSpan} sm={sm || 12} xs={xs || 24} offset={offset} style={this.style}>
        {this.props.children}
      </Col>
    )
  }
  render() {
    return this.renderer
  }
}

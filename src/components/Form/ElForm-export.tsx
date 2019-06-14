import { autobind } from 'core-decorators';
import * as React from 'react';
import { createGlobalStyle } from 'styled-components';
import Vue from 'vue';
import { Utils } from 'yuyi-core-utils';
import { FormStore } from '../../stores/FormStore';
import { react2Vue, slotInjectContainer } from '../../utils/SlotUtils';
import { CommonForm } from './CommonForm';
import { FormGroup } from './Form';


// import Loadable from 'react-loadable';

// function MyLoadingComponent() {
//   return <div>Loading...</div>;
// }
// const CommonForm = Loadable({
//   loader: () => import('./CommonForm'),
//   loading: MyLoadingComponent
// })

const GlobalStyle = createGlobalStyle`
  .ant-select-dropdown {
    z-index: 2050 !important;
  }
`
@slotInjectContainer
export class RItemGroup extends React.Component<any, any> {
  public render() {
    // console.log('ElItemGroup', this)
    return <FormGroup {...this.props} config={this.props.config} />;
  }
}
export const ElItemGroup = react2Vue(RItemGroup);

@slotInjectContainer
export class RCommonForm extends React.Component<any, any> {
  public render() {
    // console.log('ElCommonForm', this)
    return <CommonForm {...this.props} model={this.props.model} />;
  }
}
export const ElCommonForm = react2Vue(RCommonForm);

(window as any).logger = []
const logger = (window as any).logger
@slotInjectContainer
export class RCommonForm2 extends React.PureComponent<any, any> {
  state = {
    model: {},
    lastModel: {},
    lastConfig: {},
    config: null
  }
  // constructor(props: any) {
  //   super(props)
  //   logger.push('getDerivedStateFromProps chgange0');
  //   this.state = RCommonForm2.getDerivedStateFromProps(props, this.state)
  // }
  static getDerivedStateFromProps(nextProps: any, prevState: any) {
    let update = false
    // debugger
    if (prevState.lastModel !== nextProps.model) {
      logger.push('getDerivedStateFromProps chgange1');
      prevState.model = Utils.cloneDeep(nextProps.model)
      prevState.lastModel = nextProps.model
      update = true
    }
    if (prevState.lastConfig !== nextProps.config) {
      logger.push('getDerivedStateFromProps chgange2');
      // if(!prevState.config)
      prevState.config = Utils.cloneDeep(nextProps.config)
      prevState.lastConfig = nextProps.config
      update = true
    }
    return update ? prevState : null
  }
  @autobind onChange(code: string, value: any) {
    Vue.prototype.$set(this.props.model, code, value)
    console.log('onChange', code, value, this);
  }
  public store: FormStore;
  @autobind getStoreRef(store: FormStore) {
    if (this.props.storeRef) {
      this.props.storeRef(store)
    }
    this.store = store
  }
  public render() {
    const { model, config } = this.state
    const { children, config: a, slots, scopedSlots, ...other } = this.props
    // console.log('ElCommonForm2', this.context, Inter)
    return (
      <span>
        {/* <Slot name='w' /> */}
        <GlobalStyle />
        {Utils.isNotEmptyArray(config) &&
          <CommonForm {...other} model={model} onItemChange={this.onChange} storeRef={this.getStoreRef}>
            <FormGroup config={config} >{children}</FormGroup>
          </CommonForm>
        }
      </span>
    );
  }
}
export const ElCommonForm2 = react2Vue(RCommonForm2);
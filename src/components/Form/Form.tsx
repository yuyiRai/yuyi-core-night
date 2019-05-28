import { GetFieldDecoratorOptions, WrappedFormUtils } from 'antd/lib/form/Form';
import Row from 'antd/lib/row';
import 'antd/lib/row/style/css';
import { observer, Provider } from 'mobx-react';
import * as React from 'react';
import { CommonForm, CommonFormContext, NativeStore } from './CommonForm';
import { FormContainer } from './FormContainer';
import FormItem from './FormItem';
import { FormStore } from './FormStore';
import { IItemConfig, IFormItemConstructor } from './Interface';
import { form } from './util';
// import { Utils } from '../../build';

const defaultFormItemLayout = { labelCol: { span: 1, offset: 0 }, wrapperCol: { span: 1, offset: 0 } }
export interface IFormProps<FM = object> {
  model?: FM;
  formInstance?: CommonForm;
  formStore?: FormStore;
  config: IFormItemConstructor<any, FM>[];
  form?: WrappedFormUtils<any>;
  labelWidth?: number;
  formItemLayout?: typeof defaultFormItemLayout;
  [key: string]: any;
}
export interface IFormState {
  fieldDecorator: GetFieldDecoratorOptions[]
}

declare const config: IItemConfig<any, any>;
declare const i: number
export const FormItemGroup = observer((props: IFormProps) => {
  const { formStore, formItemLayout = defaultFormItemLayout } = props
  return (
    <For index='i' each="config" of={formStore.configStore.configList}>
      <FormItem {...formItemLayout} key={i} code={config.code}></FormItem>
    </For>
  )
})

@observer
export default class Form extends React.Component<IFormProps, any> {
  state: any = {
    lastConfig: [],
    lastStore: null,
    form: null
  }
  static getDerivedStateFromProps(nextProps: IFormProps, prevState: any) {
    const { form, formStore } = nextProps
    if (formStore instanceof FormStore) {
      formStore.setConfig(nextProps.config)
      if (formStore !== prevState.lastStore) {
        // console.log(Utils, nameof<Form>())
        console.log(formStore.configStore.configList, prevState.lastConfig, formStore.configStore.configList === prevState.lastConfig)
        prevState.form = form
        prevState.lastStore = formStore
        prevState.lastConfig = nextProps.config
        formStore.setAntdForm(form)
      }
      formStore.receiveAntdForm(form)
      // console.log('getDerivedStateFromProps', nextProps)
    }
    return prevState
  }
  public render() {
    const { form } = this.state
    const { children, className } = this.props
    // console.log(form, children)
    return (
      <FormContainer {...this.props}>
        <Provider antdForm={form} formStore={this.props.formStore}>
          <>
            <Row className={className}>
              <FormItemGroup {...this.props}/>
            </Row>
            <div>{children}</div>
          </>
        </Provider>
      </FormContainer>
    );
  }
  public static defaultProps = {
    labelWidth: 150
  }
}


export const InjectedForm = form(Form)

export const FormGroup: React.FunctionComponent<IFormProps> = (props: IFormProps) => {
  const { formInstance, formProps } = React.useContext(CommonFormContext)
  const { formStore } = React.useContext(NativeStore)
  // console.log('fromgroup get store', props, formStore, formInstance, formProps)
  return formStore && <InjectedForm {...props} formStore={formStore} mode={formProps.model} formInstance={formInstance}/>
}
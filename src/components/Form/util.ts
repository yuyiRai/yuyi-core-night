import { action, observable, Utils } from '@/utils';
import Form, { FormComponentProps } from 'antd/lib/form';
import { } from 'antd/lib/form/interface';
import { memo, PropsWithChildren } from 'react';
import { IFormProps } from './Form';

export function filterToValue(v: any, defaultValue?: any) {
  const v2 = Utils.isNotEmptyValueFilter(Utils.isArray(v) ? Utils.zipEmptyData(v) : v, defaultValue)
  return v2 === null ? undefined : v2
}

export function deepMemoExpect<P extends PropsWithChildren<any>>({ children: ca, ...a }: P, { children: cb, ...b }: P) {
  return Utils.isEqual(a, b, true)
}

/**
 * React.memo 深度比较
 * @param Component 
 * @param allowChildren 是否忽略children比较（默认是）
 */
export function deepMemo(Component: any, allowChildren: boolean = false) {
  return memo(Component, allowChildren ? Utils.isEqual : deepMemoExpect)
}

const AntFormStore = observable({
  onFieldsChange(props: IFormProps & FormComponentProps<any>, changedFields: any, allValues) {
    //将表单变化的值绑定到store中
    // console.log('onFieldsChange', props, changedFields, allValues);
    // const r = 
    props.onFieldsChange(changedFields);
    // console.log('onFieldsChange patchFieldsChange result', r, changedFields);
  },
  onValuesChange(props: IFormProps & FormComponentProps<any>, values, allValues) {
    // console.log('onValuesChange', props, values, allValues);
  },
  mapPropsToFields(props: IFormProps & FormComponentProps<any>) {
    // console.error(props);
    return props.mapPropsToFields()
    // const { model, formStore: store } = props;
    // let target = {}
    // // let form = {}
    // for (const config of store.configStore.configList) {
    //   const v = Utils.toJS(get(model, config.code))
    //   const value = store.getF2VValue(config.code, filterToValue(v, config.value))
    //   // console.log('formValueTransform', config.code, value, v, store)
    //   const field = { name: config.code, value }
    //   set(target, config.code, Form.createFormField(field))
    //   // set(form, config.code, value)
    //   // console.log('initvalue', config.code, v, value, config.value);
    //   if (!Utils.isEqual(v, value, true)) {
    //     // store.setFormValue(config.code, value)
    //     store.patchFieldsChange(set({}, config.code, field))
    //   }
    // }
    // // store.setForm(form)
    // // store.patchFieldsChange(target)
    // // store.setForm(model)
    // // console.log('form init', model, target, store.configStore.configList, other);
    // return target
  }
}, {
    mapPropsToFields: action
  }, {
    name: 'AntFormMobxInject'
  })
export const form = Form.create(AntFormStore)
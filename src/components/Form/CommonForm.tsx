import LocaleProvider from 'antd/lib/locale-provider';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import { IKeyValueMap } from 'mobx';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { FormStore, onItemChangeCallback } from '../../stores/FormStore';
import { useFormStoreContextProvider } from './hooks';



export interface ICommonFormProps<FM = object> extends IKeyValueMap {
  /**
   * 表单2
   */
  model: FM;
  storeRef?: (instance: { formStore: FormStore<FM> }) => void;
  onItemChange?: onItemChangeCallback;
}
export interface ICommonFormState extends IKeyValueMap {
  formProps: ICommonFormProps;
  formStore: FormStore;
}

export const CommonFormContext = React.createContext<ICommonFormState>({ formProps: null, formStore: null })

// const getCommonFormStore = ({ props, ref }: { props: ICommonFormProps, ref: React.MutableRefObject<any> }) => {
//   // console.error('storeRef get init');
//   let lastModel = props.model
//   const form = useActionObject({
//     formProps: props,
//     formStore: FormStore.registerForm(props.model, ref),
//     nextModel(model: ICommonFormProps['model']) {
//       if (lastModel !== (Utils.isNotEmptyValueFilter(model) || {})) {
//         this.disposedLastForm()
//         const formStore = FormStore.registerForm(model, ref, this.formStore)
//         // console.log('storeRef get update', this.formStore, formStore);
//         this.setFormStore(formStore)
//         lastModel = model
//       }
//     },
//     disposedLastForm() {
//       FormStore.disposedForm(this.formStore.lastFormSource);
//       (this.formStore as FormStore<any, any>).setAntdForm(null)
//       // this.formStore.formItemMap.delete(this.formStore.formSource)
//     },
//     setFormStore(formStore: FormStore) {
//       this.formStore = formStore
//     },
//     destory() {
//       this.disposedLastForm()
//       this.formStore.antdFormMap.clear()
//       this.formStore.setForm({})
//       this.formStore.configStore.setConfigSource([])
//       this.formStore.destory()
//       this.formStore = null
//       lastModel = null
//     }
//   })
//   return form;
// }

// export class FormSStore {
//   app: string;
//   constructor() {
//     this.app = '12345'
//   }
// }
export const CommonForm: React.SFC<ICommonFormProps> = (props) => {
  const Provider = useFormStoreContextProvider(props)
  // const ref = React.useRef<any>();
  // const form = useLocalStore(getCommonFormStore, { props: useAsObservableSource(props), ref })
  // const storeRef = React.useRef(form)
  // usePropsReciveSync(form.nextModel, props.model)
  // usePropsRecive((ref, lastRef) => {
  //   if (ref) {
  //     ref(storeRef.current)
  //   }
  //   return () => {
  //     ref = null
  //   }
  // }, [props.storeRef, storeRef.current])
  // usePropsRecive((onItemChange) => {
  //   if (Utils.isFunction(onItemChange)) {
  //     form.formStore.onItemChange(onItemChange)
  //   }
  // }, [props.onItemChange])
  // // console.error('renderer', form, props);
  // useUnmount(() => {
  //   console.error('commonform destory');
  //   storeRef.current.destory()
  //   props.storeRef({formStore: null})
  //   storeRef.current = null
  // }, [props.storeRef, storeRef])
  return (
    <LocaleProvider locale={zh_CN}>
      <Provider>
        <>
          {/* <Inter /> */}
          {props.children}
        </>
        <DevTools />
      </Provider>
    </LocaleProvider>
  );
}

export default CommonForm;
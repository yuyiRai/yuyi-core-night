import { CommonStore } from '../CommonStore';
import { FormStore } from './FormStore';
export class GFormStore extends CommonStore {
  static formMap: WeakMap<any, FormStore<any, any>> = new WeakMap<any, FormStore<any, any>>();
  static disposedForm(form: any) {
    this.formMap.delete(form);
  }

  static registerForm<T = any>(form: any, instance: T, replace?: FormStore<any, any>) {
    let formStore: FormStore<any, any> | undefined = this.formMap.get(form);
    if (!formStore) {
      formStore = replace || new FormStore();
      formStore.setForm(form);
      // console.log('register form', form)
      this.formMap.set(form, formStore);
    }
    return formStore;
  }
}

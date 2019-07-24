import { action, computed, observable } from 'mobx';
import { Utils, uuid } from 'yuyi-core-utils';
import { CommonStore } from '../CommonStore';
import { FormStore } from './FormStore';

export class GlobalFormStore extends CommonStore {
  constructor(){
    super()
  }
  @observable public formMap: WeakMap<any, FormStore<any, any>> = new WeakMap<any, FormStore<any, any>>();
  @action.bound public disposedForm(form: any) {
    this.formMap.delete(form);
  }

  @action.bound public registerForm<T = any>(form: any, instance: T, replace?: FormStore<any, any>) {
    let formStore: FormStore<any, any> | undefined = this.formMap.get(form);
    if (!formStore) {
      formStore = replace || new FormStore();
      formStore.setForm(form);
      if (replace) {
        formStore.setUUID(uuid())
        console.error('register form', form)
      }
      // console.log('InjectedForm antd', formStore.uuid);
      
      this.formMap.set(form, formStore);
    }
    return formStore;
  }
}

export class GFormStore extends CommonStore {
  static globalFormStore = new GlobalFormStore()
  static get formMap(): WeakMap<any, FormStore<any, any>> {
    return GFormStore.globalFormStore.formMap
  }
  static disposedForm(form: any) {
    // console.error('disposedForm', form, this.formMap)
    return GFormStore.globalFormStore.disposedForm(form);
  }

  static registerForm<T = any>(form: any, instance: T, replace?: FormStore<any, any>) {
    // console.error('registerForm', form, this.formMap);
    
    return GFormStore.globalFormStore.registerForm(form, instance, replace);
  }
  
}


export class Test {
  uuid = Utils.uuid()
  list = [1,2,3,4,5]
  ttt: any;
  constructor() {
    console.log('Test create', this.uuid);
    // this.ttt = reaction(() => this.GlobalFormStore, (a) => console.log(a), { })
  }
  @action a() {
    return this.b()
  }
  @action b() {
    return this.list.map(a => this.c())
  }
  @action c() {
    return this.GlobalFormStore
  }
  @computed get GlobalFormStore (){
    return new GlobalFormStore()
  }
  dispose() {
    this.ttt()
  }
}

(Utils as any).TestStore = Test;
(Utils as any).todoTest = function() {
  const AAA = { test: new Test(), test2: [] }
  AAA.test2 = AAA.test.a()

  // AAA.test.dispose()
  AAA.test = null
  AAA.test2 = null
}

console.log('start');
setTimeout(() => {
  (Utils as any).todoTest()
  console.log('end');
}, 1000);
import * as components from './components'
import Utils from './utils'
// import { Message } from 'element-react'
import { forEach } from 'lodash'
import { VueConstructor } from 'vue';
// export * from './TablePage'

export default function install(Vue: VueConstructor) {
  // locale.use(opts.locale);
  // locale.i18n(opts.i18n);

  forEach(components, (component, key) => {
    Vue.component(key, component)
  })

  // Vue.use(Loading.directive);

  // Vue.prototype.$ELEMENT = {
  //   size: opts.size || '',
  //   zIndex: opts.zIndex || 2000
  // };

  Vue.prototype.$utils = Utils
  /**
   * @param { boolean | object } paramSource true为历史记录后退，false为不确认后退，对象为详细配置
   */
  Vue.prototype.$goBack = function(paramSource: boolean | object = true) {
    let { confirm, useBack = false, ...params} = Utils.isObjectFilter(paramSource) || { confirm: paramSource }
    if(confirm === false) {
      return this.$utils.pathReturn(this, params, false, useBack)
    }
    this.$confirm(confirm===true ? '是否要离开当前页？' : confirm ).then(() => {
      this.$utils.pathReturn(this, params, true, useBack)
    })
  }
  // Vue.prototype.$loading = Loading.service;
  // Vue.prototype.$msgbox = MessageBox;
  // Vue.prototype.$alert = MessageBox.alert;
  // Vue.prototype.$confirm = MessageBox.confirm;
  // Vue.prototype.$prompt = MessageBox.prompt;
  // Vue.prototype.$notify = Notification;
  // Vue.prototype.$message = Message;

};
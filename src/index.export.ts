import Vue from 'vue'
import install from './install'
// import { demo }  from './demo'
// import 'tsx-control-statements/index.d'
import './global'
export * from './global'
export * from './stores'
export * from 'yuyi-core-utils'
export { Utils } from '@/utils'
export * from './components'
// import 'element-theme-default/lib/message.css'

const { VuePlugin } = require('vuera')
Vue.use(VuePlugin)
export default install;

// demo()
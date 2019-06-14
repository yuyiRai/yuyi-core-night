import { Utils } from '@/utils';
import Vue from 'vue';
// import { demo }  from './demo'
// import 'tsx-control-statements/index.d'
import './global';
import install from './install';
export * from 'yuyi-core-utils';
export * from './components';
export * from './global';
export * from './stores';
export { Utils };
// import 'element-theme-default/lib/message.css'

const { VuePlugin } = require('vuera')
Vue.use(VuePlugin)
export default install;

// demo()
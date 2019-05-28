import { ElCommonForm2 } from "./ElForm-export";
import '../../global'
import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';
import Vue from 'vue'

const App = Vue.component('App', {
  render(h) {
    return h('div', {}, 
    [
      '123',
      h(ElCommonForm2, {}, [h('span', {
        slot: 'inter'
      })])
    ])
  }
})

// 示例组件
storiesOf('Welcome', module).add(
  'show App', () => ({
  components: { App },
  render(h) {
    return h(App, {
      props: {
        storeRef: this.action
      }
    })
  },
  methods: { action: (store: any) => {
    console.log(store)
    action('get Store')
    linkTo('Button')
  } }
}));

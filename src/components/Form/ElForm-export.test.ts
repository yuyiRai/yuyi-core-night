import { ElCommonForm2 } from "./ElForm-export";
import 'src/global'
import render from '@vue/test-utils'
import Vue from 'vue'

const App = Vue.component('App', {
  components: { ElCommonForm2 },
  render(h) {
    return h(ElCommonForm2, {}, [h('span', {
      slot: 'inter'
    })])
  }
})

describe('Component', () => {
  test('is a Vue instance', () => {
    // new Vue({
    //   render: h => h(App)
    // }).$mount(document.createElement('div'))
    
    const wrapper = render.mount(App)
    expect(wrapper.isVueInstance()).toBeTruthy()
  })
})
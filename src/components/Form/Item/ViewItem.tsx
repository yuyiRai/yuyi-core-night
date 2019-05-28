/* eslint-disable */
// import Vue from 'vue';
// import SelectColumn from '@/components/TablePage/table-column/select.vue'
// import { dateFormat } from '@/filters/index.js'
// import { observer } from 'mobx-vue'
// export default observer(Vue.component('ViewItem', {
//   name: 'ViewItem',
//   data(){
//     return {
//       viewValue: undefined
//     }
//   },
//   computed: {
//     view(){
//       const { code, nameCode, form } = this.itemConfig;
//       return Utils.isNotEmptyValueFilter(
//         this.viewValue, 
//         form[nameCode], 
//         form[code.replace('Code', '')], 
//         form[code.replace('Code', 'Name')], 
//         form[code+'Name'], 
//         Utils.castArray(this.value).join(',')
//       )
//     }
//   },
//   created() {
//     const { type, remoteMethod, code, nameCode, form } = this.itemConfig;
//     switch(type) {
//       case 'search': 
//         const search = _.get(form, nameCode, _.get(form, code, null))
//         console.log(search, this.itemConfig, form)
//         search && remoteMethod(search).then(r=>{
//           console.log(code, search, r)
          
//         })
//       break;
//     }
//   },
//   render(h) {
//     const { view: value, itemConfig } = this;
//     const { useSlot, type } = itemConfig
//     if(type==='radioOne'){
//       return <span>{value?"是":"否"}</span>
//     } else if(type==='date' || type==='dateTime'){
//       return (
//         <span>{ 
//           Utils.isNotEmptyValue(value) 
//           ? dateFormat(new Date(value), 'yyyy-MM-dd' + (type==='dateTime'?' hh:mm:ss':''))
//           : `` // `----/--/--${type === 'dateTime' ? " --:--:--" : ""}`
//         }</span>
//       )
//     } else if((type==='select' || type==='radio')) {
//       // console.log(itemConfig.label, value, itemConfig.options, this.value)
//       return <SelectColumn value={value} split={itemConfig.split} options={itemConfig.options} />
//     } else if(type==='address') {
//       const { areaName, cityName, provinceName, [itemConfig.code+'Key']: addressName} = itemConfig.form
//       // console.log(itemConfig, itemConfig.label, itemConfig.form[itemConfig.code+'Name'])
//       return <span><span> { Utils.zipEmptyData(Utils.isStringFilter(itemConfig.form[itemConfig.code+'Name'], '').split('|')).join('-') } </span><span>{itemConfig.suffix}</span></span>
//     } else if(useSlot !== null && Utils.isFunction(this.$scopedSlots[useSlot])) {
//       // console.log('view item', itemConfig, itemConfig.code,this.$scopedSlots , useSlot)
//       return this.$scopedSlots[useSlot]({data: value, props: itemConfig.form})
//     } else {
//       return <span><span> { value } </span><span>{itemConfig.suffix}</span></span>
//     }
//   },
//   props: {
//     value: {},
//     itemConfig: {},
//   }
// }))

import * as React from 'react';
import { OFormItemCommon } from '../Interface';

interface IViewItemProps extends OFormItemCommon {
  value?: any;
}

const ViewItem: React.FunctionComponent<IViewItemProps> = (props: IViewItemProps) => {
  const { value, itemConfig } = props;
  const { useSlot, slot, type } = itemConfig
  if(type === 'radioOne'){
    return <span>{value?"是":"否"}</span>
  } else if(type==='date' || type==='dateTime'){
    return (
      <span>{ 
        Utils.isNotEmptyValue(value) 
        ? value
        : `` // `----/--/--${type === 'dateTime' ? " --:--:--" : ""}`
      }</span>
    )
  } else if((type==='select' || type==='radio')) {
    // console.log(itemConfig.label, value, itemConfig.options, this.value)
    return Utils.valuesToLabels(itemConfig.options as any, value)
  } else if(type==='address') {
    // console.log(itemConfig, itemConfig.label, itemConfig.form[itemConfig.code+'Name'])
    return <span><span> { Utils.zipEmptyData(Utils.isStringFilter(itemConfig.form[itemConfig.code+'Name'], '').split('|')).join('-') } </span><span>{itemConfig.suffix}</span></span>
  } else if(useSlot !== null && Utils.isFunction(this.$scopedSlots[slot])) {
    // console.log('view item', itemConfig, itemConfig.code,this.$scopedSlots , useSlot)
    return useSlot && this.$scopedSlots[slot]({data: value, props: itemConfig.form})
  } else {
    return <span><span> { value } </span><span>{itemConfig.suffix}</span></span>
  }
};

export default ViewItem;
// import { AMapService } from '@/stores';
// // import { action } from '@storybook/addon-actions';
// import { object, text, withKnobs } from '@storybook/addon-knobs';
// import { storiesOf } from '@storybook/react';
// import { Button } from 'antd';
// import React from 'react';
// import { Utils } from '@/utils';
// import { CommonForm } from '../components/Form/CommonForm';
// import { FormGroup } from '../components/Form/Form';
// import { FormStore } from '../components/Form/FormStore';
// import { IFormItemConstructor } from '../components/Form/Interface';

// AMapService.setKey("70a802cd733e9a9a96bedd0ae23f19a2")

// const voiceroid = ['1', '2', '3', '4', '5']
// // const voiceroid = ['yukari','maki','zunko','akane','aoi']
// const options = [
//   { label: 'A', value: 'a', code: 'AAA' },
//   { label: 'B', value: 'b', code: 'AAA' },
//   { label: 'C', value: 'c', code: 'AAA' },
//   { label: 'C1', value: 'c1', code: 'AAA' },
//   { label: 'A1', value: 'a1', code: 'AAA' },
//   { label: 'B1', value: 'b1', code: 'AAA' }
// ]
// const treeOptions = [{
//   value: 'zhejiang',
//   label: 'Zhejiang',
//   children: [{
//     value: 'hangzhou',
//     label: 'Hangzhou',
//     children: [{
//       value: 'xihu',
//       label: 'West Lake',
//       code: 752100,
//     }],
//   }],
// }, {
//   value: 'jiangsu',
//   label: 'Jiangsu',
//   children: [{
//     value: 'nanjing',
//     label: 'Nanjing',
//     children: [{
//       value: 'zhonghuamen',
//       label: 'Zhong Hua Men',
//       code: 453400,
//     }],
//   }],
// }]
// const model = {
//   name: 'yuyi',
//   password: '123456', search2: 'a,b', search: 'b',
//   info: {
//     birthday: '1996-06-30',
//     voiceroid: [...voiceroid],
//     trree: 'zhejiang,hangzhou,xihu'
//   },
//   addressGroup: {
//     address: '上海市'
//   },
//   info2: {
//     trree: "xihu"
//   },
//   showVoiceroid: undefined
// }
// const amap = new AMapService()
// const config: IFormItemConstructor<typeof model>[] = [
//   { label: '姓名', code: 'name', required: form => form.showVoiceroid !== '1', rule: 'commonCode' },
//   { label: '密码', code: 'password' },
//   { label: '生日', code: 'info.birthday', value: new Date(), type: "date", rule: 'futureDate' },
//   {
//     label: '年龄', code: 'info.birthday2', type: "number", computed(form) {
//       // console.log('info.birthday' , )
//       return new Date(form.info.birthday).getFullYear() + form.password
//     }
//   },
//   {
//     label: '提交时间', code: 'info.submitTime', type: "dateToDate", rule: 'dateToDate30', disabled: (form, itemConfig) => {
//       // console.log(form, itemConfig);
//       return form.showVoiceroid !== '1'
//     }
//   },
//   { label: 'A', code: 'showVoiceroid', type: "checkOne", value: '1' },
//   { label: '单选', code: 'search', type: "search", allowInput: true, options, nameCode: 'searchName' },
//   {
//     label: '多选', code: 'search2', type: "search", nameCode: 'search2Name', multiple: true,
//     getOptionsLabel({ item }) {
//       return `${item.name} ${
//         [item.address].join("/") ? `(${[item.address].join("/")})` : ""
//         }`;
//     },
//     async remoteMethod(key: string) {
//       if (key) {
//         console.log(key)
//         try {
//           const locationData = await amap.getAutoComplete({ city: '全国', search: key })
//           return locationData.filter(item => item.location).map(locationData => {
//             const { name, id, district } = locationData
//             return {
//               label: name,
//               value: `${name}(${district})`,
//               key: id,
//               item: locationData
//             }
//           })
//         } catch (e) {
//           return []
//         }
//       }
//       return []
//     }
//   },
//   {
//     label: '地址', code: 'addressGroup', type: 'group', col: 1, children: {
//       trree3: {
//         col: 1,
//         label: '产品c2', code: 'trree3', transformer: 'path', type: "cascader", loadData: (key, currentOptions) => {
//           console.log('loadData', key, currentOptions)
//           return Utils.waitingPromise(1000, key ? options.map(opt => ({ ...opt, value: [key.value, opt.value].join('.') })) : options)
//         }
//       },
//       address: {
//         col: 2,
//         label: '地址查询', code: 'address', type: "search", nameCode: 'addressName',
//         async remoteMethod(key: string) {
//           if (key) {
//             try {
//               const locationData = await amap.getAutoComplete({ city: '全国', search: key })
//               return locationData.filter(item => item.location).map(locationData => {
//                 const { name } = locationData
//                 return {
//                   label: name,
//                   value: name,
//                   item: locationData
//                 }
//               })
//             } catch (e) {
//               return []
//             }
//           }
//           return []
//         }
//       }
//     }
//   },
//   { label: 'B', code: 'info.voiceroid', type: "check", options: voiceroid, hidden: form => form.showVoiceroid !== '1' },
//   { label: 'C', code: 'info.voiceroid2', type: "radio", options: voiceroid, hidden: form => form.showVoiceroid !== '1' },
//   // { label: '产品介绍', code: 'info.introduce', type: "textarea", options: voiceroid, hidden: form => form.showVoiceroid !== '1' },
//   { label: '产品c', code: 'info.trree', transformer: 'path', type: "cascader", options: treeOptions },
//   {
//     label: '产品c2', code: 'info2.trree', type: "selectTree", loadData: (key, currentOptions) => {
//       console.log('loadData', key, options)
//       return Utils.waitingPromise(1000, key ? treeOptions.map(opt => ({ ...opt, value: [key.value, opt.value].join('.') })) : treeOptions)
//     }
//   }
// ]
// const props = {
//   model,
//   config
// }
// let store: FormStore
// const getStore = (gstore: FormStore) => {
//   store = gstore
// }
// storiesOf('DEMO', module)
//   .addDecorator(story => <div style={{padding: 30}}>{story()}</div>)
//   .addDecorator(withKnobs)
//   .add('App', () => {
//     const model = object('Model', props.model)
//     const config = object('Config', props.config)
//     return (
//       <CommonForm model={model} storeRef={getStore}>
//         <FormGroup key={0} config={config} disabled={true}>
//           <Button type="primary" icon="search">{text('Search', 'Search')}</Button>
//           <Button onClick={() => {
//             console.log(props, config)
//             // debugger
//             props.config[9].options = [...props.config[9].options, 'qqq']
//             props.config[10].options = [...props.config[10].options, 'qqq']
//             // voiceroid.push('aaa')

//           }}>增加选项</Button>
//           <Button onClick={() => {
//             console.log(store)
//             props.config[0].rule = undefined
//             props.config[2].rule = undefined
//             // setstate(state+1)
//           }}>移除生日校验</Button>
//           <Button onClick={() => {
//             store.validate()
//             console.log(props, store.formSource)
//           }}>校验</Button>
//           <Button onClick={() => {
//             props.model = {} as any
//           }}>表单重载</Button>
//         </FormGroup>
//       </CommonForm>
//     )
//   }, {
//     info: { 
//       inline: false
//     },
//     notes: 'a[[[[[[[[[',
//     knobs: {
//       timestamps: true, // Doesn't emit events while user is typing.
//       escapeHTML: true 
//       // Escapes strings to be safe for inserting as innerHTML. This option is true by default. It's safe to set it to `false` with frameworks like React which do escaping on their side.
//       // You can still set it to false, but it's strongly unrecommendend in cases when you host your storybook on some route of your main site or web app.
//     }
//   });
export const A = 0
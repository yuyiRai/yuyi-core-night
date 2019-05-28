import Vue from 'vue'
import { DatePicker } from 'element-ui'
import { DateUtils } from '@/stores';
import Utils from '@/utils';
import { VueInReact } from 'vuera'
import 'element-ui/lib/theme-chalk/input.css';
import 'element-ui/lib/theme-chalk/input-number.css';
import 'element-ui/lib/theme-chalk/button.css';
import 'element-ui/lib/theme-chalk/icon.css';
import 'element-ui/lib/theme-chalk/date-picker.css';
export const ElDatePickerItem = VueInReact(Vue.component('ElDatePickerItem', {
  name: 'ElDatePickerItem',
  functional: true,
  render(h, props) {
    // console.log('ElDatePickerItem', props)
    return h('span',{
          attrs: {
            class: props.props.className || undefined
          }
        }, [
        h(DatePickerItem, {
          ...props.data,
          on: {
            change: (e: any) => {
              console.log(e)
              props.props.onChange(e)
            }
          }
        }, props.children)
      ])
  }
}) )

export const DatePickerItem = {
  computed:{
    placeholder(){
      const { placeholder, label } = this.itemConfig
      return placeholder?placeholder:('请选择'+label)
    },
    useTime(){
      const { time, type } = this.itemConfig
      return type === 'dateTime' || Utils.isBooleanFilter(time, false)
    },
    dateFormatStr(){
      return Utils.isNotEmptyValueFilter(
        this.itemConfig.format, 
        `yyyy-MM-dd${this.useTime?' HH:mm:ss':''}`
      )
    }
  },
  render(h) {
    const { value, disabled, itemConfig, 
      dateFormatStr, pickerOptions, placeholder, onChange } = this;
      // console.log(this.value)
    const { type } = itemConfig;
    const commonProps = {
      ref: 'input',
      props: {
        'value-format': dateFormatStr,
        format: dateFormatStr,
        value: value,
        disabled,
        editable: false,
      },
      style: {
        width: '100%'//'auto'
      },
      on: {
        input: onChange
      }
    }
    if(type==='date' || type === 'dateTime'){
      // <!-- 日期 -->
      return (
        h(DatePicker, {
          ...commonProps,
          props: {
            ...commonProps.props,
            type: type.toLowerCase(),
            unlinkPanels: true,
            placeholder,
            size: 'small'
          }
        })
      )
    } else if(type==="dateToDate") {
      // <!-- 日期范围 -->
      const { startPlaceholder, endPlaceholder } = itemConfig
      return (
        h(DatePicker, {
          ...commonProps,
          props: {
            ...commonProps.props,
            type: 'daterange',
            unlinkPanels: true,
            startPlaceholder: startPlaceholder || "起始时间",
            endPlaceholder: endPlaceholder || "截止时间",
            pickerOptions,
            size: 'small'
          }
        })
      )
    } else {
      return null
    }
  },
  methods: {
    onChange(value) {
      if(Utils.isNotEmptyString(value) && this.itemConfig.format==='yyyy-MM-dd HH:mm')
        value+=':00'
      // console.log('change', value)
      this.$emit('change', value)
    }
  },
  data(){
    return {
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            picker.$emit('pick', DateUtils.getDateRange(7));
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            picker.$emit('pick', DateUtils.getDateRange(30));
          }
        }, ...this.options]
      },
    }
  },
  props: {
    itemConfig: {
      type: Object,
      required: true
    },
    value: { },
    options: {
      type: Array,
      default:()=>([])
    },
    disabled: Boolean
  }
}
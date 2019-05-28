import { autobind } from 'core-decorators';
import { forEach, isRegExp, set } from 'lodash';
import { action, computed, observable, ObservableMap } from "mobx";
import { FormStoreCore } from '@/components/Form/FormStore/FormStoreCore';
// import { asyncComputed } from '../../utils/AsyncProperty';
import { Utils } from '@/utils/Utils';
import { getDefaultRules } from './input/Date';
import { IItemConfig } from "./interface";
import { CommonStore } from "./interface/CommonStore";
import { IRuleConfig, IValidator, RuleConfigConstructor, RuleConfigMap, RuleList, ValidatorCallback } from './interface/RuleConfig';

export const keyByRule = keys<IRuleStoreBase<any,any>>()
const config = observable.map({})
export type RuleErrorIntercept = (value?: any, error?: Error, callback?: ValidatorCallback) => any

export interface IRuleStoreBase<V, FM> {
  rule?: RuleConfigConstructor<V, FM>
  requiredMessage?: string;
  regExpMessage?: string;
}
export interface IRuleStoreCreater<V, FM> extends IRuleStoreBase<V, FM> {
}
export interface IRuleStore<V, FM> extends IRuleStoreBase<V, FM> {
  rule?: IRuleConfig<V> | RuleList<V>;
  rules?: IRuleConfig<V> | RuleList<V>;
}

export class RuleConfig<V, FM> extends CommonStore {
  @observable itemConfig: IItemConfig<FM, V>;
  constructor(itemConfig: IItemConfig<FM, V>) {
    super();
    this.itemConfig = itemConfig
  }

  @computed
  public get requiredRule(): any {
    const { itemConfig } = this
    const { required } = itemConfig
    if (required) {
      if (Utils.isObject(required) && Utils.isFunction(required.validator)) {
        const { validator } = required
        return Object.assign({}, itemConfig.required, { validator })
      }
      const validator: IValidator<string | number> = Utils.isFunctionFilter(
        itemConfig.required,
        function (_: any, value: string | number, callback: ValidatorCallback) {
          // value = Utils.isNotEmptyValueFilter(value, this.form[this.code])
          if (Utils.isEmptyValue(value) || Utils.isEmptyData(value) || (itemConfig.type === 'number' && value == 0)) {
            callback(new Error(itemConfig.requiredMessage || `[${itemConfig.label}]不能为${itemConfig.type === 'number' ? '0' : '空'}！`))
            return
          }
          callback();
        }
      )
      return {
        required: true,
        validator,
        trigger: itemConfig.type === 'check' ? 'none' : (itemConfig.type == 'select' ? 'change' : 'blur') //i.type == 'select' ? 'blur' : 'change'
      }
    }
  }

  @observable 
  public static ruleErrorIntercept: RuleErrorIntercept;
  
  @action.bound 
  public static setRuleErrorIntercept(register: RuleErrorIntercept) {
    this.ruleErrorIntercept = (register)
  }

  @autobind
  public useRuleErrorIntercept(validator: IValidator<V>) {
    if (!RuleConfig.ruleErrorIntercept) {
      return validator
    }
    // const { componentProps } = this.itemConfig
    return (rule: any, value: V, callback: ValidatorCallback) => {
      return validator(rule, value, error => {
        if (Utils.isNotEmptyString(error)) {
          error = new Error(error)
        };
        return RuleConfig.ruleErrorIntercept(value, error, callback)
      })
    }
  }

  @computed get ruleGetterParams(): [FM, IItemConfig<FM, V>, FormStoreCore<FM>] {
    return [this.itemConfig.formSource, this.itemConfig, this.itemConfig.formStore]
  }


  @autobind ruleConvert(rule: RuleConfigConstructor<V, FM>, i = this.itemConfig.i): RuleList<V> {
    const [a,b,c] = this.ruleGetterParams
    let ruleGetter = Utils.isFunction(rule) ? rule(a,b,c) : rule;
    if (Utils.isNotEmptyArray(ruleGetter)) {
      return ruleGetter.map(r => this.ruleConvert(r)[0])
    } else if (Utils.isNotEmptyString(ruleGetter)) {
      // 可能是由 '规则Key|规则message构成'
      const [ruleName, message] = ruleGetter.split('|')
      const defaultRuleList = Utils.zipEmptyData(this.ruleConvert(this.defaultRule[ruleName]));
      const isTrigger = ['change', 'blur', 'none'].includes(message);
      if (Utils.isNotEmptyString(message)) {
        forEach(defaultRuleList, i =>
          set(i, isTrigger ? 'trigger' : 'message', message)
        )
      }
      return defaultRuleList
    } else if (isRegExp(ruleGetter)) {
      return [{
        validator: this.convertRegExpToFunction(ruleGetter),
        message: i.regExpMessage || `请正确输入${i.label}！`,
        trigger: 'blur'
      }]
    } else if (Utils.isNotEmptyObject(ruleGetter)) {
      if(isRegExp(ruleGetter.pattern)) {
        ruleGetter.validator = this.convertRegExpToFunction(ruleGetter.pattern)
        ruleGetter.pattern = undefined
      }
      return [ruleGetter]
    } 
    return []
  }

  public convertRegExpToFunction(ruleGetter: RegExp) {
    return (rule: any, value: any, callback: ValidatorCallback) => {
      console.log('convertRegExpToFunction', ruleGetter, value)
      return ruleGetter.test(value) ? callback() : callback(new Error())
    }
  }
  
  @autobind
  public getRuleList(i = this.itemConfig.i): RuleList | undefined {
    const iRules = []
    // if (this.required) {
    if (this.requiredRule) {
      iRules.push(this.requiredRule)
    }
    iRules.push(...this.ruleConvert(i.rule))
    forEach(iRules, config => {
      const { validator, required } = config
      if (Utils.isFunction(validator) && required)
        config.validator = this.useRuleErrorIntercept(validator)
    })

    if (this.itemConfig.type == 'select' || (this.itemConfig.type === 'search' && this.itemConfig.strictSearch)) {
      iRules.push({
        validator: this.optionsMatcher,
        trigger: 'change',
        get strict(): boolean {
          return true;
        }
      })
    }
    // i.code === 'planDischargeDate' && console.log('get rule', this, $version, iRules)
    return Utils.isNotEmptyArrayFilter(iRules) || []
  }


  @autobind
  public async optionsMatcher(r: any, values: any, callback: any) {
    if (!this.itemConfig.allowCreate) {
      const options = this.itemConfig.options || []
      for (const value of Utils.isStringFilter(values, '').split(',')) {
        if (Utils.isNotEmptyValue(value) && (Utils.isArrayFilter(Utils.getOptionsByValue(options, value)) || []).length === 0) {
          console.error(this.itemConfig.label, '选择项匹配失败，请重新选择！', options, this.itemConfig.formSource, values, this)
          return callback(new Error(`[${this.itemConfig.label}]数据异常，请重新输入选择！`))
        }
      }
    }
    // console.log(this.label, '选择项匹配成功！', options, this.form, values, this)
    return callback()
  }

  @computed
  public get defaultRule(): RuleConfigMap<V, FM> {
    return Object.assign(
      RuleConfig.getDefaultRules<V, FM>(),
      getDefaultRules<V, FM>(this.itemConfig)
    )
  }

  @observable
  public static customRuleMap: ObservableMap<string, RuleConfigConstructor<any, any>> = config

  @action 
  public static registerCustomRule<V, FM>(key: string, rule: RuleConfigConstructor<V, FM>) {
    config.set(key, rule)
  }

  public static getDefaultRules<FM, V = any>(): RuleConfigMap<V, FM> {
    return config.toPOJO()
  }
}

export function initCustomRule() {
  const p: RuleConfigMap<any, any> = {
    phone: {
      validator: (rule: any, value: any, callback: any) => {
        // value = Utils.isNotEmptyValueFilter(value, this.form[this.code])
        // console.log('check', value)
        // console.log(rule, value, l,a, this.itemPipe.itemConfig.rule)
        if (Utils.isEmptyValue(value)) {
          return callback();
        }
        const reg = /^1[3|4|5|7|8|9][0-9]\d{8}$/
        if (!reg.test(value + "")) {
          // console.log()
          return callback(new Error('请输入正确的手机号！'));
        }
        return callback();
      },
      // pattern: /^1[3|4|5|7|8][0-9]\d{8}$/,
      trigger: 'blur',
      message: '请录入正确的手机号！'
    },
    'chejiahao': [{
      validator: (rule: any, value: any, callback: ValidatorCallback) => {
        if (Utils.isEmptyValue(value)) {
          return callback();
        }
        if (Utils.isString(value) && value.length === 17) {
          return callback(new Error());
        }
        return callback();
      },
      // pattern: /^1[3|4|5|7|8][0-9]\d{8}$/,
      trigger: 'blur',
      message: '车架号只允许17位'
    }],
    plusOnly: (form, config) => [{
      validator(rule, value, callback: { (arg0: Error): void; (): void; }) {
        // console.log(v,b)
        if (Utils.isNotEmptyValue(value) && (Utils.isNumberFilter(parseFloat(value+'')) || 0) <= 0) {
          return callback(new Error())
        }
        return callback();
      },
      tirgger: 'change',
      message: `${config.label}必须大于0！`
    }],
    // licanseNo: (form: { licenseType: any; }, config: any) => [{
    //   validator: (rule: any, value: string, callback: { (): void; (): void; (arg0: Error): void; (): void; }) => {
    //     // console.log('licenseNo', value)
    //     if (Utils.isNotEmptyString(value)) {
    //       if (trim(value) === '*' || value.indexOf('新车') > -1 || (itemConfig.code !== 'licanseNo' && value === '车外')) {
    //         return callback()
    //       } else {
    //         const selected: Option = Utils.getOptionsByValue(get(configStore, '$store.state.taskDispatcher.licenseTypeList'), form.licenseType)
    //         // console.log(form.licenseType, selected)
    //         const res = (selected && !/警|军队|其它/ig.test(selected.label as string))
    //           ? /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]{1}[A-Z]{1}[A-Z0-9警]{5,6}$/
    //           : /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9警]{5,6}$/;
    //         if (res.test(value)) {
    //           return callback()
    //         } else
    //           return callback(new Error());
    //       }
    //     }
    //     return callback()
    //   },
    //   trigger: 'blur',
    //   message: '请录入正确的车牌号！'
    // }],
    idCard: [{
      pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
      trigger: 'blur',
      message: '请录入正确的身份证号！'
    }],
    commonCode: (form, config) => [{
      pattern: /^(([a-zA-z0-9]*)|)$/,
      trigger: 'onChange',
      message: `请录入正确的[${config.label}]！`
    }]
  }
  for(const key in p) {
    RuleConfig.registerCustomRule(key, p[key])
  }
}
export default initCustomRule()
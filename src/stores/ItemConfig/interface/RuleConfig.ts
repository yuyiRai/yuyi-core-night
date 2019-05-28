import { FormStoreCore } from "src/components/Form/FormStore/FormStoreCore";
import { FormModel, IItemConfig } from "./ItemConfig";

export interface IValidator<V> {
  (rules: any, value: V, callback: ValidatorCallback): void | any;
}
export type TriggerType = 'change' | 'blur' | 'onBlur' | 'onChange'
export type IRuleConfig<V = any> = {
  validator?: IValidator<V>;
  strict?: boolean | undefined;
  trigger?: TriggerType | Array<TriggerType>;
  message?: string;
  pattern?: RegExp;
  required?: boolean;
};
export type ValidatorCallback = (error?: string | Error) => void;
export type RuleList<V = any> = Array<IRuleConfig<V>>;

export type RuleConfigGetter<V = any, FM = FormModel> = (form: FM, config?: IItemConfig<FM, V>, formStore?: FormStoreCore<FM>) => IRuleConfig<V> | RuleList<V>;
export type RuleConfigMap<V = any, FM = FormModel> = {
  [k: string]: RuleConfigConstructor<V, FM>;
};
export type RuleConfigGetterInit = RegExp | string
export type RuleConfigConstructor<V, FM> = IRuleConfig<V> | RuleList<V> | RuleConfigGetter<V, FM> | RuleConfigGetterInit
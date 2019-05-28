import { Message } from 'element-ui';
import 'element-ui/lib/theme-chalk/message.css';
// import 'element-theme-default/lib/message.css'
import { assign, concat, join, reduce } from 'lodash';
import Utils from "..";

export interface IMessageConfig<T = any> {
  msg?: T;
  [k: string]: any;
}
export interface IMessageConfigGroup<T = any>{
  msg: T[];
  [k: string]: any;
}


export function $message<T = any>(config: IMessageConfig<T>, instance: any = {}, time: number = 100): Promise<T[]> {
  return Utils.simpleTimeBufferInput(instance, config, (configList: IMessageConfig<T>[]) => {
    const config: IMessageConfigGroup = reduce<any, IMessageConfigGroup>(configList, ({ msg, ...other }, { msg: iMsg, ...iOther }) => {
      return assign(other, iOther, {
        msg: concat(msg, [iMsg]),
        dangerouslyUseHTMLString: true,
      });
    }, { msg: [] });
    (Utils.isFunctionFilter((this || instance).$message) || Message)({ ...config, message: join(Array.from(new Set(config.msg)), '<br />') });
  }, time || 100);
}

$message.error = function(msg: any, instance: any = {}, time?: number) {
  console.log(msg)
  return $message({ msg, type: 'error' }, instance);
};



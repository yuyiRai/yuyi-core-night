import Notification, { ArgsProps, IconType, NotificationPlacement } from 'antd/lib/notification';
import 'antd/lib/notification/style/css';
// import './style/index.css'
import { assign, concat, reduce } from 'lodash';
import React from 'react';
import ReactDom from 'react-dom';
import Utils from "..";
import styled from 'styled-components'
import { autobind } from 'core-decorators';

export const YuyiContainer = styled.div`
  position: fixed;
  z-index: 2048;
`

export interface INotificationStoreConfigBase {
  title?: React.ReactNode;
  message?: React.ReactNode;
  btn?: React.ReactNode;
  key?: string;
  onClose?: () => void;
  duration?: number | null;
  icon?: React.ReactNode;
  placement?: NotificationPlacement;
  style?: React.CSSProperties;
  prefixCls?: string;
  className?: string;
  readonly type?: IconType;
  onClick?: () => void;
}
export interface INotificationStoreConfig<T = any> extends INotificationStoreConfigBase {
  msg?: T;
}
export interface INotificationStoreConfigGroup<T = any> extends INotificationStoreConfigBase {
  msg: T[];
}


const div = document.createElement('div')

export function $notify<V = any>(config: INotificationStoreConfig<V>, instance: any, time: number = 100): Promise<NotificationStore> {
  return Utils.simpleTimeBufferInput(instance, config, function (configList: INotificationStoreConfig<V>[]): NotificationStore {
    const { msg, ...config }: INotificationStoreConfigGroup = reduce<any, any>(
      configList,
      ({ msg, ...other }, { msg: iMsg, ...iOther }) => {
        return assign(other, iOther, {
          msg: concat(msg, [iMsg]),
          dangerouslyUseHTMLString: true,
        });
      },
      { msg: [] }
    );

    const message = reduce(
      Array.from(new Set(msg)),
      (c, domGetter, index, list) =>
      concat(c, [c.length > 0 && <br key={index + list.length + 1} />, Utils.isFunction(domGetter) ? domGetter(index, list) : domGetter]),
      []
    );
    
  
    const instance = new NotificationStore({
      key: Utils.uuid(),
      ...config,
      ...(config.title ? { message: config.title, description: <span>{message}</span> } : { message: <span>{message}</span> })
    });
    // console.error(message, instance);
    return instance;
  }, time || 100);
}


export class NotificationStore {
  static container: HTMLDivElement;
  key: string;
  static inited: boolean = false;
  constructor(props: ArgsProps) {
    this.key = props.key;
    this.prepare()
    this.open(props);
  }

  open = Notification.open;

  @autobind close() {
    Notification.close(this.key);
  }

  @autobind destroy() {
    Notification.destroy()
  }

  @autobind prepare() {
    document.body.append(div)
    if(!NotificationStore.inited)
      ReactDom.render(<YuyiContainer ref={NotificationStore.init}></YuyiContainer>, div)
  }

  static init(container: HTMLDivElement) {
    if(container) {
      NotificationStore.container = container;
      Notification.config({
        getContainer() {
          // div.style.zIndex = '2048'
          // div.style.position = 'fixed'
          // div.setAttribute('id', 'yuyi-container')
          return NotificationStore.container;
        }
      })
      NotificationStore.inited = true
    }
  }
}
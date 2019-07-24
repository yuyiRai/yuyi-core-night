import { ItemConfig } from '@/stores';
import { lowerFirst, reduce } from 'lodash';
import { IKeyValueMap } from 'mobx';
import { IReactComponent } from 'mobx-react';
import React from 'react';
import ErrorBoundary, { FallbackProps } from 'react-error-boundary';
import { CreateElement, VNode } from 'vue';
import { Utils } from '.';
import { Box } from '@material-ui/core';

const myErrorHandler = (error: Error, componentStack: string) => {
  // Do something with the error
  // E.g. log to an error logging client here
  console.log(error, componentStack)
};
const SlotErrorInfo: React.FunctionComponent<FallbackProps> = ({ componentStack, error }: FallbackProps) => (
  <div>
    <p><strong>Oops! An error occured!</strong></p>
    <p>Here’s what we know…</p>
    <p><strong>Error:</strong> {error.toString()}</p>
    <p><strong>Stacktrace:</strong> {componentStack}</p>
  </div>
);

const { ReactWrapper, VueInReact } = require('vuera');

export const SlotUtils = () => ({
  react2Vue,
  slotInjectContainer,
  Slot
});

export interface ISlotSource {
  factoryProps?: any,
  slotFactory: any
}
const SlotSourceBase = {
  props: ['factoryProps', 'slotFactory'],
  render(h: any) {
    // console.log('render source', h, this);
    const slot = Utils.isFunction(this.slotFactory) ? this.slotFactory(this.factoryProps) : this.slotFactory;
    // debugger
    return h('span', {}, slot)
  }
}
const SlotSource: React.FunctionComponent<ISlotSource> = VueInReact(SlotSourceBase);


const VueRender = VueInReact({
  props: ['value', 'onChange', 'renderer', 'itemConfig'],
  // watch: {
  //   value() {
  //     this.current = this.value
  //   }
  // },
  computed: {
    current() {
      return this.value
    }
  },
  // data() {
  //   return {
  //     current: this.value
  //   }
  // },
  render(h: CreateElement) {
    // console.log('CustomRenderer', 'instance', this.value, this, this.renderer)
    return this.renderer(h, this.current, this.onChange, this.itemConfig)
  }
})

export function useVueRender(renderFunc: <T>(h: CreateElement, value: T, onChange: any, itemConfig: ItemConfig ) => VNode, itemConfig: ItemConfig): React.FunctionComponent<{ value: any; onChange: (value: any) => void}> {
  // const Renderer = React.useCallback(, [renderFunc])
  return React.useMemo(() => {
    return (props: any) => {
      // console.error('CustomRenderer', props, itemConfig.i)
      return <Box><VueRender {...props} renderer={renderFunc} itemConfig={itemConfig} /></Box>
    }
  }, [renderFunc, itemConfig])
}

export interface ISlotProps {
  slot: ISlotSource
}
export class SlotComponent extends React.PureComponent<ISlotProps> {
  render() {
    return (
      <ErrorBoundary onError={myErrorHandler} FallbackComponent={SlotErrorInfo}>
        <span><SlotSource {...this.props.slot} /></span>
      </ErrorBoundary>
    );
  }
};

const getSlotFromVNode = (nodeFactory: IKeyValueMap<VNode[] | Function>): any => {
  return reduce<any, IKeyValueMap<React.FunctionComponent<ISlotSource>>>(nodeFactory,
    (map: any, target: VNode[] | Function, key: string) => {
      // debugger
      return Object.assign(map, {
        [key]: function (props) {
          return <SlotComponent slot={{ slotFactory: target, factoryProps: props }} />
        }
      });
    }, {});
}

export const react2Vue = (Target: IReactComponent<any>) => {
  return {
    functional: true,
    render(h: any, vueProps: any) {
      const { ['default']: children, ...slots } = vueProps.slots();
      const { scopedSlots, props, attrs, ref } = vueProps.data;
      // console.log(Target.displayName || Target.name, vueProps, children, slots, scopedSlots)
      // const { inter } = getSlotFromVNode(slots)
      // debugger
      // console.log(Target.name, 'react2Vue', vueProps, this, children, slots)
      return h(ReactWrapper, {
        ref,
        props: {
          component: Target
        },
        attrs: {
          ...props,
          ...attrs,
          $scopedSlots: scopedSlots || (attrs ? attrs.scopedSlots : undefined),
          $commonSlots: () => getSlotFromVNode(slots)
        },
        on: {
          'onClick': console.log
        }
      } as any, children);
    }
  };
};

export const SlotContext = React.createContext({ slots: null, scopedSlots: null });
export function slotInjectContainer<T extends IReactComponent<any>>(target: T) {
  const Target = target;
  const injected = function (nextProps: any) {
    const { $commonSlots, $scopedSlots, children, ...other } = nextProps;
    const slots = $commonSlots();
    const injectProps = {
      slots,
      scopedSlots: getSlotFromVNode($scopedSlots)
    };
    // console.log('injectProps', nextProps, injectProps)
    if (true) {
      (Target as any).contextType = SlotContext
    }
    // debugger
    return (
      <ErrorBoundary onError={myErrorHandler} FallbackComponent={SlotErrorInfo}>
        <SlotContext.Provider value={injectProps}>
          <Target {...other}><span>{children}</span></Target>
        </SlotContext.Provider>
      </ErrorBoundary>
    );
  } as T;
  Object.defineProperty(injected, 'name', { value: target.name, writable: false, configurable: false, enumerable: false });
  injected.displayName = Target.displayName;
  return injected;
}
export const Slot: React.FunctionComponent<{
  name: string;
  slot?: IReactComponent;
  [k: string]: any;
}> = React.memo(function ({ name: propertyName, slot, ...other }) {
  const slotName = lowerFirst(propertyName);
  const { slots = {}, scopedSlots = {} } = React.useContext(SlotContext)
  const Renderer = slots[slotName] || scopedSlots[slotName] || slot || (() => true ? <span></span> : <span>slots-{slotName}</span>)
  return <Renderer {...other} />
})
export const ScopedSlot: React.FunctionComponent<{
  name: string;
  [k: string]: any;
}> = React.memo(function ({ name: propertyName, ...other }) {
  const slotName = lowerFirst(propertyName);
  const { scopedSlots: { [propertyName]: slotComponent } } = React.useContext(SlotContext)
  const Renderer = slotComponent || (() => true ? <span></span> : <span>slots-{slotName}</span>)
  return Renderer(other)
})
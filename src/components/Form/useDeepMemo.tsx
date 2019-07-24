import { observer } from 'mobx-react';
import * as React from 'react';
import { Utils } from 'yuyi-core-utils';

function injectRenderer<P extends React.PropsWithChildren<any>>(isElement: boolean, Component: React.ComponentType<P> | React.ReactElement<P>) {
  if (isElement) {
    return {
      Renderer: observer((Component as React.ReactElement<P>).type as React.ComponentType<P>),
      renderProps: (Component as React.ReactElement<P>).props,
      renderChildren: (Component as React.ReactElement<P>).props.children
    }
  } else {
    return { Renderer: observer(Component as any) }
  }
}

export function useDeepMemo<P>(Component: React.ComponentType<P>, props: P, children?: any): React.ReactElement<P>;
export function useDeepMemo<P>(Component: React.ReactElement<P>): React.ReactElement<P>;


/**
 * React.memo 深度比较
 * @param Component
 */
export function useDeepMemo<P extends React.PropsWithChildren<any>>(Component: React.ComponentType<P> | React.ReactElement<P>, props: P = {} as any, children?: any) {
  const isElement = React.useMemo(() => React.isValidElement(Component), [Component])
  const [temp, setTemp] = React.useState<ReturnType<typeof injectRenderer>>(() => injectRenderer(isElement, Component))
  React.useEffect(() => {
    setTemp(injectRenderer(isElement, Component))
    // console.error(temp);
  }, [
      isElement,
      isElement ? (Component as any).type : Component
    ])
  const { Renderer: Render, renderProps = props, renderChildren = children } = temp

  const ref = React.useRef<P>({} as P);
  const [rerenderProps, update] = React.useState<any>();
  React.useEffect(() => {
    if (!Utils.isEqual(props, ref.current, true)) {
      ref.current = props;
      update({ ...props })
    }
  }, [props, ref]);
  return React.useMemo(() => {
    console.log('deep memo update', Render.displayName, renderProps);
    return <Render {...renderProps}>{renderChildren}</Render>
  }, [Render, rerenderProps]);
}

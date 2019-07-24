import { Utils } from '@/utils';
import { Tooltip } from 'antd';
import { TooltipProps } from 'antd/lib/tooltip';
import * as React from 'react';
import { useObserver } from '@/hooks';


export interface IValueHintContainerProps extends Pick<TooltipProps, 'trigger' | 'style' | 'className' | 'visible'> {
  value: any;
  children: React.ReactElement<any, any>;
  changeEventName?: string;
}

export function useValueHint(eventHandlers: React.AllHTMLAttributes<any>, trigger: TooltipProps['trigger'], warpRef: React.Ref<Tooltip>, hasValue: boolean) {
  const [isFocus, changeFocus] = React.useState(false)
  const [inputChanged, input] = React.useState(hasValue)
  const ref = React.useRef(React.createRef<Tooltip>())
  const inhertTrigger = React.useMemo(() => Utils.isArrayFilter(trigger, isFocus ? ['focus'] : ['hover', 'focus']) as any, [isFocus, trigger])
  // console.log('ref', ref.current.current);
  const warpEventHandlers = React.useMemo<typeof eventHandlers>(() => {
    const { onFocus, onBlur, onChange } = eventHandlers
    return {
      onChange: e => {
        // console.log({ ...e });
        onChange && onChange(e)
        changeFocus(false)
        input(true)
      },
      onBlur: e => {
        // console.log({ ...e });
        onBlur && onBlur(e)
        changeFocus(false)
      },
      onFocus: e => {
        // console.log({ ...e });
        changeFocus(true)
        onFocus && onFocus(e)
      }
    }
  }, [eventHandlers, changeFocus])
  return { get ref() { return ref.current }, inputChanged, isFocus, inhertTrigger, warpEventHandlers }
}

export function useChangeToFirst(when: (() => void | typeof Utils.stubFunction), expect: () => boolean) {
  const rrr = React.useRef({ current: expect(), out: null })
  const current = expect()
  React.useEffect(() => {
    // console.log('force check', current, rrr.current.current)
    if (!rrr.current.current && rrr.current.current !== current) { // 判断首次
      console.log('force in', current, rrr.current)
      rrr.current.out = when()
      rrr.current.current = current
      return function () {
        if (Utils.isFunction(rrr.current.out)) {
          rrr.current.out()
          console.log('force out', current, rrr.current)
        }
        rrr.current = { current: false, out: null } as any
      }
    }
  }, [
      rrr.current,
      rrr.current.current || current // 第一次捕捉并被记录了下来就永远固定为true了
    ])
  return function (warpOut = false) {
    rrr.current.current = false
    rrr.current.out = null
  }
}

export const useFirstChangeToRefresh: typeof useChangeToFirst = (a, b) => {
  let forceReset = null // 重置第一次触发的触发器
  const reset = useChangeToFirst(() => {
    if (forceReset) // 触发
      forceReset()
    forceReset = null;
    return a()
  }, b)
  forceReset = useChangeToFirst(function () {
    reset()
  }, () => !b())
  const allUnmount = function () {
    forceReset && forceReset()
    reset && reset()
  }
  return allUnmount
}

export const ValueHintContainer: React.SFC<IValueHintContainerProps> =
  React.forwardRef<Tooltip, IValueHintContainerProps>(({ value, children, trigger, ...other }, warpRef) => {
    // const [defaultVisible, updateDefault] = React.useState(false)
    const child = React.Children.only(children)
    const hasValue = Utils.isNotEmptyValue(value)
    const hintStore = useValueHint(child.props, trigger, warpRef, hasValue)
    // const rrr = React.useRef({ current: hasValue && isFocus, inited: false })
    // React.useEffect(() => {
    //   rrr.current = defaultVisible
    // }, [defaultVisible])
    // useFirstChangeTo(() => {

    // }, true, hasValue, false)

    return useObserver(() => {
      const { inputChanged, ref, inhertTrigger, warpEventHandlers } = hintStore
      useFirstChangeToRefresh(function () {
        ref.current.setState({ visible: true })
        return function () {
          if (ref.current.state.visible === true) {
            ref.current.setState({ visible: false })
          }
        }
      }, () => hasValue && inputChanged && (ref.current ? ref.current.state.visible === false : true))
      return (
        <Tooltip
          ref={ref}
          trigger={inhertTrigger}
          title={value}
          placement="topLeft"
          mouseLeaveDelay={0.5}
          {...Utils.zipEmptyData(other)}>{
            React.cloneElement<React.AllHTMLAttributes<any>>(child, warpEventHandlers)
          }</Tooltip>
      )
    }, 'useValueHintContainer');
  }
)
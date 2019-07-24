import { action, runInAction } from 'mobx'
import { Utils } from 'yuyi-core-utils'
import { useLocalStore as ul, useAsObservableSource as ua, Observer, observer, useObserver } from 'mobx-react-lite'

const tmp = action('useLocalStore', ul)
export const useLocalStore: typeof ul = tmp as any

// export function useActionObject<T extends object>(r: T): { 
//   [key in keyof T]: T[key] extends ((...args: any[])=>any) ? ((this: T, ...args: any[])=> any) : T[key] 
// } {
//   for (const key in r) {
//     const v = r[key]
//     if (Utils.isFunction(v)) {
//       const next = action(key, v as any)
//       r[key] = next
//     }
//   }
//   return r as any
// }
export function useActionObject<T extends object>(r: T): T {
  for (const key in r) {
    const v = r[key]
    if (Utils.isFunction(v)) {
      const next = action(key, v as any)
      r[key] = next
    }
  }
  return r as any
}
export const useAsObservableSource: typeof ua = action('useAsObservableSource', ua) as any
export function usePostInit(block: () => unknown, name?: string) {
  runInAction('postInit@' + name, block)
}

export {
  useObserver,
  observer,
  Observer
}
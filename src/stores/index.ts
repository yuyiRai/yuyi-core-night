export class Store {

}
import { configure } from 'mobx'

configure({
  enforceActions: 'always'
})
export * from './ItemConfig'
// import { ItemConfig2 } from './ItemConfig2/ItemConfig'
// import { CommonStore2 } from './ItemConfig2/interface'
// export { ItemConfig2, CommonStore2 }
export * from './AMap'
// export * from './SelectAndSearchStore'
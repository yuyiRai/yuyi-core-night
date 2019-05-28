import { IReactComponent as ReactComponent } from 'mobx-react'

interface IPrototype extends Object {
  [key: string]: any;
}
interface IClassConstructor extends Function {
  [key: string]: any;
}
declare global {
  export type IReactComponent = ReactComponent
  export class Type {
    Function: (...args: any[]) => void | any;
    Prototype: IPrototype;
    ClassConstructor: IClassConstructor;
  }
  export interface Array<T> {
    includes(type: any): boolean;
  }
}
import * as React from 'react'
import { slotInjectContainer, react2Vue } from '../../utils/SlotUtils';

@slotInjectContainer
export class AppTest extends React.Component<any, any> {
  state: any = {
    title: 'React Component Test',
    error: false
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log(error, errorInfo)
    this.setState({ error: true })
  }
  
  // @useSlots Name0: IReactComponent<any>;
  // @useSlots Name1: IReactComponent<any>;
  // @useSlots Name2: IReactComponent<any>;

  onChange = (e: string) => {
    console.log(e)
    this.setState({title: e})
  }
  
  render() {
    return null
    // const { slots } = this.props;
    // const { Name0, Name1, Name2 } = this
    // console.log('React Component Test', this.props)
    // if(this.state.error) {
    //   return <span>getError</span>
    // }
    // return <div><Name0 text={this.state.title} onChange={this.onChange}/><Name1 /><Name2 />{this.props.children}</div>
  }
}


export const ElAppTest = react2Vue(AppTest)
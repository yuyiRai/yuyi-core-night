/**
 * @class ExampleComponent
 */

import * as React from 'react';
import styled from 'styled-components';
import Install from './index.export';

export type Props = { text: string }

const Div = styled.div`
  margin: 2em auto;
  border: 2px solid #000;
  font-size: 2em;
`

export class ExampleComponent extends React.Component<Props> {
  render() {
    const {
      text
    } = this.props

    return (
      <Div>
        Example Component: {text}
      </Div>
    )
  }
}
export default Install;
export * from './index.export';
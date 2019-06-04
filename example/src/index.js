import React from 'react'
import ReactDOM from 'react-dom'
import { hot } from 'react-hot-loader'

import './index.css'
import App from './App'
const Component = hot(module)(App)
ReactDOM.render(<Component />, document.getElementById('root'))

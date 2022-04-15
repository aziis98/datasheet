import './index.scss'

import { render } from 'preact'
import { App } from './app'
import { Tensors } from './tensors.js'

render(<App />, document.getElementById('app'))

//
// Testing
//

window.Tensors = Tensors

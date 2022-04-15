import { useState } from 'preact/hooks'
import { Block } from './components/Block.jsx'

import { NavBar } from './components/NavBar.jsx'
import { SideBar } from './components/SideBar.jsx'
import { currentProject, EXAMPLE_STATE_1 } from './model.js'

export const App = () => {
    const [state, setState] = useState(EXAMPLE_STATE_1)

    const project = currentProject(state)
    console.log(project)

    const setMode = mode => {
        setState({
            ...state,
            currentMode: mode,
        })
    }

    return (
        <>
            <NavBar {...state} />
            <div class="workspace">
                <SideBar {...state} setMode={setMode} />
                <div class="blocks">
                    {project.blocks.map(block => (
                        <Block {...block} />
                    ))}
                </div>
            </div>
        </>
    )
}

import { useState } from 'preact/hooks'
import { Block } from './components/Block.jsx'

import { NavBar } from './components/NavBar.jsx'
import { SideBar } from './components/SideBar.jsx'
import { withItemAt } from './hooks.js'

import { currentProject, EXAMPLE_STATE_1 } from './model.js'
import './tensors.js'

export const App = () => {
    const [state, setState] = useState(EXAMPLE_STATE_1)

    const project = currentProject(state)

    const setMode = mode => {
        setState({
            ...state,
            currentMode: mode,
        })
    }

    const setBlock = i => block => {
        setState({
            ...state,
            projects: {
                ...state.projects,
                [state.currentProject]: {
                    ...state.projects[state.currentProject],
                    blocks: withItemAt(state.projects[state.currentProject].blocks, i)(block),
                },
            },
        })
    }

    return (
        <>
            <NavBar {...state} />
            <div class="workspace">
                <SideBar {...state} setMode={setMode} />
                <div class="blocks">
                    {project.blocks.map((block, i) => (
                        <Block {...block} setBlock={setBlock(i)} />
                    ))}
                </div>
            </div>
        </>
    )
}

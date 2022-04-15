import { currentProject } from '../model.js'
import { OutlineView } from './sidebar/OutlineView.jsx'

const Mode = ({ name, icon, selected, setMode }) => (
    <div class={['mode', name, selected ? 'selected' : ''].join(' ')} onClick={() => setMode(name)}>
        {icon ? <i class={icon}></i> : <div class="todo-box"></div>}
    </div>
)

const modes = [
    { name: 'outline', icon: 'gg-list-tree' },
    { name: 'file', icon: 'gg-file-document' },
    { name: 'other-1' },
    { name: 'other-2' },
]

const modeComponentMap = {
    outline: OutlineView,
}

export const SideBar = props => {
    const { currentMode, setMode } = props
    const project = currentProject(props)

    return (
        <div class="sidebar">
            <div class="modes">
                {modes.map(mode => (
                    <Mode {...mode} selected={mode.name === currentMode} setMode={setMode} />
                ))}
            </div>
            <div class="view">{modeComponentMap[currentMode]({ project })}</div>
        </div>
    )
}

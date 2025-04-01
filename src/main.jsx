import clsx from 'clsx'
import { render } from 'preact'
import { useMemo, useState } from 'preact/hooks'
import { parseSource } from './lang/parser.js'
import { matchTraverseObject } from './utils.js'
import { evaluateNode, evaluateNodeSafe } from './lang/eval.js'
import { applyTextEditorBehavior } from './editor.js'

const DataValueRenderer = ({ value }) => {
    if (value === null || value === undefined) {
        return {
            element: <div class="data null">null</div>,
            depth: 0,
        }
    }
    if (Array.isArray(value)) {
        const items = value.map(item => {
            const { element, depth } = DataValueRenderer({ value: item })
            return {
                element,
                depth,
            }
        })

        const depth = Math.max(...items.map(item => item.depth))

        return {
            element: (
                <div class={clsx('data', 'array', { compact: depth < 1 })}>
                    {value.map((item, index) => (
                        <div class="data item" key={index}>
                            <div class="data index">{index}</div>
                            <div class="data value">{items[index].element}</div>
                        </div>
                    ))}
                </div>
            ),
            depth,
        }
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value).map(([key, val]) => {
            const { element, depth } = DataValueRenderer({ value: val })
            return {
                key,
                element,
                depth,
            }
        })

        return {
            element: (
                <div class="data object">
                    {entries.map(({ key, element }, index) => (
                        <div class="data entry" key={index}>
                            <div class="data key">{key}</div>
                            <div class="data value">{element}</div>
                        </div>
                    ))}
                </div>
            ),
            depth: Math.max(...entries.map(item => item.depth)) + 1,
        }
    }
    if (typeof value === 'string') {
        return {
            element: <div class="data string">{value}</div>,
            depth: 0,
        }
    }
    if (typeof value === 'number') {
        return {
            element: <div class="data number">{value}</div>,
            depth: 0,
        }
    }
    if (typeof value === 'boolean') {
        return {
            element: <div class="data boolean">{value ? 'true' : 'false'}</div>,
            depth: 0,
        }
    }

    throw new Error(`Unsupported data type: ${typeof value}`)
}

const Cell = ({ input, setInput, output, metadata }) => {
    const { element: outputElement, depth } = DataValueRenderer({ value: output })

    return (
        <div class="cell">
            <div class="input">
                <div class="metadata-left">{metadata}</div>
                <div class="content">
                    <textarea
                        value={input}
                        onKeyDown={e => {
                            const newText = applyTextEditorBehavior(e)
                            if (newText !== null) {
                                setInput(newText)
                            }
                        }}
                        onInput={e => setInput(e.target.value)}
                        placeholder="Type something..."
                        rows={Math.max(1, input.split('\n').length)}
                    />
                </div>
            </div>
            <div class="output">{outputElement}</div>
        </div>
    )
}

const Notebook = () => {
    // const cells = [
    //     {
    //         input: '[1 2 3]',
    //         output: [1, 2, 3],
    //     },
    //     {
    //         input: '[4 5 6]',
    //         output: [4, 5, 6],
    //     },
    //     {
    //         input: `
    //             [
    //                 { foo: 1, bar: 2 }
    //                 { foo: 3, bar: 4 }
    //                 { foo: 5, bar: 6 }
    //             ]
    //         `
    //             .replace(/\s+/g, ' ')
    //             .trim(),
    //         output: [
    //             { foo: 1, bar: 2 },
    //             { foo: 3, bar: 4 },
    //             { foo: 5, bar: 6 },
    //         ],
    //     },
    // ]

    const [exampleInput, setExampleInput] = useState('[1 2 3]')
    const inputAst = useMemo(() => parseSource(exampleInput), [exampleInput])
    const evaluatedOutput = useMemo(() => evaluateNodeSafe(inputAst), [inputAst])

    return (
        <div class="notebook">
            {/* {cells.map((cell, index) => (
                <Cell
                    key={index}
                    input={cell.input}
                    setInput={() => {}}
                    output={cell.output}
                    metadata={<code>${index + 1}</code>}
                />
            ))} */}
            <Cell input={exampleInput} setInput={setExampleInput} output={evaluatedOutput?.result ?? evaluatedOutput} />
        </div>
    )
}

const App = () => {
    return (
        <>
            <nav>
                <div class="left">
                    <div class="logo">DataSheet</div>
                </div>
                {/* <div class="center">???</div> */}
                <div class="right">Login</div>
            </nav>
            <main>
                <Notebook />
            </main>
        </>
    )
}

render(<App />, document.body)

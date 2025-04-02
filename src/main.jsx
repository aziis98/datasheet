import clsx from 'clsx'
import { render } from 'preact'
import { useMemo, useState } from 'preact/hooks'
import { parseSource } from './lang/parser.js'
import { matchTraverseObject, parseCSV } from './utils.js'
import { evaluateNode, evaluateNodeSafe, Table } from './lang/eval.js'
import { applyTextEditorBehavior } from './editor.js'

const DataValueRenderer = ({ value }) => {
    if (value === null || value === undefined) {
        return {
            element: <div class="data nil">nil</div>,
            depth: 0,
        }
    }

    if (value instanceof Table) {
        const { rows: rawRows, headers } = value

        const [limit, setLimit] = useState(10)
        const rows = rawRows.slice(0, limit)

        const rowElements = rows.map(row =>
            row.map(cell => {
                const { element, depth } = DataValueRenderer({ value: cell })
                return element
            })
        )

        return {
            element: (
                <div
                    class="data grid"
                    style={{
                        ['--grid-columns']: rows[0].length,
                        ['--grid-rows']: rows.length,
                    }}
                >
                    <div class="data row">
                        {headers.map(header => (
                            <div class="data header">{header}</div>
                        ))}
                    </div>

                    {rowElements.map((row, index) => (
                        <div class="data row" key={index}>
                            {row.map(cell => (
                                <div class="data cell">{cell}</div>
                            ))}
                        </div>
                    ))}

                    {rawRows.length > limit && (
                        <div class="data row info">
                            <button
                                onClick={() => {
                                    setLimit(limit + 10)
                                }}
                            >
                                Show more
                            </button>
                        </div>
                    )}
                </div>
            ),
        }
    }

    if (Array.isArray(value)) {
        // check if grid
        if (
            value.length > 0 &&
            value.every(item => Array.isArray(item)) &&
            value.every(item => item.length === value[0].length)
        ) {
            const rows = value.map(row =>
                row.map(cell => {
                    const { element, depth } = DataValueRenderer({ value: cell })
                    return {
                        element,
                        depth,
                    }
                })
            )

            return {
                element: (
                    <div
                        class="data grid"
                        style={{
                            ['--grid-columns']: value[0].length,
                            ['--grid-rows']: value.length,
                        }}
                    >
                        {rows.map(row => (
                            <div class="data row">
                                {row.map(cell => (
                                    <div class="data cell">{cell.element}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                ),
                depth: 1,
            }
        }

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
            depth: depth + 1,
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

    // throw new Error(`Unsupported data type: ${typeof value}`)

    return {
        element: <div class="data unknown">{String(value)}</div>,
        depth: 0,
    }
}

const Cell = ({ input, setInput, output, metadata }) => {
    const { element: outputElement, depth } = DataValueRenderer({ value: output })

    return (
        <div class="cell">
            <div
                class="input"
                onDragOver={e => {
                    e.preventDefault()
                }}
                onDragEnter={e => {
                    e.preventDefault()
                }}
                onDragLeave={e => {
                    e.preventDefault()
                }}
                onDrop={async e => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) {
                        const { data } = await parseCSV(file)

                        console.log('data', data)

                        const [headers, ...rows] = data

                        const table = new Table(headers, rows)
                        setInput(table.toCode())
                    }
                }}
            >
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

    const [exampleInput, setExampleInput] = useState(`table(["a" "a" "a"] [1 2 3; 4 5 6])`)
    const inputAst = useMemo(() => parseSource(exampleInput), [exampleInput])
    const evaluatedOutput = useMemo(() => evaluateNodeSafe(inputAst), [inputAst])

    return (
        <div class="notebook">
            <Cell input={exampleInput} setInput={setExampleInput} output={evaluatedOutput?.result ?? inputAst} />
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

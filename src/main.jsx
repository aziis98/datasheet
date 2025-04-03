import clsx from 'clsx'
import { render } from 'preact'
import { useMemo, useState } from 'preact/hooks'
import { parseSource } from './lang/parser.js'
import { parseCSV } from './utils.js'
import { evaluateNodeSafe, extendContext, Table } from './lang/eval.js'
import { applyTextEditorBehavior } from './editor.js'

const DataValueRenderer = ({ value }) => {
    if (value === null || value === undefined) {
        return {
            element: (
                <div title="nil" class="data dimmed">
                    nil
                </div>
            ),
            depth: 0,
        }
    }

    if (value instanceof Table) {
        const { rows: rawRows, headers } = value

        const [limit, setLimit] = useState(10)
        const rows = rawRows.slice(0, limit)

        const rowElements = rows.map(row =>
            row.map(cell => {
                const { element } = DataValueRenderer({ value: cell })
                return element
            })
        )

        return {
            element: (
                <div
                    title="table"
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
            value.every(item => item.length === value[0].length) &&
            value.length > 1
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
                        title="grid"
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
                <div title="list" class={clsx('data', 'array', { compact: depth < 1 })}>
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
                <div title="object" class="data object">
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
            element:
                value.length === 0 ? (
                    <div title="string" class="data dimmed">
                        empty string
                    </div>
                ) : value.trim().length === 0 ? (
                    <div title="string" class="data string">
                        <code>{JSON.stringify(value).slice(1, -1).replaceAll(' ', '⎵')}</code>
                    </div>
                ) : (
                    <div title="string" class="data string">
                        {value}
                    </div>
                ),
            depth: 0,
        }
    }
    if (typeof value === 'number') {
        return {
            element: (
                <div title="number" class="data number">
                    {value}
                </div>
            ),
            depth: 0,
        }
    }
    if (typeof value === 'boolean') {
        return {
            element: (
                <div title="boolean" class="data boolean">
                    {value ? 'true' : 'false'}
                </div>
            ),
            depth: 0,
        }
    }

    // throw new Error(`Unsupported data type: ${typeof value}`)

    return {
        element: <div class="data unknown">{String(value)}</div>,
        depth: 0,
    }
}

const Cell = ({ input, setInput, setResource, output, metadata }) => {
    const [dragging, setDragging] = useState(false)

    const { element: outputElement, depth } = DataValueRenderer({ value: output })

    return (
        <div
            class="cell"
            onDragOver={e => {
                e.preventDefault()
                setDragging(true)
            }}
            onDragEnter={e => {
                e.preventDefault()
                setDragging(true)
            }}
            onDragLeave={e => {
                e.preventDefault()
                setDragging(false)
            }}
            onDrop={async e => {
                e.preventDefault()
                setDragging(false)

                const file = e.dataTransfer.files[0]
                if (file) {
                    const { headers, rows } = await parseCSV(file)
                    setResource(file.name, new Table(headers, rows))
                    setInput(`resource("${file.name}")`)
                }
            }}
        >
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
                        autocomplete="off"
                        spellcheck="false"
                        autocorrect="off"
                        autocapitalize="off"
                        placeholder="Type something..."
                        rows={Math.max(1, input.split('\n').length)}
                    />
                </div>
            </div>
            <div class="output">
                <div class="overflow-scrollable">{outputElement}</div>
            </div>

            {dragging && (
                <div class="drop-zone">
                    <div class="text">Drop your file here</div>
                </div>
            )}
        </div>
    )
}

const Notebook = () => {
    const [resources, setResources] = useState({})

    const [exampleInput, setExampleInput] = useState(`table(["a" "a" "a"] [1 2 3; 4 5 6])`)
    const inputAst = useMemo(() => parseSource(exampleInput), [exampleInput])
    const evaluatedOutput = useMemo(
        () =>
            evaluateNodeSafe(
                inputAst,
                extendContext({
                    resource: name => {
                        if (resources[name]) {
                            return resources[name]
                        }
                    },
                })
            ),
        [inputAst]
    )

    return (
        <div class="notebook">
            <Cell
                input={exampleInput}
                setInput={setExampleInput}
                setResource={(name, value) =>
                    setResources({
                        ...resources,
                        [name]: value,
                    })
                }
                output={evaluatedOutput?.result ?? evaluatedOutput}
            />
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

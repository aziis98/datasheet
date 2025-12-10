import { Icon } from "@/components/Icon"
import Papa from "papaparse"
import { render } from "preact"
import { css } from "preact-css-extract/comptime"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import "@/main.css"
import "@fontsource-variable/jetbrains-mono/index.css"
import "@fontsource/source-sans-pro/index.css"
import "@fontsource/source-sans-pro/latin-italic.css"
import "@fontsource/source-sans-pro/latin.css"

import { type Entry } from "@/types"
import { ValueWrapper, type Value } from "@/viewers/types"

import { ContextMenuOverlay, ContextMenuProvider } from "@/components/context-menu"
import { KeyLogger } from "@/components/debug/KeyLogger"
import { MainContent } from "@/components/MainContent"
import { Outline } from "@/components/Outline"
import { QueryBar } from "@/components/QueryBar"
import { QueryResult } from "@/components/QueryResult"
import { EXAMPLE_DATASET } from "@/example-dataset"
import { Optic, useKeyPress, useLocalStorage, useOpticState, useTimer } from "@/lib/hooks"
import { tryEvaluate } from "@/lib/utils"
import { Viewers } from "@/viewers"

import { setupPreactClasslist } from "preact-css-extract"
setupPreactClasslist()

const EXAMPLE_QUERIES = [
    ``,
    `example_object.attributes`,
    `customers.map(([id, name]) => { [first_name, last_name] = name.split(" "); return { id, first_name, last_name } })`,
    `orders.join(customers, "customer_id", "id").columns("0.id", "0.date", "0.status", "1.name", "1.email")`,
    `[...Array(100).keys()].filter(n => n > 1 && [...Array(Math.sqrt(n) | 0).keys()].slice(1).every(d => n % (d + 1)))`,
    `customers.sort("signup_date").columns("name", "city_id").join(cities, "city_id").columns("0.name", "1.name").sort("1.name")`,
]

function evaluateQueryWithStore(query: string, store: Optic<{ entries: Entry[] }>): Value | null {
    const result = tryEvaluate(query.trim(), {
        ...Object.fromEntries(
            store
                .prop("entries")
                .get()
                .map(e => [e.id, new ValueWrapper(e.content)])
        ),
    })

    if (result?.value instanceof ValueWrapper) {
        return result.value.inner
    }

    return null
}

const App = () => {
    // const [bodyAtTop, setBodyAtTop] = useState(true)

    const [query, setQuery] = useState(EXAMPLE_QUERIES[Math.floor(Math.random() * EXAMPLE_QUERIES.length)])
    const [queryTarget, setQueryTarget] = useState<string>("")

    const queryContainerRef = useRef<HTMLElement | null>(null)
    const [queryHeight, setQueryHeight] = useState(0)

    const updateQueryHeight = () => {
        setQueryHeight(queryContainerRef.current?.offsetHeight ?? 0)
    }

    useTimer(500, () => {
        updateQueryHeight()
    })

    useEffect(() => {
        const onScroll = () => {
            // setBodyAtTop(window.scrollY < 16)
        }

        window.addEventListener("scroll", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
        }
    }, [])

    const [configExpadnedMode, setConfigExpandedMode] = useLocalStorage("config:expanded-mode", false)

    const store = useOpticState<{ entries: Entry[] }>({
        entries: EXAMPLE_DATASET,
    })

    const handleCreateQueryEntry = (expression: string) => {
        store.prop("entries").arrayAppend({
            id: `query_${Date.now()}`,
            content: { type: "computed", expression },
        })
    }

    const handleUpload = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = ".csv"
        input.onchange = e => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = () => {
                // use the papaparse library to parse the CSV file
                const result = Papa.parse<string[]>(reader.result as string, {
                    header: true,
                    skipEmptyLines: true,
                })
                const data = result.data

                const columns = result.meta.fields ?? []

                store.prop("entries").arrayAppend({
                    id: file.name
                        .replace(/\.[^/.]+$/, "") // remove extension
                        .replace(/[^\w\d_]+/g, "_"), // sanitize to valid identifier
                    content: {
                        type: "table",
                        columns: columns,
                        // @ts-ignore
                        data: data.map(row => columns.map(col => ({ type: "text", content: row[col] || "" }))),
                    },
                })
            }
            reader.readAsText(file)
        }
        input.click()
    }

    const shiftKeyPressed = useKeyPress(e => e.key === "Shift")

    const resultPreview = useMemo(
        () =>
            query.trim().length === 0
                ? null
                : tryEvaluate(query.trim(), {
                      ...Object.fromEntries(
                          store
                              .prop("entries")
                              .get()
                              .map(e => [e.id, new ValueWrapper(e.content)])
                      ),
                  }),
        [shiftKeyPressed || Math.random()]
    )

    const resultPreviewValue: Value | null =
        resultPreview?.value instanceof ValueWrapper ? resultPreview.value.inner : null
    const PreviewViewer = resultPreviewValue ? Viewers[resultPreviewValue.type] : null

    return (
        <ContextMenuProvider>
            <div
                class={css`
                    display: grid;
                    align-items: start;
                    grid-template-columns: auto 1fr;
                    gap: 0.5rem 1rem;

                    /* width: 100%; */
                    /* max-width: 1200px; */

                    position: relative;

                    > .fill {
                        grid-column: 1 / -1;
                    }
                `}
                style={{
                    width: configExpadnedMode ? "100%" : "auto",
                }}
            >
                <div class="fill flex-h">
                    <h1>DataSheet</h1>
                    <div class="fill"></div>

                    {/* Upload Button */}
                    <button title="Upload Data (CSV)" onClick={handleUpload}>
                        <Icon icon="ph:upload" />
                        Upload Data
                    </button>

                    {/* Toggle Expaned Mode */}
                    <button
                        class="icon"
                        onClick={() => {
                            setConfigExpandedMode(!configExpadnedMode)
                        }}
                    >
                        <Icon icon={configExpadnedMode ? "ph:arrows-in" : "ph:arrows-out"} height={18} />
                    </button>
                </div>
                <div
                    classList={[
                        "fill",
                        "grid-v",
                        css`
                            position: sticky;
                            top: 0;

                            padding: 1rem 1rem 0.5rem 1rem;
                            margin: 0 -1rem;

                            z-index: 3;
                            background: var(--bg-main);
                        `,
                    ]}
                    ref={(el: HTMLDivElement | null) => {
                        queryContainerRef.current = el
                        updateQueryHeight()
                    }}
                >
                    <QueryBar
                        classList={[
                            "card",
                            css`
                                overflow: visible;

                                box-sizing: content-box;
                                padding: 0.5rem;

                                font-family: "JetBrains Mono Variable", monospace;
                                font-size: 14px;
                                line-height: 1.5;

                                z-index: 2;
                            `,
                        ]}
                        query={query}
                        setQuery={value => {
                            setQuery(value)
                            setQueryTarget(value)
                            updateQueryHeight()
                        }}
                        onSend={source => {
                            setQuery("")
                            setQueryTarget("")
                            updateQueryHeight()

                            handleCreateQueryEntry(source)
                        }}
                    />

                    <QueryResult
                        query={query}
                        queryHeight={queryHeight}
                        resultPreview={resultPreview}
                        resultPreviewValue={resultPreviewValue}
                        PreviewViewer={PreviewViewer}
                        suggestQuery={completion => setQuery(queryTarget + completion)}
                    />
                </div>

                <Outline topOffset={queryHeight} entries={store.prop("entries")} />
                <MainContent
                    entries={store.prop("entries").mapSame(entries =>
                        entries.map(e =>
                            e.content.type === "computed"
                                ? {
                                      ...e,
                                      content: {
                                          ...e.content,
                                          lastResult: evaluateQueryWithStore(e.content.expression, store) ?? undefined,
                                      },
                                  }
                                : e
                        )
                    )}
                    suggestQuery={completion => {
                        setQuery(completion)
                        setQueryTarget(completion)
                    }}
                />

                <KeyLogger />
            </div>

            <ContextMenuOverlay />
        </ContextMenuProvider>
    )
}

render(<App />, document.getElementById("app")!)

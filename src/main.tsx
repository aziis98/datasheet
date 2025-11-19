import { Icon } from "@/components/Icon"
import Papa from "papaparse"
import { render, type ComponentProps } from "preact"
import { css } from "preact-css-extract/comptime"
import { useEffect, useRef, useState } from "preact/hooks"

import "@fontsource-variable/jetbrains-mono/index.css"
import "@fontsource/source-sans-pro/index.css"
import "@fontsource/source-sans-pro/latin-italic.css"
import "@fontsource/source-sans-pro/latin.css"
import "./main.css"

import { setupPreactClasslist } from "preact-css-extract"
import { forwardRef } from "preact/compat"
import { AutosizeInput } from "./components/AutosizeInput"
import { Editable } from "./components/Editable"
import { EXAMPLE_DATASET } from "./example-dataset"
import { Optic, useLocalStorage, useOpticState, useTimer } from "./lib/hooks"
import { tryEvaluate } from "./lib/utils"
import { ViewerIcons, Viewers } from "./viewers"
import { ValueWrapper, type Value } from "./viewers/types"
setupPreactClasslist()

const QueryBar = forwardRef<
    HTMLTextAreaElement,
    {
        query: string
        setQuery: (val: string) => void
    } & ComponentProps<"textarea">
>(({ query, setQuery, ...rest }, ref) => {
    return (
        <AutosizeInput
            {...rest}
            ref={ref}
            placeholder="Enter a new query..."
            value={query}
            setValue={setQuery}
            spellcheck={false}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
        />
    )
})

const Outline = ({ topOffset, entries }: { topOffset?: number; entries: Optic<Entry[]> }) => {
    return (
        <div
            classList={[
                "card",
                css`
                    min-width: 13rem;
                    padding-left: 0.5rem;

                    display: grid;
                    gap: 0.5rem;
                    grid-auto-flow: row;

                    position: sticky;

                    z-index: 3;

                    transition: top 64ms ease-out;
                `,
            ]}
            style={{ top: `${topOffset}px` }}
        >
            <div
                class={css`
                    display: grid;
                    gap: 0.25rem;
                    grid-auto-flow: column;
                    justify-content: start;
                    align-items: center;

                    gap: 0.5rem;
                    font-weight: 600;
                `}
            >
                <Icon icon="ph:tree-view" />
                <div>Outline</div>
            </div>
            <div
                class={css`
                    display: grid;
                    grid-auto-flow: row;
                    gap: 0.25rem;
                `}
            >
                {entries
                    .items()
                    .reverse()
                    .map(entry => {
                        const { id, content: value } = entry.get()
                        return (
                            <div
                                title={id}
                                classList={[
                                    "grid-h",
                                    css`
                                        grid-template-columns: auto 1fr auto;
                                        gap: 0.35rem;

                                        padding: 0.25rem 0.5rem 0.25rem 0.5rem;
                                        border-radius: 0.25rem;
                                        cursor: pointer;

                                        &:hover {
                                            background: var(--bg-hover);
                                        }
                                    `,
                                ]}
                                onClick={() => {
                                    const el = document.querySelector(`[data-entry-id="${id}"]`)
                                    if (el) {
                                        el.scrollIntoView({ behavior: "smooth", block: "center" })
                                    }
                                }}
                            >
                                <Icon icon={ViewerIcons[value.type]} />
                                <div
                                    classList={[
                                        "text-small",
                                        css`
                                            /* Truncation */
                                            overflow: hidden;
                                            text-overflow: ellipsis;
                                            white-space: nowrap;

                                            max-width: 13rem;
                                        `,
                                    ]}
                                >
                                    {id}
                                </div>
                                <div class="text-small text-dimmed">{value.type}</div>
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}

const MainContent = ({
    entries,
    suggestQueryFor,
}: {
    entries: Optic<Entry[]>
    suggestQueryFor: (entryId: string) => (completion: (entryId: string) => string) => void
}) => {
    return (
        <div
            class={css`
                display: grid;
                grid-auto-flow: row;
                gap: 1rem;
            `}
        >
            {entries
                .items()
                .reverse()
                .map(entry => {
                    const { id, content } = entry.get()

                    const Viewer = Viewers[content.type]

                    if (content.type === "text") {
                        return (
                            <div
                                data-entry-id={id}
                                classList={[
                                    "card",
                                    css`
                                        padding: 0;
                                        display: grid;
                                        overflow: clip;
                                    `,
                                ]}
                            >
                                <Viewer value={entry.prop("content")} />
                            </div>
                        )
                    }

                    return (
                        <div
                            data-entry-id={id}
                            classList={css`
                                display: grid;
                                justify-items: start;

                                border-radius: 0.25rem;

                                &:hover {
                                    background: hsl(220 14% 89%);
                                    box-shadow: 0 0 0 0.25rem hsl(220 14% 89%);
                                }
                            `}
                        >
                            <div
                                classList={[
                                    "card",
                                    css`
                                        border-bottom: none;
                                        border-bottom-left-radius: 0;
                                        border-bottom-right-radius: 0;

                                        padding: 0.25rem 0.5rem 0.5rem 0.5rem;
                                        margin-bottom: -0.25rem;

                                        font-size: 14px;
                                        font-weight: 500;

                                        color: var(--text);
                                        background: var(--bg-header);

                                        z-index: 1;
                                        display: grid;
                                    `,
                                ]}
                            >
                                <Editable oValue={entry.prop("id")} />
                            </div>
                            <div
                                classList={[
                                    "card",
                                    css`
                                        justify-self: stretch;

                                        display: grid;
                                        grid-auto-flow: row;
                                        grid-auto-rows: auto;

                                        padding: 0;
                                        overflow: clip;

                                        z-index: 2;
                                    `,
                                ]}
                            >
                                {/* Entry Expression */}
                                {/* <AutosizeInput
                                value={"feijpfewjpifwfeipw"}
                                spellcheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                class={css`
                                    padding: 0.25rem 0.5rem;
                                    background: light-dark(var(--bg-header), #222);

                                    font-family: "Source Sans Pro", sans-serif;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #444;

                                    border-bottom: 1px solid var(--border);
                                `}
                            /> */}

                                <Viewer suggestQuery={suggestQueryFor(id)} value={entry.prop("content")} />
                            </div>
                        </div>
                    )
                })}
        </div>
    )
}

type Entry = {
    id: string
    content: Value
}

const App = () => {
    // const [bodyAtTop, setBodyAtTop] = useState(true)

    const [query, setQuery] = useState(
        ""
        // dedent(`
        //     [...Array(100).keys()].filter(n => n > 1 && [...Array(Math.sqrt(n) | 0).keys()].slice(1).every(d => n % (d + 1)))
        // `)
    )

    const suggestQueryFor = (entryId: string) => (completion: (entryId: string) => string) => {
        setQuery(completion(entryId))
    }

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

                const tableValue: Value = {
                    type: "table",
                    columns: columns,
                    // @ts-ignore
                    data: data.map(row => columns.map(col => ({ type: "text", content: row[col] || "" }))),
                }

                store.prop("entries").arrayAppend({
                    id: file.name
                        .replace(/\.[^/.]+$/, "") // remove extension
                        .replace(/[^\w\d_]+/g, "_"), // sanitize to valid identifier
                    content: tableValue,
                })
            }
            reader.readAsText(file)
        }
        input.click()
    }

    const resultPreview = tryEvaluate(query, {
        ...Object.fromEntries(
            store
                .prop("entries")
                .get()
                .map(e => [e.id, new ValueWrapper(e.content)])
        ),
    })

    const resultPreviewValue: Value | null = resultPreview instanceof ValueWrapper ? resultPreview.inner : null
    const PreviewViewer = resultPreviewValue ? Viewers[resultPreviewValue.type] : null

    return (
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

                        /* &::after {
                            content: "";
                            position: absolute;
                            left: 0;
                            right: 0;
                            top: 100%;
                            height: 2rem;
                            pointer-events: none;
                            background: linear-gradient(to bottom, var(--bg-main) 0%, #fff0 100%);

                            transition: opacity 250ms ease-in-out;
                        } */
                    `,
                    // bodyAtTop &&
                    //     css`
                    //         &::after {
                    //             opacity: 0;
                    //             transition: opacity 64ms ease-in-out;
                    //         }
                    //     `,
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
                            box-sizing: content-box;

                            font-family: "JetBrains Mono Variable", monospace;
                            font-size: 14px;
                            line-height: 1.25;

                            z-index: 2;
                        `,
                    ]}
                    query={query}
                    setQuery={value => {
                        updateQueryHeight()
                        setQuery(value)
                    }}
                />

                <div
                    classList={[
                        css`
                            display: grid;
                            grid-template-columns: auto 1fr;
                            justify-items: start;

                            z-index: 1;

                            margin: 0 0.5rem;
                            padding: 0.5rem;
                            gap: 0.25rem;

                            background: hsl(from var(--bg-main) h calc(s + 15) calc(l + 3));
                            border: 1px solid var(--border);
                            border-top: none;

                            border-bottom-left-radius: 0.5rem;
                            border-bottom-right-radius: 0.5rem;

                            box-shadow: var(--shadow);

                            max-height: 100vh;
                            transition: all 200ms ease-out;

                            > .iconify {
                                grid-row: 1 / -1;
                            }
                        `,
                        query.trim().length === 0 &&
                            css`
                                pointer-events: none;
                                transform: translateY(-100%);
                                opacity: 0;
                                max-height: 0;
                                padding: 0;
                            `,
                    ]}
                    style={{
                        top: `calc(3.5rem + 2rem + ${queryHeight}px)`,
                    }}
                >
                    <Icon icon="ph:arrow-bend-down-right" />
                    <span>Preliminary result for query:</span>
                    <div
                        class={css`
                            grid-column: 2 / 3;
                        `}
                    >
                        {PreviewViewer && resultPreviewValue ? (
                            <div
                                classList={[
                                    "card",
                                    css`
                                        overflow: clip;
                                        padding: 0;
                                        zoom: 0.8;
                                        border-radius: 0.5rem;
                                    `,
                                ]}
                            >
                                <PreviewViewer value={Optic.ofFrozen<Value>(resultPreviewValue)} maxHeight="30vh" />
                            </div>
                        ) : (
                            <span class="text-dimmed">No preview available</span>
                        )}
                    </div>
                </div>
            </div>

            <Outline topOffset={queryHeight} entries={store.prop("entries")} />
            <MainContent entries={store.prop("entries")} suggestQueryFor={suggestQueryFor} />
        </div>
    )
}

render(<App />, document.body)

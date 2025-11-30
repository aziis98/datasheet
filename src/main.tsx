import { Icon } from "@/components/Icon"
import Papa from "papaparse"
import { render, type ComponentProps } from "preact"
import { css } from "preact-css-extract/comptime"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import "@fontsource-variable/jetbrains-mono/index.css"
import "@fontsource/source-sans-pro/index.css"
import "@fontsource/source-sans-pro/latin-italic.css"
import "@fontsource/source-sans-pro/latin.css"
import "./main.css"

import { setupPreactClasslist } from "preact-css-extract"
import { forwardRef } from "preact/compat"
import { AutosizeInput } from "./components/AutosizeInput"
import { ContextMenuOverlay, ContextMenuProvider } from "./components/context-menu"
import { Editable } from "./components/Editable"
import { EXAMPLE_DATASET } from "./example-dataset"
import { Optic, useKeyPress, useLocalStorage, useOpticState, useTimer } from "./lib/hooks"
import { tryEvaluate } from "./lib/utils"
import { ViewerIcons, Viewers } from "./viewers"
import { TextViewer } from "./viewers/TextViewer"
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
            autoFocus={false}
            ref={ref}
            placeholder="Enter a new query..."
            oValue={Optic.of(query, u => setQuery(u(query)))}
            // disable autocorrect features for code input
            spellcheck={false}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
        />
    )
})

const outlineStyle = css`
    min-width: 13rem;
    padding: 0.5rem;

    display: grid;
    gap: 0.5rem;
    grid-auto-flow: row;

    position: sticky;

    z-index: 3;

    transition: top 64ms ease-out;
`

const Outline = ({ topOffset, entries }: { topOffset?: number; entries: Optic<Entry[]> }) => {
    return (
        <div classList={["card", outlineStyle]} style={{ top: `calc(0.5rem + ${topOffset}px)` }}>
            <div
                classList={[
                    "grid-h",
                    css`
                        gap: 0.5rem;
                        font-weight: 600;
                    `,
                ]}
            >
                <Icon icon="ph:tree-view" />
                <div>Outline</div>
            </div>
            <div class="grid-v">
                {entries
                    .items()
                    .reverse()
                    .map(entry => {
                        const { id, content: value } = entry.get()

                        const scrollToEntry = () => {
                            const el = document.querySelector(`[data-entry-id="${id}"]`)
                            el?.scrollIntoView({ behavior: "smooth", block: "center" })
                        }

                        return (
                            <div
                                title={id}
                                classList={[
                                    "flex-h",
                                    css`
                                        padding: 0.25rem 0.5rem 0.25rem 0.5rem;
                                        border-radius: 0.25rem;
                                        cursor: pointer;

                                        &:hover {
                                            background: var(--bg-hover);
                                        }
                                    `,
                                ]}
                                onClick={scrollToEntry}
                            >
                                <Icon icon={ViewerIcons[value.type]} />
                                <div
                                    classList={[
                                        "text-small",
                                        "text-ellipsis",
                                        css`
                                            max-width: 13rem;
                                        `,
                                    ]}
                                >
                                    {id}
                                </div>
                                <div class="fill"></div>
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
    suggestQuery,
}: {
    entries: Optic<Entry[]>
    suggestQuery: (completion: string) => void
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

                    const textValueOptic = entry.prop("content").trySubtype(v => v.type === "text")

                    if (textValueOptic) {
                        return (
                            <div
                                data-entry-id={id}
                                classList={[
                                    "card",
                                    "grid-fill",
                                    css`
                                        border-radius: 0.25rem;

                                        &:hover {
                                            box-shadow: 0 0 0 0.25rem hsl(from var(--bg-hover) h s l / 0.1);
                                        }
                                    `,
                                ]}
                            >
                                <TextViewer oValue={textValueOptic} />
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
                                    background: hsl(from var(--bg-hover) h s l / 0.1);
                                    box-shadow: 0 0 0 0.25rem hsl(from var(--bg-hover) h s l / 0.1);
                                }
                            `}
                        >
                            <div
                                classList={[
                                    "card",
                                    css`
                                        z-index: 1;

                                        border-bottom: none;
                                        border-bottom-left-radius: 0;
                                        border-bottom-right-radius: 0;

                                        padding: 0.25rem 0.5rem 0.5rem 0.5rem;
                                        margin-bottom: -0.25rem;

                                        font-size: 14px;
                                        font-weight: 600;

                                        color: var(--text-muted);
                                        background: var(--bg-label);
                                    `,
                                ]}
                            >
                                <Editable oValue={entry.prop("id")} />
                            </div>
                            <div
                                classList={[
                                    "card",
                                    "grid-v",
                                    css`
                                        z-index: 2;
                                        justify-self: stretch;
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

                                <Viewer
                                    suggestQuery={completion =>
                                        completion === "" ? suggestQuery("") : suggestQuery(id + completion)
                                    }
                                    oValue={entry.prop("content")}
                                />
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

const EXAMPLE_QUERIES = [
    ``,
    `customers.map(([id, name]) => { [first_name, last_name] = name.split(" "); return { id, first_name, last_name } })`,
    `orders.join(customers, "customer_id", "id").columns("0.id", "0.date", "0.status", "1.name", "1.email")`,
    `[...Array(100).keys()].filter(n => n > 1 && [...Array(Math.sqrt(n) | 0).keys()].slice(1).every(d => n % (d + 1)))`,
    `customers.sort("signup_date").columns("name", "city_id").join(cities, "city_id").columns("0.name", "1.name").sort("1.name")`,
]

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
                : tryEvaluate(query, {
                      ...Object.fromEntries(
                          store
                              .prop("entries")
                              .get()
                              .map(e => [e.id, new ValueWrapper(e.content)])
                      ),
                  }),
        [shiftKeyPressed || query]
    )

    const resultPreviewValue: Value | null = resultPreview instanceof ValueWrapper ? resultPreview.inner : null
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
                            updateQueryHeight()
                            setQuery(value)
                            setQueryTarget(value)
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
                                gap: 0.5rem;

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
                            !(query.trim().length > 0 && resultPreview !== null) &&
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
                        {/* <span>Preliminary result for query:</span> */}
                        <div
                            class={css`
                                grid-column: 2 / 3;
                            `}
                        >
                            <div
                                classList={[
                                    "card",
                                    css`
                                        zoom: 0.8;
                                        border-radius: 0.5rem;
                                    `,
                                ]}
                            >
                                {PreviewViewer && resultPreviewValue ? (
                                    <PreviewViewer
                                        suggestQuery={completion => setQuery(queryTarget + completion)}
                                        oValue={Optic.of<Value>(resultPreviewValue)}
                                        maxHeight="30vh"
                                    />
                                ) : (
                                    <code>{JSON.stringify(resultPreview)}</code>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Outline topOffset={queryHeight} entries={store.prop("entries")} />
                <MainContent
                    entries={store.prop("entries")}
                    suggestQuery={completion => {
                        setQuery(completion)
                        setQueryTarget(completion)
                    }}
                />

                <div
                    class={css`
                        position: fixed;
                        bottom: 1rem;
                        left: 1rem;

                        z-index: 1000;
                    `}
                >
                    {shiftKeyPressed && (
                        <div
                            class={css`
                                display: grid;
                                place-items: center;

                                padding: 0.25rem 0.5rem;
                                border-radius: 0.5rem;
                                opacity: 0.75;

                                background: #111;
                                color: #fff;

                                font-family: "JetBrains Mono Variable", monospace;
                                font-size: 15px;
                            `}
                        >
                            Shift
                        </div>
                    )}
                </div>
            </div>

            <ContextMenuOverlay />
        </ContextMenuProvider>
    )
}

render(<App />, document.getElementById("app")!)

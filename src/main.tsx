import { Icon } from "@/components/Icon"
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
import { EXAMPLE_DATASET } from "./example-dataset"
import { useOpticState, type Optic } from "./lib/hooks"
import { dedent, tryEvaluate } from "./lib/utils"
import { ViewerIcons, Viewers } from "./viewers"
import type { Value } from "./viewers/types"
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
                    width: 15rem;
                    padding-left: 0.5rem;

                    display: grid;
                    gap: 0.5rem;
                    grid-auto-flow: row;

                    position: sticky;

                    z-index: 3;
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
                {entries.items().map(entry => {
                    const { id, name, value } = entry.get()
                    return (
                        <div
                            key={id}
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
                            <div class="text-small">{name}</div>
                            <div class="text-small text-dimmed">{value.type}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const MainContent = ({ entries }: { entries: Optic<Entry[]> }) => {
    return (
        <div
            class={css`
                display: grid;
                grid-auto-flow: row;
                gap: 1rem;
            `}
        >
            {entries.items().map(entry => {
                const { id, name, value } = entry.get()

                const Viewer = Viewers[value.type]
                if (!Viewer) {
                    console.warn(`No viewer found for type: "${value.type}"`)
                    return null
                }

                if (value.type === "text") {
                    return (
                        <div
                            data-entry-id={id}
                            key={id}
                            classList={[
                                "card",
                                css`
                                    padding: 0;
                                    display: grid;
                                    overflow: clip;
                                `,
                            ]}
                        >
                            <Viewer value={entry.prop("value")} />
                        </div>
                    )
                }

                return (
                    <div
                        data-entry-id={id}
                        classList={css`
                            display: grid;
                            justify-items: start;
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
                            {name}
                        </div>
                        <div
                            key={id}
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

                            <Viewer value={entry.prop("value")} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

type Entry = {
    id: string
    name: string
    value: Value
}

const App = () => {
    const [bodyAtTop, setBodyAtTop] = useState(true)

    const [query, setQuery] = useState(
        dedent(`
            [...Array(100).keys()].filter(n => n > 1 && [...Array(Math.sqrt(n) | 0).keys()].slice(1).every(d => n % (d + 1)))
        `)
    )
    const queryContainerRef = useRef<HTMLElement | null>(null)
    const [queryHeight, setQueryHeight] = useState(0)

    useEffect(() => {
        const onScroll = () => {
            setBodyAtTop(window.scrollY < 16)
        }

        window.addEventListener("scroll", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
        }
    }, [])

    const store = useOpticState<{ entries: Entry[] }>({
        entries: EXAMPLE_DATASET,
    })

    return (
        <div
            class={css`
                display: grid;
                align-items: start;
                grid-template-columns: auto 1fr;
                gap: 0 1rem;

                width: 100%;
                max-width: 1200px;

                position: relative;

                > .fill {
                    grid-column: 1 / -1;
                    display: grid;
                }
            `}
        >
            <div class="fill">
                <h1>DataSheet</h1>
            </div>
            <div
                classList={[
                    "fill",
                    "grid-v",
                    css`
                        position: sticky;
                        top: 0;

                        padding: 1rem;
                        margin: 0 -1rem;

                        z-index: 3;
                        background: var(--bg-main);

                        &::after {
                            content: "";
                            position: absolute;
                            left: 0;
                            right: 0;
                            top: 100%;
                            height: 2rem;
                            pointer-events: none;
                            background: linear-gradient(to bottom, var(--bg-main) 0%, #fff0 100%);

                            transition: opacity 250ms ease-in-out;
                        }
                    `,
                    bodyAtTop &&
                        css`
                            &::after {
                                opacity: 0;
                                transition: opacity 64ms ease-in-out;
                            }
                        `,
                ]}
                ref={(el: HTMLDivElement | null) => {
                    queryContainerRef.current = el
                    setQueryHeight(queryContainerRef.current?.offsetHeight ?? 0)
                }}
            >
                <QueryBar
                    classList={[
                        "card",
                        css`
                            font-family: "JetBrains Mono Variable", monospace;
                            font-size: 14px;
                            line-height: 1.25;

                            z-index: 2;
                        `,
                    ]}
                    query={query}
                    setQuery={value => {
                        setQueryHeight(queryContainerRef.current?.offsetHeight ?? 0)
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
                        // translate: query.trim().length > 0 ? "0 0" : "0 -100%",
                        // maxHeight: query.trim().length > 0 ? "100vh" : "0",
                        // opacity: query.trim().length > 0 ? "1" : "0",
                        // padding: query.trim().length > 0 ? "0.5rem" : "0",

                        top: `calc(3.5rem + 2rem + ${queryHeight}px)`,
                    }}
                >
                    <Icon icon="ph:arrow-bend-down-right" />
                    <span>Preliminary result for query:</span>
                    <code
                        class={css`
                            grid-column: 2 / 3;
                        `}
                    >
                        {JSON.stringify(tryEvaluate(query), null, 2).replace(/\s+/g, " ")}
                    </code>
                </div>
            </div>

            <Outline topOffset={queryHeight} entries={store.prop("entries")} />
            <MainContent entries={store.prop("entries")} />
        </div>
    )
}

render(<App />, document.body)

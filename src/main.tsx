import { Icon } from "@iconify/react"
import { render } from "preact"
import { css } from "preact-css-extract/comptime"
import { useState } from "preact/hooks"

import "@fontsource-variable/jetbrains-mono/index.css"
import "@fontsource/source-sans-pro/index.css"
import "./main.css"

import { setupPreactClasslist } from "preact-css-extract"
import { useOptic, type Optic } from "./lib/hooks"
import { Viewers } from "./viewers"
import type { Value } from "./viewers/types"
setupPreactClasslist()

const QueryBar = ({}) => {
    const [query, setQuery] = useState("")

    return (
        <textarea
            placeholder="Enter your query..."
            class={css`
                width: 100%;

                border: 1px solid #ccc;
                border-radius: 0.25rem;
                box-shadow: 0 0.125rem 0.35rem rgba(0, 0, 0, 0.1);

                padding: 0.5rem;
            `}
            value={query}
            onInput={e => setQuery(e.currentTarget.value)}
            rows={query.split("\n").length || 1}
        />
    )
}

const Outline = ({ entries }: { entries: Optic<Entry[]> }) => {
    return (
        <div
            classList={[
                "card",
                css`
                    width: 15rem;

                    display: grid;
                    gap: 1rem;
                    grid-auto-flow: row;
                `,
            ]}
        >
            <div
                class={css`
                    display: grid;
                    grid-auto-flow: column;
                    align-items: center;
                    justify-content: start;

                    gap: 0.5rem;
                    font-weight: 600;
                    font-size: 14px;
                `}
            >
                <Icon icon="material-symbols:table-outline" /> Tables
            </div>
            <div
                class={css`
                    display: grid;
                    grid-auto-flow: row;
                    gap: 0.25rem;
                `}
            >
                {entries.items().map(entry => {
                    const { id, name } = entry.get()
                    return (
                        <div
                            key={id}
                            class={css`
                                padding: 0.25rem 0.5rem;
                                border-radius: 0.25rem;

                                &:hover {
                                    background: #f0f0f0;
                                    cursor: pointer;
                                }
                            `}
                        >
                            {name}
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

                return (
                    <div
                        key={id}
                        class={css`
                            display: contents;
                        `}
                    >
                        <strong>{name}</strong>
                        <Viewer value={entry.prop("value")} />
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
    const store = useOptic<{ entries: Entry[] }>({
        entries: [
            {
                id: "1",
                name: "example-1",
                value: {
                    type: "text",
                    content: "Hello, World!",
                },
            },
            {
                id: "2",
                name: "foo-bar",
                value: {
                    type: "text",
                    content: "This is a sample text entry.",
                },
            },
        ],
    })

    return (
        <div
            class={css`
                display: grid;
                align-items: start;
                grid-template-columns: auto 1fr;
                gap: 1rem;
                width: 100%;
                max-width: 1200px;

                padding-top: 1rem;

                > .fill {
                    grid-column: 1 / -1;
                }
            `}
        >
            <div class="fill">
                <h1>DataSheet</h1>
            </div>
            <div class="fill">
                <QueryBar />
            </div>

            <Outline entries={store.prop("entries")} />
            <MainContent entries={store.prop("entries")} />
        </div>
    )
}

render(<App />, document.body)

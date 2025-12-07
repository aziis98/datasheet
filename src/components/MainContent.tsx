import type { Optic } from "@/lib/hooks"
import type { Entry } from "@/types"
import { Viewers } from "@/viewers"
import { TextViewer } from "@/viewers/TextViewer"
import type { TextValue } from "@/viewers/types"
import { css } from "preact-css-extract/comptime"
import { Editable } from "./Editable"

const TextCell = ({ id, oValue }: { id: string; oValue: Optic<TextValue> }) => {
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
            <TextViewer oValue={oValue} />
        </div>
    )
}

export const MainContent = ({
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
                        return <TextCell id={id} oValue={textValueOptic} />
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

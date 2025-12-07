import type { Optic } from "@/lib/hooks"
import type { Entry } from "@/types"
import { ViewerIcons } from "@/viewers"
import { Icon } from "@iconify/react"
import { css } from "preact-css-extract/comptime"

export const Outline = ({ topOffset, entries }: { topOffset?: number; entries: Optic<Entry[]> }) => {
    return (
        <div
            classList={[
                "card",
                css`
                    min-width: 13rem;
                    padding: 0.5rem;

                    display: grid;
                    gap: 0.5rem;
                    grid-auto-flow: row;

                    position: sticky;

                    z-index: 3;

                    transition: top 64ms ease-out;
                `,
            ]}
            style={{ top: `calc(0.5rem + ${topOffset}px)` }}
        >
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

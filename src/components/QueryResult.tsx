import { Optic } from "@/lib/hooks"
import type { Value, ViewerProps } from "@/viewers/types"
import { Icon } from "@iconify/react"
import type { JSX } from "preact"
import { css } from "preact-css-extract/comptime"

export const QueryResult = ({
    query,
    queryHeight,
    resultPreview,
    resultPreviewValue,
    PreviewViewer,

    suggestQuery,
}: {
    query: string
    queryHeight: number
    resultPreview: { value?: unknown; elapsedMs?: number } | null
    resultPreviewValue: Value | null
    PreviewViewer: ((props: ViewerProps<any>) => JSX.Element) | null

    suggestQuery: (completion: string) => void
}) => {
    return (
        <div
            classList={[
                css`
                    display: grid;
                    grid-template-columns: auto 1fr auto;
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
                            suggestQuery={suggestQuery}
                            oValue={Optic.of<Value>(resultPreviewValue)}
                            maxHeight="30vh"
                        />
                    ) : (
                        <code>{JSON.stringify(resultPreview?.value)}</code>
                    )}
                </div>
            </div>
            {resultPreview?.elapsedMs !== undefined && (
                <div
                    class={css`
                        align-self: end;
                        grid-column: 3 / 4;
                        color: var(--text-dimmed);
                    `}
                >
                    {resultPreview.elapsedMs.toFixed(1)}ms
                </div>
            )}
        </div>
    )
}

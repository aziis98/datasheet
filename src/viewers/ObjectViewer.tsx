import { Editable } from "@/components/Editable"
import type { Optic } from "@/lib/hooks"
import { css } from "preact-css-extract/comptime"
import { scrollAreaClass } from "./styles"
import type { ObjectValue, ViewerProps } from "./types"

const PrimitiveArray = ({
    oData,
    suggestQuery,
}: {
    oData: Optic<any[]>
    suggestQuery: ((completion: string) => void) | undefined
}) => {
    const items = oData.items()
    return (
        <div
            class={css`
                display: grid;
                grid-template-columns: auto 1fr;

                > .row {
                    display: grid;
                    grid-template-columns: subgrid;
                    grid-column: span 2;

                    min-height: 24px;

                    > .index {
                        cursor: pointer;

                        font-size: 14px;
                        line-height: 24px;

                        font-weight: 600;
                        display: grid;

                        padding: 0 0.25rem;

                        background: var(--bg-header);
                        border-right: 1px solid var(--border);
                        border-bottom: 1px solid var(--border);
                    }

                    > .value {
                        display: grid;
                        border-bottom: 1px solid var(--border);
                    }

                    &:last-child > .index {
                        border-bottom: none;
                    }

                    &:last-child > .value {
                        border-bottom: none;
                    }
                }
            `}
        >
            {items.map((oItem, index) => {
                const suggestQueryForIndex = (completion?: string) => {
                    suggestQuery?.(`[${index}]${completion ?? ""}`)
                }

                return (
                    <div class="row">
                        <div class="index" onClick={() => suggestQueryForIndex()}>
                            {index}
                        </div>
                        <div class="value">
                            <PrimitiveAny oData={oItem} suggestQuery={suggestQueryForIndex} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const PrimitiveObject = ({
    oData,
    suggestQuery,
}: {
    oData: Optic<Record<string, any>>
    suggestQuery: ((completion: string) => void) | undefined
}) => {
    const entries = oData.entriesKV()
    return (
        <div
            class={css`
                display: grid;
                grid-template-columns: auto 1fr;

                > .row {
                    display: grid;
                    grid-template-columns: subgrid;
                    grid-column: span 2;

                    min-height: 24px;

                    > .key {
                        cursor: pointer;

                        font-size: 14px;
                        line-height: 24px;

                        font-weight: 600;
                        display: grid;

                        padding: 0 0.25rem;

                        background: var(--bg-header);
                        border-right: 1px solid var(--border);
                        border-bottom: 1px solid var(--border);
                    }

                    > .value {
                        display: grid;
                        border-bottom: 1px solid var(--border);
                    }

                    &:last-child > .key {
                        border-bottom: none;
                    }

                    &:last-child > .value {
                        border-bottom: none;
                    }
                }
            `}
        >
            {entries.map(([oKey, oValue]) => {
                const key = oKey.get()

                const suggestQueryForKey = (completion?: string) => {
                    suggestQuery?.(`.${key}${completion ?? ""}`)
                }

                return (
                    <div class="row">
                        <div class="key" onClick={() => suggestQueryForKey()}>
                            {key}
                        </div>
                        <div class="value">
                            <PrimitiveAny oData={oValue} suggestQuery={suggestQueryForKey} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const PrimitiveAny = ({
    oData,
    suggestQuery,
}: {
    oData: Optic<any>
    suggestQuery: ((completion: string) => void) | undefined
}) => {
    const value = oData.get()
    if (Array.isArray(value)) {
        return <PrimitiveArray oData={oData as Optic<any[]>} suggestQuery={suggestQuery} />
    } else if (value !== null && typeof value === "object") {
        return <PrimitiveObject oData={oData as Optic<Record<string, any>>} suggestQuery={suggestQuery} />
    } else {
        return (
            <span
                class={css`
                    display: grid;
                    padding: 0.125rem 0.25rem;
                `}
            >
                <Editable oValue={oData} />
            </span>
        )
    }
}

export const ObjectViewer = ({
    oValue,

    maxHeight,
    suggestQuery,
}: ViewerProps<ObjectValue>) => {
    const oData = oValue.prop("data")

    return (
        <div classList={[scrollAreaClass]} style={{ maxHeight }}>
            <PrimitiveAny oData={oData} suggestQuery={suggestQuery} />
        </div>
    )
}

import { arrayRepeat } from "@/lib/utils"
import { css } from "preact-css-extract/comptime"
import type { TableValue, Value, ViewerProps } from "./types"

type RenderedCell = {
    content: string
    align?: "left" | "right" | "center"
    kind?: "numeric" | "date" | "identifier"
}

// Design system values inlined directly (based on docs/design.json)

const scrollAreaClass = css`
    position: relative;
    overflow: auto;
    max-height: 50vh;

    color: var(--text);
    background: var(--bg);
`

const tableClass = css`
    width: 100%;
    border-collapse: collapse;
    font-size: 16px;

    thead {
        position: sticky;
        top: 0;
        z-index: 1;
    }

    thead th {
        background: var(--bg-header);

        text-transform: uppercase;
        letter-spacing: 0.0625rem;

        font-size: 12px;
        font-weight: 600;
        color: var(--text);

        padding: 0.25rem 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--border);
    }

    thead th:not(:first-child) {
        border-left: 1px solid var(--border);
    }

    tbody td {
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--border-divider);
        border-right: 1px solid var(--border-divider);
        white-space: nowrap;
    }

    tbody td:last-child,
    thead th:last-child {
        border-right: none;
    }

    tbody tr:last-child td {
        border-bottom: none;
    }

    tbody tr:hover td {
        background: var(--bg-hover);
    }

    td[data-align="right"] {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    td[data-align="center"] {
        text-align: center;
    }

    td[data-kind="numeric"] {
        font-size: 14px;
        font-family: "JetBrains Mono Variable", monospace;
        font-variant-numeric: tabular-nums;
    }

    td[data-kind="date"] {
        font-size: 14px;
        font-family: "JetBrains Mono Variable", monospace;
        font-variant-numeric: tabular-nums;
    }

    tbody td:first-child {
        border-left: none;
    }

    tbody td:focus-visible {
        outline: 2px solid light-dark(#6f74ff, #8a8aff);
        outline-offset: -2px;
    }
`

const renderCell = (cell: Value): RenderedCell => {
    if (cell.type === "text") {
        const trimmed = cell.content.trim()

        if (/^-?\d[\d_]*(?:\.\d+)?$/.test(trimmed)) {
            return { content: cell.content, align: "right", kind: "numeric" }
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return { content: cell.content, align: "right", kind: "date" }
        }

        return { content: cell.content }
    }

    return { content: `[${cell.type}]` }
}

export const TableViewer = ({ value }: ViewerProps<TableValue>) => {
    const columnsOptic = value.prop("columns")
    const rowsOptic = value.prop("data")

    const columnNames = columnsOptic.get()
    const rows = rowsOptic.items()

    // const summaryText = `${rowsOptic.get().length} rows × ${columnNames.length} columns`

    return (
        <div class={scrollAreaClass}>
            <table class={tableClass}>
                <thead>
                    <tr>
                        {columnNames.map(column => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {arrayRepeat(
                        rows.map(row => (
                            <tr>
                                {row.items().map((cell, columnIndex) => {
                                    const { content, align, kind } = renderCell(cell.get())
                                    const columnKey = columnNames[columnIndex] ?? `${columnIndex}`

                                    return (
                                        <td
                                            key={columnKey}
                                            data-align={align}
                                            data-kind={kind}
                                            title={typeof content === "string" ? content : undefined}
                                        >
                                            {content}
                                        </td>
                                    )
                                })}
                            </tr>
                        )),
                        10
                    )}
                </tbody>
            </table>
        </div>
    )
}

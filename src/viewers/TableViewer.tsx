import { css } from "preact-css-extract/comptime"
import { useState } from "preact/hooks"
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
    max-height: 60vh;

    color: var(--text);
    background: var(--bg);

    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: hsl(210 8% 50% / 0.5);
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: hsl(210 8% 50% / 0.75);
    }
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
        white-space: nowrap;

        font-size: 12px;
        font-weight: 600;
        color: var(--text);

        padding: 0.25rem 0.5rem;
        text-align: left;
        border-bottom: 1px solid var(--border);

        &.selected {
            --border: hsl(210 50% 80%);
            background: hsl(210 50% 90%);
        }
    }

    thead th:not(:first-child) {
        border-left: 1px solid var(--border);
    }

    tbody td {
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--border-divider);
        border-right: 1px solid var(--border-divider);
        white-space: nowrap;

        &:first-child {
            width: 0;
            font-size: 13px;
        }
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

export const TableViewer = ({
    value,

    maxHeight,
    suggestQuery,
}: ViewerProps<TableValue>) => {
    const columnsOptic = value.prop("columns")
    const rowsOptic = value.prop("data")

    const columnNames = columnsOptic.get()
    const rows = rowsOptic.items()

    const [selectedColumns, setSelectedColumns] = useState<string[]>([])

    // const summaryText = `${rowsOptic.get().length} rows × ${columnNames.length} columns`

    return (
        <div class={scrollAreaClass} style={{ maxHeight }}>
            <table class={tableClass}>
                <thead>
                    <tr>
                        <th></th>
                        {columnNames.map(column => (
                            <th
                                key={column}
                                classList={selectedColumns.includes(column) ? "selected" : ""}
                                onClick={e => {
                                    if (e.shiftKey) {
                                        setSelectedColumns(selectedColumns => {
                                            const newSelectedColumns = selectedColumns.includes(column)
                                                ? selectedColumns.filter(col => col !== column)
                                                : columnNames.filter(
                                                      col => selectedColumns.includes(col) || col === column
                                                  )

                                            suggestQuery?.(entryId => {
                                                if (newSelectedColumns.length === 0) {
                                                    return ""
                                                }

                                                return `${entryId}.columns(${newSelectedColumns
                                                    .map(col => `"${col}"`)
                                                    .join(", ")})`
                                            })

                                            return newSelectedColumns
                                        })
                                    }
                                }}
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {
                        // arrayRepeat(
                        rows.map((row, rowIndex) => (
                            <tr>
                                <td data-align="right" data-kind="identifier">
                                    {rowIndex + 1}
                                </td>
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
                        ))
                        // ,
                        //     10
                        // )
                    }
                </tbody>
            </table>
        </div>
    )
}

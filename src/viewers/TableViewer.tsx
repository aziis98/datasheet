import { AutosizeInput } from "@/components/AutosizeInput"
import { ContextMenuItem, ContextMenuSeparator, useContextMenu } from "@/components/context-menu"
import { Optic, useClickOutside } from "@/lib/hooks"
import { css } from "preact-css-extract/comptime"
import { createPortal } from "preact/compat"
import { useRef, useState } from "preact/hooks"
import { scrollAreaClass } from "./styles"
import type { TableValue, TextValue, Value, ViewerProps } from "./types"

type RenderedCell = {
    content: string
    align?: "left" | "right" | "center"
    kind?: "numeric" | "date" | "identifier"
}

// Design system values inlined directly (based on docs/design.json)

const tableClass = css`
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;

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
            color: hsl(210 60% 30%);
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
            font-family: "JetBrains Mono Variable", monospace;
            font-size: 11px;
            vertical-align: middle;
        }
    }

    tbody td:last-child,
    thead th:last-child {
        border-right: none;
    }

    tbody {
        tr:last-child td {
            border-bottom: none;
        }

        tr:hover,
        td:hover {
            background: var(--bg-hover);
        }
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

function createRowHandlers(
    oData: Optic<Value[][]>,
    columns: string[],
    rowIndex: number
): {
    addRow?: (() => void) | undefined
    duplicateRow?: (() => void) | undefined
    moveRow?: ((direction: "up" | "down") => void) | undefined
    deleteRow?: (() => void) | undefined
} {
    return !oData.isReadonly
        ? {
              addRow: () => {
                  oData.update(rows => {
                      const newRows = [...rows]
                      const emptyRow: Value[] = columns.map(() => ({
                          type: "text",
                          content: "",
                      }))
                      newRows.splice(rowIndex + 1, 0, emptyRow)
                      return newRows
                  })
              },
              duplicateRow: () => {
                  oData.update(rows => {
                      const newRows = [...rows]
                      const rowToDuplicate = rows[rowIndex]
                      newRows.splice(rowIndex + 1, 0, rowToDuplicate)
                      return newRows
                  })
              },
              moveRow: direction => {
                  oData.update(rows => {
                      if (rowIndex <= 0) return rows
                      const newRows = [...rows]
                      const targetIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1
                      if (targetIndex < 0 || targetIndex >= newRows.length) return rows

                      const temp = newRows[rowIndex]
                      newRows[rowIndex] = newRows[targetIndex]
                      newRows[targetIndex] = temp

                      return newRows
                  })
              },
              deleteRow: () => {
                  oData.update(rows => {
                      const newRows = rows.filter((_, index) => index !== rowIndex)
                      return newRows
                  })
              },
          }
        : {}
}

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

const EditableTableTextCell = ({ oValue }: { oValue: Optic<TextValue> }) => {
    const containerRef = useRef<HTMLTableCellElement>(null)
    const [containerRect, setContainerRect] = useState<{ x: number; y: number; width: number; height: number } | null>(
        null
    )

    const { align, kind } = renderCell(oValue.get())
    const oContent = oValue.prop("content")

    const editingRef = useRef<HTMLDivElement>(null)

    const [editing, setEditing] = useState<false | string>(false)

    const handleAccept = () => {
        oContent.set(editing as string)
        setEditing(false)
    }

    const handleCancel = () => {
        setEditing(false)
    }

    useClickOutside(editingRef, () => {
        handleAccept()
    })

    return (
        <td
            ref={containerRef}
            data-align={align}
            data-kind={kind}
            onClick={() => {
                console.log(oValue)
                if (oValue.isReadonly) return

                const rect = containerRef.current?.getBoundingClientRect()
                if (rect) {
                    setContainerRect({
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                    })
                }
                setEditing(oContent.get())
            }}
        >
            <span
                classList={[
                    css`
                        cursor: text;
                    `,
                    editing !== false &&
                        css`
                            opacity: 0.5;

                            &::after {
                                content: "...";
                                display: inline-block;

                                width: 0;
                            }
                        `,
                ]}
            >
                {oContent.get()}
            </span>

            {editing !== false &&
                createPortal(
                    <div
                        ref={editingRef}
                        class={css`
                            position: fixed;
                            z-index: 1000;

                            display: grid;
                        `}
                        style={{
                            left: containerRect ? `${containerRect.x}px` : "0px",
                            top: containerRect ? `${containerRect.y}px` : "0px",
                            width: containerRect ? `${containerRect.width}px` : "auto",
                            height: containerRect ? `${containerRect.height}px` : "auto",
                        }}
                    >
                        <AutosizeInput
                            autoFocus
                            classList={[
                                "card",
                                css`
                                    /* background: hsl(90, 75%, 80%); */
                                    box-sizing: content-box;

                                    font-family: "JetBrains Mono Variable", monospace;
                                    font-variant-numeric: tabular-nums;
                                    font-size: 13px;

                                    padding: 0.45rem 0.25rem;
                                `,
                            ]}
                            oValue={Optic.of(editing, updater =>
                                setEditing(previous => updater(previous === false ? "" : previous))
                            )}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    handleAccept()
                                }
                                if (e.key === "Escape") {
                                    handleCancel()
                                }
                            }}
                            // disable autocomplete etc
                            spellcheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                    </div>,
                    document.getElementById("overlay")!
                )}
        </td>
    )
}

const ContextMenuTableColumn = ({
    column,
    suggestQuery,
}: {
    column: string
    suggestQuery?: (completion: string) => void
}) => {
    return (
        <>
            <div class="title">{column}</div>
            <ContextMenuSeparator />
            <ContextMenuItem
                icon="ph:sort-ascending"
                label="Sort Ascending"
                onClick={() => suggestQuery?.(`.sort("${column}")`)}
            />
            <ContextMenuItem
                icon="ph:sort-descending"
                label="Sort Descending"
                onClick={() => suggestQuery?.(`.sort("${column}", "desc")`)}
            />
            <ContextMenuItem label="Filter..." />
        </>
    )
}

const ContextMenuTableRow = ({
    tableName,
    rowIndex,

    addRow,
    duplicateRow,
    moveRow,
    deleteRow,

    suggestQuery,
}: {
    tableName: string
    rowIndex: number

    addRow?: () => void
    duplicateRow?: () => void
    moveRow?: (direction: "up" | "down") => void
    deleteRow?: () => void

    suggestQuery?: (completion: string) => void
}) => {
    return (
        <>
            <div class="title">
                {tableName} &rsaquo; Row {rowIndex + 1}
            </div>

            {(addRow || duplicateRow || deleteRow) && <ContextMenuSeparator />}
            {addRow && <ContextMenuItem icon="ph:plus" label="Add Row" onClick={() => addRow?.()} />}
            {duplicateRow && <ContextMenuItem icon="ph:copy" label="Copy Row" onClick={() => duplicateRow?.()} />}
            {deleteRow && <ContextMenuItem icon="ph:trash" label="Delete Row" onClick={() => deleteRow?.()} />}

            {moveRow && (
                <>
                    <ContextMenuSeparator />
                    <ContextMenuItem icon="ph:arrow-up" label="Move Up" onClick={() => moveRow?.("up")} />
                    <ContextMenuItem icon="ph:arrow-down" label="Move Down" onClick={() => moveRow?.("down")} />
                </>
            )}

            <ContextMenuSeparator />
            <ContextMenuItem
                icon="ph:selection"
                label="Select Row"
                onClick={() => suggestQuery?.(`.row(${rowIndex})`)}
            />
        </>
    )
}

const TableContent = ({
    oData,
    columns,
    selectedColumns,
    setSelectedColumns,
    suggestQuery,
}: {
    oData: Optic<Value[][]>
    columns: string[]
    selectedColumns: string[]
    setSelectedColumns: (updater: (prev: string[]) => string[]) => void
    suggestQuery?: (completion: string) => void
}) => {
    const { showContextMenu } = useContextMenu()

    return (
        <table class={tableClass}>
            <thead>
                <tr>
                    <th></th>
                    {columns.map(column => (
                        <th
                            key={column}
                            title={column}
                            classList={selectedColumns.includes(column) ? "selected" : ""}
                            onContextMenu={e => {
                                e.preventDefault()
                                showContextMenu(e, ContextMenuTableColumn, { column, suggestQuery })
                            }}
                            onPointerDown={e => {
                                if (e.buttons === 1 /* Left button */ && e.shiftKey) {
                                    setSelectedColumns(selectedColumns => {
                                        const newSelectedColumns = selectedColumns.includes(column)
                                            ? selectedColumns.filter(col => col !== column)
                                            : columns.filter(col => selectedColumns.includes(col) || col === column)

                                        suggestQuery?.(
                                            newSelectedColumns.length === 0
                                                ? ""
                                                : `.columns(${newSelectedColumns.map(col => `"${col}"`).join(", ")})`
                                        )

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
                {oData.items().map((oRow, rowIndex) => (
                    <tr
                        onContextMenu={e => {
                            e.preventDefault()
                            showContextMenu(e, ContextMenuTableRow, {
                                tableName: "Table",
                                rowIndex,
                                suggestQuery,

                                ...createRowHandlers(oData, columns, rowIndex),
                            })
                        }}
                    >
                        <td data-align="right" data-kind="identifier">
                            {rowIndex + 1}
                        </td>
                        {oRow.items().map((cell, columnIndex) => {
                            const { content, align, kind } = renderCell(cell.get())
                            const columnKey = columns[columnIndex] ?? `${columnIndex}`

                            const textValue = cell.trySubtype(cell => cell.type === "text")
                            if (textValue) {
                                return <EditableTableTextCell oValue={textValue} />
                            }

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
                ))}
            </tbody>
        </table>
    )
}

export const TableViewer = ({
    oValue,

    maxHeight,
    suggestQuery,
}: ViewerProps<TableValue>) => {
    const { columns } = oValue.get()
    const oData = oValue.prop("data")

    const [selectedColumns, setSelectedColumns] = useState<string[]>([])

    const containerRef = useRef<HTMLDivElement>(null)

    useClickOutside(containerRef, () => {
        setSelectedColumns([])
    })

    return (
        <div ref={containerRef} class={scrollAreaClass} style={{ maxHeight }}>
            <TableContent
                oData={oData}
                columns={columns}
                selectedColumns={selectedColumns}
                setSelectedColumns={setSelectedColumns}
                suggestQuery={suggestQuery}
            />
        </div>
    )
}

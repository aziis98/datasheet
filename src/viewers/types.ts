import type { Optic } from "../lib/hooks"

export type TextValue = {
    type: "text"
    content: string
}

export type TableValue = {
    type: "table"
    data: Value[][]
    columns: string[]
}

export type Value = TextValue | TableValue

export type ViewerProps<V extends Value> = {
    oValue: Optic<V>

    maxHeight?: string
    suggestQuery?: (completion: string) => void
}

// Helper type for manipulating values

export class ValueWrapper<V extends Value> {
    inner: V

    constructor(value: V) {
        this.inner = value
    }

    get type(): V["type"] {
        return this.inner.type
    }

    columns(this: ValueWrapper<TableValue>, ...columnNames: string[]): ValueWrapper<TableValue> {
        const columnIndices = columnNames.map(name => this.inner.columns.indexOf(name)).filter(index => index !== -1)

        const newData = this.inner.data.map(row => columnIndices.map(index => row[index]))

        const newValue: TableValue = {
            type: "table",
            columns: columnNames,
            data: newData,
        }

        return new ValueWrapper<TableValue>(newValue)
    }

    join(
        this: ValueWrapper<TableValue>,
        other: ValueWrapper<TableValue>,
        onThis: string,
        onOther: string | undefined = undefined,
        {
            lhsPrefix = "0",
            rhsPrefix = "1",
        }: {
            lhsPrefix?: string
            rhsPrefix?: string
        } = {}
    ): ValueWrapper<TableValue> {
        onOther = onOther ?? other.inner.columns[0]

        const thisColIndex = this.inner.columns.indexOf(onThis)
        const otherColIndex = other.inner.columns.indexOf(onOther)

        if (thisColIndex === -1 || otherColIndex === -1) {
            throw new Error("Join columns not found")
        }

        const newColumns = [
            ...this.inner.columns.map(col => `${lhsPrefix}.${col}`),
            ...other.inner.columns.map(col => `${rhsPrefix}.${col}`),
        ]

        const otherIndexMap = new Map<string, Value[]>()
        for (const row of other.inner.data) {
            const keyCell = row[otherColIndex]
            const key = keyCell.type === "text" ? keyCell.content : ""
            otherIndexMap.set(key, row)
        }

        const newData: Value[][] = []
        for (const row of this.inner.data) {
            const keyCell = row[thisColIndex]
            const key = keyCell.type === "text" ? keyCell.content : ""

            const otherRow = otherIndexMap.get(key)
            if (otherRow) {
                newData.push([...row, ...otherRow])
            }
        }

        return new ValueWrapper<TableValue>({
            type: "table",
            columns: newColumns,
            data: newData,
        })
    }

    /**
     * Applies a mapping function to each row of the table, returning a new table.
     * The mapping function can either be a function that takes a row and returns an object
     * with new column values, or an object mapping column names to functions that transform
     * individual cell values.
     */
    map(
        this: ValueWrapper<TableValue>,
        mapFn: ((row: string[]) => Record<string, string>) | Record<string, (cell: string) => string>,
        newColumnNames: Record<string, string> = {}
    ): ValueWrapper<TableValue> {
        // let newData: Value[][]

        if (typeof mapFn === "function") {
            const newData: Record<string, any>[] = this.inner.data.map(row =>
                mapFn(row.map(cell => (cell.type === "text" ? cell.content : "")))
            )

            return new ValueWrapper<TableValue>({
                type: "table",
                columns: Object.keys(newData[0]),
                data: newData.map(obj =>
                    Object.values(obj).map(content => ({
                        type: "text",
                        content: content.toString(),
                    }))
                ),
            })
        } else {
            return new ValueWrapper<TableValue>({
                type: "table",
                columns: this.inner.columns.map(col => newColumnNames[col] ?? col),
                data: this.inner.data.map(row =>
                    row.map((cell, idx) => {
                        const colName = this.inner.columns[idx]
                        const cellMapper = mapFn[colName]
                        return cellMapper
                            ? {
                                  type: "text",
                                  content: cellMapper(cell.type === "text" ? cell.content : "").toString(),
                              }
                            : cell
                    })
                ),
            })
        }
    }
}

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

export type ObjectValue = {
    type: "object"
    data: any
}

export type Value = TextValue | TableValue | ObjectValue

export type ViewerProps<V extends Value> = {
    oValue: Optic<V>

    maxHeight?: string
    suggestQuery?: (completion: string) => void
}

// Helper type for manipulating values

const liftMapping = (fn: (value: string) => string): ((value: Value) => Value) => {
    return (value: Value): Value => {
        if (value.type === "text") {
            return {
                type: "text",
                content: fn(value.content),
            }
        } else {
            throw new Error("liftMapping only supports TextValue")
        }
    }
}

export class ValueWrapper<V extends Value> {
    inner: V

    constructor(value: V) {
        this.inner = value

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                return this.#interceptGet(target, prop, receiver)
            },
        })
    }

    #interceptGet(target: ValueWrapper<V>, prop: string | symbol, receiver: any) {
        if (this.inner.type === "object" && typeof this.inner.data === "object" && this.inner.data !== null) {
            if (typeof prop === "string" && prop in this.inner.data) {
                const propValue = this.inner.data[prop]
                return new ValueWrapper<any>({
                    type: "object",
                    data: propValue,
                })
            }
        }

        return Reflect.get(target, prop, receiver)
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

    mapRows(
        this: ValueWrapper<TableValue>,
        mapFn: (row: string[]) => Record<string, string>
    ): ValueWrapper<TableValue> {
        const newData: Record<string, TextValue>[] = this.inner.data
            .map(row => mapFn(row.map(cell => (cell.type === "text" ? cell.content : ""))))
            .map(rowRecord =>
                Object.fromEntries(
                    Object.entries(rowRecord).map(([key, textValue]) => [
                        key,
                        {
                            type: "text",
                            content: textValue.toString(),
                        },
                    ])
                )
            )

        const newColumns = Object.keys(newData[0] || {})

        for (const obj of newData) {
            const objKeys = Object.keys(obj)
            if (objKeys.length !== newColumns.length || !objKeys.every(key => newColumns.includes(key))) {
                throw new Error("All rows must have the same columns after mapping")
            }
        }

        return new ValueWrapper<TableValue>({
            type: "table",
            columns: newColumns,
            data: newData.map(rowRecord => newColumns.map(col => rowRecord[col])),
        })
    }

    mapColumns(
        this: ValueWrapper<TableValue>,
        mapFn: Record<string, (cell: string) => string>,
        newColumnNames: Record<string, string> = {}
    ): ValueWrapper<TableValue> {
        return new ValueWrapper<TableValue>({
            type: "table",
            columns: this.inner.columns.map(col => newColumnNames[col] ?? col),
            data: this.inner.data.map(row =>
                row.map((cell, idx) => {
                    const columnName = this.inner.columns[idx]
                    return liftMapping(mapFn[columnName])(cell)
                })
            ),
        })
    }

    map(
        this: ValueWrapper<TableValue>,
        mapFn: ((row: string[]) => Record<string, string>) | Record<string, (cell: string) => string>,
        newColumnNames: Record<string, string> = {}
    ): ValueWrapper<TableValue> {
        if (typeof mapFn === "function") {
            return this.mapRows(mapFn)
        } else {
            return this.mapColumns(mapFn, newColumnNames)
        }
    }

    filterRows(this: ValueWrapper<TableValue>, filterFn: (row: string[]) => boolean): ValueWrapper<TableValue> {
        const newData = this.inner.data.filter(row =>
            filterFn(row.map(cell => (cell.type === "text" ? cell.content : "")))
        )

        return new ValueWrapper<TableValue>({
            type: "table",
            columns: this.inner.columns,
            data: newData,
        })
    }

    filterColumns(
        this: ValueWrapper<TableValue>,
        filterFn: Record<string, (cell: string) => boolean>
    ): ValueWrapper<TableValue> {
        const newData = this.inner.data.filter(row =>
            row.every((cell, idx) => {
                const colName = this.inner.columns[idx]
                const cellFilter = filterFn[colName]
                return cellFilter ? cellFilter(cell.type === "text" ? cell.content : "") : true
            })
        )

        return new ValueWrapper<TableValue>({
            type: "table",
            columns: this.inner.columns,
            data: newData,
        })
    }

    filter(
        this: ValueWrapper<TableValue>,
        filterFn: ((row: string[]) => boolean) | Record<string, (cell: string) => boolean>
    ): ValueWrapper<TableValue> {
        if (typeof filterFn === "function") {
            return this.filterRows(filterFn)
        } else {
            return this.filterColumns(filterFn)
        }
    }

    sort(this: ValueWrapper<TableValue>, column: string, direction: "asc" | "desc" = "asc"): ValueWrapper<TableValue> {
        const colIndex = this.inner.columns.indexOf(column)
        if (colIndex === -1) {
            throw new Error("Sort column not found")
        }

        const isNumericColumn = this.inner.data.every(row => {
            const cell = row[colIndex]
            if (cell.type === "text") {
                return !isNaN(parseFloat(cell.content))
            }
            return false
        })

        const compareFn = isNumericColumn
            ? (a: string, b: string) => parseFloat(a) - parseFloat(b)
            : (a: string, b: string) => a.localeCompare(b)

        const newData = [...this.inner.data].sort((a, b) => {
            const aCell = a[colIndex]
            const bCell = b[colIndex]

            const aValue = aCell.type === "text" ? aCell.content : ""
            const bValue = bCell.type === "text" ? bCell.content : ""

            const cmp = compareFn(aValue, bValue)
            return direction === "desc" ? -cmp : cmp
        })

        return new ValueWrapper<TableValue>({
            type: "table",
            columns: this.inner.columns,
            data: newData,
        })
    }
}

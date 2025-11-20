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

        // pick the smaller table to build the lookup map
        const [smallTable, smallColIndex, largeTable, largeColIndex] =
            this.inner.data.length <= other.inner.data.length
                ? [this, thisColIndex, other, otherColIndex]
                : [other, otherColIndex, this, thisColIndex]

        const lookup = new Map<string, Value[]>()

        for (const row of smallTable.inner.data) {
            const key = row[smallColIndex].type === "text" ? row[smallColIndex].content : ""
            lookup.set(key, row)
        }

        const joinedColumns = [
            ...this.inner.columns.map(col => `${lhsPrefix}.${col}`),
            ...other.inner.columns.filter((_, idx) => idx !== otherColIndex).map(col => `${rhsPrefix}.${col}`),
        ]

        const joinedData: Value[][] = []

        for (const row of largeTable.inner.data) {
            const key = row[largeColIndex].type === "text" ? row[largeColIndex].content : ""
            const matchingRow = lookup.get(key)

            if (matchingRow) {
                const newRow = [...row, ...matchingRow.filter((_, idx) => idx !== smallColIndex)]
                joinedData.push(newRow)
            }
        }

        return new ValueWrapper<TableValue>({
            type: "table",
            columns: joinedColumns,
            data: joinedData,
        })
    }
}

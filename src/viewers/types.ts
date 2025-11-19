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
    value: Optic<V>

    maxHeight?: string
    suggestQuery?: (completion: (entryId: string) => string) => void
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
}

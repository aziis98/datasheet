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
}

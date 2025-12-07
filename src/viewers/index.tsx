import type { JSX } from "preact"
import type { Value, ViewerProps } from "./types"

const viewerModules: Record<string, any> = import.meta.glob("./*.tsx", { eager: true })

console.log("Loaded viewer modules:", Object.keys(viewerModules))

export const ViewerIcons: Record<Value["type"], string> = {
    text: "ph:text-t",
    table: "ph:database",
    object: "ph:cube",
}

export const Viewers = Object.fromEntries(
    Object.entries(viewerModules)
        .filter(([path]) => path.match(/Viewer\.tsx$/))
        .map(([_path, module]) => {
            const viewerKey = Object.keys(module)[0]

            const viewerName = viewerKey.toLowerCase().replace(/viewer$/, "")
            console.log(`Registered viewer: "${viewerName}"`)

            return [viewerName, (module as any)[viewerKey] as (props: ViewerProps<any>) => JSX.Element]
        })
)

export const exportValue = (
    value: Value
): {
    mimeType: string
    data: string | Uint8Array
} => {
    switch (value.type) {
        case "text":
            return {
                mimeType: "text/plain",
                data: value.content,
            }
        case "table":
            const csvRows = value.data.map(row =>
                row
                    .map(cell => {
                        if (cell.type === "text") {
                            const content = cell.content.replace(/"/g, '""')
                            if (content.includes(",") || content.includes("\n") || content.includes('"')) {
                                return `"${content}"`
                            }
                            return content
                        }
                        return ""
                    })
                    .join(",")
            )
            const csvContent = csvRows.join("\n")
            return {
                mimeType: "text/csv",
                data: csvContent,
            }
        case "object":
            return {
                mimeType: "application/json",
                data: JSON.stringify(value.data, null, 2),
            }
    }
}

import type { JSX } from "preact"
import type { Value, ViewerProps } from "./types"

const viewerModules: Record<string, any> = import.meta.glob("./*.tsx", { eager: true })

console.log("Loaded viewer modules:", Object.keys(viewerModules))

export const ViewerIcons: Record<Value["type"], string> = {
    text: "ph:text-t",
    table: "ph:database",
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

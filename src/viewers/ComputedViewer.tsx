import { Viewers } from "."
import type { ComputedValue, ViewerProps } from "./types"

export const ComputedViewer = ({ oValue, maxHeight, suggestQuery }: ViewerProps<ComputedValue>) => {
    const { lastResult } = oValue.get()
    if (!lastResult) {
        return <div>Computing...</div>
    }

    console.log("ComputedViewer rendering lastResult:", lastResult)

    const Viewer = Viewers[lastResult.type]

    return <Viewer oValue={oValue.prop("lastResult")} maxHeight={maxHeight} suggestQuery={suggestQuery} />
}

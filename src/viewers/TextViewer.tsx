import { AutosizeInput } from "@/components/AutosizeInput"
import { css } from "preact-css-extract/comptime"
import type { TextValue, ViewerProps } from "./types"

export const TextViewer = ({ oValue }: ViewerProps<TextValue>) => {
    return (
        <AutosizeInput
            classList={css`
                box-sizing: content-box;

                font-family: "Source Sans Pro", sans-serif;
                font-size: 16px;
                line-height: 1.5;
            `}
            oValue={oValue.prop("content")}
        />
    )
}

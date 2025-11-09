import { css } from "preact-css-extract/comptime"
import type { TextValue, ViewerProps } from "./types"

export const TextViewer = ({ value }: ViewerProps<TextValue>) => {
    const content = value.prop("content")

    return (
        <textarea
            classList={[
                "card",
                css`
                    width: 100%;
                    background: #fff;

                    resize: vertical;

                    font-family: "Source Sans Pro", sans-serif;
                    font-size: 16px;
                    line-height: 1.5;

                    &:focus {
                        outline: none;
                    }
                `,
            ]}
            rows={Math.max(2, content.get().split("\n").length)}
            value={content.get()}
            onInput={e => content.update(() => e.currentTarget.value)}
        />
    )
}

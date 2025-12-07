import { css } from "preact-css-extract/comptime"

export const scrollAreaClass = css`
    position: relative;
    overflow: auto;
    max-height: 60vh;

    color: var(--text);
    background: var(--bg);

    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: hsl(210 8% 50% / 0.5);
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: hsl(210 8% 50% / 0.75);
    }
`
